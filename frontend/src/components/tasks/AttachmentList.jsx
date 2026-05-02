import { useEffect, useRef, useState } from 'react';
import { errorMessage } from '../../api/client';
import {
  getAttachments,
  uploadAttachment,
  deleteAttachment,
} from '../../api/attachmentApi';

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function isImage(mime) {
  return typeof mime === 'string' && mime.startsWith('image/');
}

function AttachmentList({ taskId, canEdit, currentUserEmail }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    getAttachments(taskId)
      .then((res) => { if (!cancelled) setItems(res.data || []); })
      .catch((err) => { if (!cancelled) setLoadError(errorMessage(err, 'Could not load attachments.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [taskId]);

  async function handleFiles(fileList) {
    if (!fileList || fileList.length === 0 || uploading) return;
    setUploadError(null);
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of Array.from(fileList)) {
        const { data } = await uploadAttachment(taskId, file);
        uploaded.push(data);
      }
      setItems((prev) => [...uploaded.reverse(), ...prev]);
    } catch (err) {
      setUploadError(errorMessage(err, 'Upload failed.'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (canEdit) handleFiles(e.dataTransfer.files);
  }

  async function handleDelete(att) {
    if (!window.confirm(`Delete “${att.file_name}”?`)) return;
    const before = items;
    setItems((prev) => prev.filter((a) => a.id !== att.id));
    try {
      await deleteAttachment(taskId, att.id);
    } catch (err) {
      setItems(before);
      alert(errorMessage(err, 'Could not delete attachment.'));
    }
  }

  return (
    <section className="td-card td-attach">
      <h3 className="td-card-title">
        Attachments
        {items.length > 0 && <span className="td-count"> · {items.length}</span>}
      </h3>

      {canEdit && (
        <label
          className={`td-attach-drop ${dragOver ? 'is-over' : ''} ${uploading ? 'is-busy' : ''}`}
          onDragOver={(e) => { e.preventDefault(); if (canEdit && !uploading) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="td-attach-input"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <span className="td-attach-drop-label">
            {uploading
              ? 'Uploading…'
              : dragOver
              ? 'Drop to upload'
              : 'Drop files here or click to choose (max 10 MB each)'}
          </span>
        </label>
      )}

      {uploadError && <p className="dash-error td-attach-error">{uploadError}</p>}
      {loadError && <p className="dash-error">{loadError}</p>}

      {loading ? (
        <div className="dash-skel td-skel-row" />
      ) : items.length === 0 ? (
        <p className="dash-empty">No files attached.</p>
      ) : (
        <ul className="td-attach-list">
          {items.map((a) => {
            const canDelete = canEdit &&
              (a.uploader_email === currentUserEmail || a.uploaded_by === undefined);
            return (
              <li key={a.id} className="td-attach-row">
                <a
                  className="td-attach-link"
                  href={a.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <span className="td-attach-thumb" aria-hidden="true">
                    {isImage(a.mime_type) ? (
                      <img src={a.file_url} alt="" loading="lazy" />
                    ) : (
                      <span className="td-attach-ext">
                        {(a.file_name.split('.').pop() || 'FILE').slice(0, 4).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="td-attach-meta">
                    <span className="td-attach-name">{a.file_name}</span>
                    <span className="td-attach-sub">
                      {formatBytes(a.file_size)}
                      {a.uploader_name && ` · ${a.uploader_name}`}
                    </span>
                  </span>
                </a>
                {canDelete && (
                  <button
                    type="button"
                    className="td-attach-del"
                    onClick={() => handleDelete(a)}
                    aria-label={`Delete ${a.file_name}`}
                    title="Delete"
                  >
                    ×
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default AttachmentList;
