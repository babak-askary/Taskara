import { useState } from 'react';
import { useAppAuth } from '../context/AuthContext.jsx';

function formatDateTime(iso) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso));
}

export function CommentSection({ task, onAddComment, onDeleteComment }) {
  const { user } = useAppAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    onAddComment(task.id, {
      text: trimmed,
      author: user?.name || user?.email || 'You',
      authorPicture: user?.picture || null,
    });
    setText('');
    setSubmitting(false);
  };

  return (
    <section className="comment-section">
      <h3 className="section-title">💬 Comments ({task.comments?.length || 0})</h3>

      {/* Comment list */}
      {task.comments?.length > 0 ? (
        <ul className="comment-list">
          {task.comments.map(c => (
            <li key={c.id} className="comment">
              <div className="comment-avatar">
                {c.authorPicture ? (
                  <img src={c.authorPicture} alt={c.author} />
                ) : (
                  <span>{(c.author?.[0] || '?').toUpperCase()}</span>
                )}
              </div>
              <div className="comment-body">
                <div className="comment-header">
                  <strong className="comment-author">{c.author}</strong>
                  <time className="comment-time">{formatDateTime(c.createdAt)}</time>
                  {(c.author === (user?.name || user?.email)) && (
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => onDeleteComment(task.id, c.id)}
                      aria-label="Delete comment"
                    >✕</button>
                  )}
                </div>
                <p className="comment-text">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state-sm">No comments yet. Be the first!</p>
      )}

      {/* New comment form */}
      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="comment-input-row">
          <div className="comment-avatar comment-avatar--self">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} />
            ) : (
              <span>{(user?.name?.[0] || user?.email?.[0] || 'Y').toUpperCase()}</span>
            )}
          </div>
          <textarea
            className="form-input form-textarea comment-textarea"
            placeholder="Add a comment…"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={2}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
            }}
          />
        </div>
        <div className="comment-form-actions">
          <span className="comment-hint">Enter to submit · Shift+Enter for newline</span>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!text.trim() || submitting}>
            Post
          </button>
        </div>
      </form>
    </section>
  );
}
