// React component for the AI Assist button inside TaskForm.
import { useState } from 'react';
import { getAISuggestions } from '../utils/aiUtils.js';

export function AIAssistantButton({ title, description, onApply, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    if (!title?.trim()) { setError('Enter a task title first.'); return; }
    setError(null);
    setLoading(true);
    try {
      const suggestions = await getAISuggestions(title, description);
      if (suggestions) onApply(suggestions);
    } catch {
      setError('AI suggestion failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-assist-wrapper">
      <button
        type="button"
        className="btn btn-ai"
        onClick={handleClick}
        disabled={disabled || loading || !title?.trim()}
        title="Let AI suggest category, priority, deadline and description"
      >
        {loading ? <><span className="spinner-sm" /> Thinking…</> : <>✨ AI Assist</>}
      </button>
      {error && <span className="ai-error">{error}</span>}
    </div>
  );
}
