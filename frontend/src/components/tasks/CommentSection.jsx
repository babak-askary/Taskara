import { useEffect, useState } from 'react';
import { getComments, addComment, deleteComment } from '../../api/taskApi';
import { errorMessage } from '../../api/client';
import { onSocketEvent } from '../../services/socket';
import { relativeTime } from '../../utils/dateFormat';
import { useToast } from '../../hooks/useToast';

function CommentSection({ taskId, currentUserEmail }) {
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  // Load comments when the task id changes
  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    setLoading(true);
    getComments(taskId)
      .then((res) => { if (!cancelled) setComments(res.data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [taskId]);

  // Live new-comment events for this task
  useEffect(() => {
    if (!taskId) return;
    return onSocketEvent('task:comment', ({ task_id, comment }) => {
      if (task_id !== taskId || !comment) return;
      setComments((prev) => (prev.find((c) => c.id === comment.id) ? prev : [comment, ...prev]));
    });
  }, [taskId]);

  async function handleAdd(e) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || posting) return;
    setPosting(true);
    try {
      const { data } = await addComment(taskId, { content });
      setComments((prev) => [data, ...prev]);
      setDraft('');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not post comment.'));
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(c) {
    if (!window.confirm('Delete this comment?')) return;
    const before = comments;
    setComments((prev) => prev.filter((x) => x.id !== c.id));
    try {
      await deleteComment(taskId, c.id);
    } catch (err) {
      setComments(before);
      toast.error(errorMessage(err, 'Could not delete comment.'));
    }
  }

  return (
    <section className="td-card">
      <h3 className="td-card-title">
        Comments
        {comments.length > 0 && <span className="td-count"> · {comments.length}</span>}
      </h3>

      <form className="td-comment-form" onSubmit={handleAdd}>
        <textarea
          className="td-comment-input"
          placeholder="Write a comment…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          disabled={posting}
          maxLength={5000}
        />
        <button
          type="submit"
          className="td-comment-btn"
          disabled={!draft.trim() || posting}
        >
          {posting ? 'Posting…' : 'Post'}
        </button>
      </form>

      {loading ? (
        <div className="dash-skel td-skel-row" />
      ) : comments.length === 0 ? (
        <p className="dash-empty">Be the first to comment.</p>
      ) : (
        <ul className="td-comments">
          {comments.map((c) => {
            const isAuthor = c.author_email && currentUserEmail &&
              c.author_email === currentUserEmail;
            return (
              <li key={c.id} className="td-comment">
                <div className="td-comment-avatar" aria-hidden="true">
                  {c.author_avatar ? (
                    <img src={c.author_avatar} alt="" />
                  ) : (
                    <span>
                      {(c.author_name || c.author_email || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="td-comment-body-wrap">
                  <div className="td-comment-head">
                    <span className="td-comment-author">
                      {c.author_name || c.author_email || 'Unknown'}
                    </span>
                    <span className="td-comment-time">
                      {relativeTime(c.created_at)}
                    </span>
                    {isAuthor && (
                      <button
                        type="button"
                        className="td-comment-del"
                        onClick={() => handleDelete(c)}
                        aria-label="Delete comment"
                        title="Delete"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <p className="td-comment-body">{c.content}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default CommentSection;
