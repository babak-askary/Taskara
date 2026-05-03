import { useState } from 'react';
import { ask as askAI } from '../../api/aiApi';
import { errorMessage } from '../../api/client';

const SUGGESTIONS = [
  'What should I focus on today?',
  'Summarize my week',
  "What's overdue?",
  'Show my top categories',
];

function AIAssistant() {
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function submit(p) {
    const text = (p ?? prompt).trim();
    if (!text || pending) return;
    setError(null);
    setAnswer(null);
    setPending(true);
    try {
      const { data } = await askAI(text);
      setAnswer(data);
    } catch (err) {
      setError(errorMessage(err, 'Taskara AI is not available right now.'));
    } finally {
      setPending(false);
    }
  }

  function handleChip(text) {
    setPrompt(text);
    submit(text);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <section className="ai-panel">
      <div className="ai-head">
        <div className="ai-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor" stroke="none" />
            <path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9L19 15z" fill="currentColor" stroke="none" opacity="0.8" />
          </svg>
        </div>
        <div className="ai-head-text">
          <p className="ai-title">Ask Taskara</p>
          <p className="ai-sub">Quick answers about your tasks, your week, what to focus on.</p>
        </div>
      </div>

      <div className="ai-input-row">
        <input
          className="ai-input"
          type="text"
          placeholder="Ask anything — e.g. What should I do next?"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={pending}
        />
        <button
          className="ai-send"
          onClick={() => submit()}
          disabled={pending || !prompt.trim()}
          aria-label="Send"
        >
          {pending ? <span className="ai-spinner" aria-hidden="true" /> : 'Ask'}
        </button>
      </div>

      <div className="ai-chips">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="ai-chip" onClick={() => handleChip(s)} disabled={pending}>
            {s}
          </button>
        ))}
      </div>

      {error && <p className="ai-error">{error}</p>}
      {answer && (
        <div className="ai-answer">
          <div className="ai-answer-text">{answer.reply}</div>
          <div className="ai-answer-meta">
            <span className="ai-answer-dot" />
            {answer.source === 'huggingface' ? 'Hugging Face' : 'Taskara helper'}
          </div>
        </div>
      )}
    </section>
  );
}

export default AIAssistant;
