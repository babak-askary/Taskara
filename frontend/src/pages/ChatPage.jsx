import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  listConversations,
  getConversation,
  listMessages,
  sendMessage,
  startDirect,
} from '../api/chatApi';
import { errorMessage } from '../api/client';
import { onSocketEvent, joinChat, leaveChat } from '../services/socket';
import { relativeTime } from '../utils/dateFormat';
import { useToast } from '../hooks/useToast';

function initials(s) {
  return (s || '?').split(/[\s@]/)[0].slice(0, 2).toUpperCase();
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function fmtDay(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

// Display label for a convo row in the sidebar.
function convoLabel(c) {
  if (c.kind === 'group') return c.group_name || c.group_slug || 'Group';
  return c.other_user_name || c.other_user_email || 'Direct chat';
}
function convoSubLabel(c) {
  if (c.kind === 'group') return c.group_slug ? `#${c.group_slug}` : 'Group chat';
  return c.other_user_email || '';
}

function ConvoSidebar({ conversations, selectedId, onSelect, onStartDirect, currentUserEmail }) {
  const [dmEmail, setDmEmail] = useState('');
  const [dmPending, setDmPending] = useState(false);

  async function submitStartDm(e) {
    e.preventDefault();
    const email = dmEmail.trim();
    if (!email || dmPending) return;
    setDmPending(true);
    try {
      await onStartDirect(email);
      setDmEmail('');
    } finally {
      setDmPending(false);
    }
  }

  const groups = conversations.filter((c) => c.kind === 'group');
  const directs = conversations.filter((c) => c.kind === 'direct');

  return (
    <aside className="chat-side">
      <form className="chat-side-search" onSubmit={submitStartDm}>
        <input
          className="qc-input"
          type="email"
          placeholder="Start DM by email…"
          value={dmEmail}
          onChange={(e) => setDmEmail(e.target.value)}
          disabled={dmPending}
        />
        <button
          type="submit"
          className="btn-primary chat-side-search-btn"
          disabled={!dmEmail.trim() || dmPending}
        >
          {dmPending ? '…' : 'Start'}
        </button>
      </form>

      <div className="chat-side-section">
        <p className="chat-side-section-label">Groups</p>
        {groups.length === 0 ? (
          <p className="chat-side-empty">Join a group to chat with its members.</p>
        ) : (
          <ul className="chat-side-list">
            {groups.map((c) => (
              <li
                key={c.id}
                className={`chat-side-item ${c.id === selectedId ? 'is-active' : ''}`}
              >
                <button type="button" className="chat-side-btn" onClick={() => onSelect(c.id)}>
                  <span className="gp-avatar chat-side-avatar" aria-hidden="true">
                    <span>{initials(c.group_name || c.group_slug)}</span>
                  </span>
                  <span className="chat-side-meta">
                    <span className="chat-side-name">{convoLabel(c)}</span>
                    <span className="chat-side-sub">
                      {c.last_body
                        ? `${c.last_sender_name ? c.last_sender_name + ': ' : ''}${c.last_body}`
                        : convoSubLabel(c)}
                    </span>
                  </span>
                  {c.last_at && (
                    <span className="chat-side-time">{relativeTime(c.last_at)}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="chat-side-section">
        <p className="chat-side-section-label">Direct messages</p>
        {directs.length === 0 ? (
          <p className="chat-side-empty">No DMs yet — start one above.</p>
        ) : (
          <ul className="chat-side-list">
            {directs.map((c) => (
              <li
                key={c.id}
                className={`chat-side-item ${c.id === selectedId ? 'is-active' : ''}`}
              >
                <button type="button" className="chat-side-btn" onClick={() => onSelect(c.id)}>
                  <span className="gp-avatar chat-side-avatar" aria-hidden="true">
                    {c.other_user_avatar
                      ? <img src={c.other_user_avatar} alt="" />
                      : <span>{initials(c.other_user_name || c.other_user_email)}</span>}
                  </span>
                  <span className="chat-side-meta">
                    <span className="chat-side-name">{convoLabel(c)}</span>
                    <span className="chat-side-sub">
                      {c.last_body
                        ? `${c.last_sender_id && c.last_sender_name && c.last_sender_name === c.other_user_name ? '' : 'You: '}${c.last_body}`
                        : convoSubLabel(c)}
                    </span>
                  </span>
                  {c.last_at && (
                    <span className="chat-side-time">{relativeTime(c.last_at)}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function ChatThread({ conversation, messages, currentUserEmail, onSend, onBack }) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, conversation?.id]);

  async function submit(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await onSend(text);
      setBody('');
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  }

  // Insert "Today" / "Jan 5" day separators between messages.
  const grouped = useMemo(() => {
    const out = [];
    let lastDay = null;
    for (const m of messages) {
      const day = new Date(m.created_at).toDateString();
      if (day !== lastDay) {
        out.push({ kind: 'sep', id: `sep-${day}`, label: fmtDay(m.created_at) });
        lastDay = day;
      }
      out.push({ kind: 'msg', ...m });
    }
    return out;
  }, [messages]);

  if (!conversation) {
    return (
      <main className="chat-main chat-main-empty">
        <p className="chat-empty-title">Pick a conversation</p>
        <p className="chat-empty-sub">Or start a new DM by email from the left.</p>
      </main>
    );
  }

  const headerName = conversation.kind === 'group'
    ? conversation.group_name
    : conversation.other_user_name || conversation.other_user_email;
  const headerSub = conversation.kind === 'group'
    ? `#${conversation.group_slug}`
    : conversation.other_user_email;

  return (
    <main className="chat-main">
      <header className="chat-thread-head">
        {onBack && (
          <button
            type="button"
            className="chat-thread-back"
            onClick={onBack}
            aria-label="Back to conversations"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <span className="gp-avatar chat-thread-avatar" aria-hidden="true">
          {conversation.kind === 'direct' && conversation.other_user_avatar
            ? <img src={conversation.other_user_avatar} alt="" />
            : <span>{initials(headerName)}</span>}
        </span>
        <div className="chat-thread-meta">
          <span className="chat-thread-name">{headerName}</span>
          <span className="chat-thread-sub">{headerSub}</span>
        </div>
        {conversation.kind === 'group' && conversation.group_id && (
          <Link to={`/groups/${conversation.group_id}`} className="dash-link chat-thread-link">
            Open group →
          </Link>
        )}
      </header>

      <div className="chat-scroll" ref={scrollerRef}>
        {grouped.length === 0 ? (
          <p className="chat-empty-sub chat-thread-empty">No messages yet — say hi.</p>
        ) : (
          grouped.map((row) => {
            if (row.kind === 'sep') {
              return (
                <div key={row.id} className="chat-day-sep" aria-hidden="true">
                  <span>{row.label}</span>
                </div>
              );
            }
            const isMine = currentUserEmail && row.sender_email === currentUserEmail;
            return (
              <div key={row.id} className={`chat-msg ${isMine ? 'is-mine' : ''}`}>
                {!isMine && (
                  <span className="gp-avatar chat-msg-avatar" aria-hidden="true">
                    {row.sender_avatar
                      ? <img src={row.sender_avatar} alt="" />
                      : <span>{initials(row.sender_name || row.sender_email)}</span>}
                  </span>
                )}
                <div className="chat-msg-body">
                  {!isMine && conversation.kind === 'group' && (
                    <span className="chat-msg-sender">{row.sender_name || row.sender_email}</span>
                  )}
                  <span className="chat-msg-bubble">{row.body}</span>
                  <span className="chat-msg-time">{fmtTime(row.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form className="chat-input-row" onSubmit={submit}>
        <textarea
          className="chat-input"
          placeholder="Message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          disabled={sending}
          maxLength={4000}
        />
        <button className="btn-primary chat-send" disabled={!body.trim() || sending}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </main>
  );
}

// Single-pane mode on phones — show sidebar OR thread, not both. Like
// iMessage/WhatsApp. The viewport listener uses matchMedia so it tracks the
// breakpoint cheaply and recovers if the user rotates a tablet.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(max-width: 720px)').matches
  );
  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

function ChatPage() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  const toast = useToast();
  const isMobile = useIsMobile();

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(routeId ? Number(routeId) : null);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load conversations
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    listConversations()
      .then((res) => {
        if (cancelled) return;
        setConversations(res.data || []);
        if (!routeId && (res.data || []).length > 0 && !selectedId) {
          // Auto-select the most recent convo on first visit.
          setSelectedId(res.data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated]); // eslint-disable-line

  // Sync selectedId from URL changes.
  useEffect(() => {
    if (routeId && Number(routeId) !== selectedId) setSelectedId(Number(routeId));
  }, [routeId]); // eslint-disable-line

  // When the active convo changes, fetch its detail + messages, join the
  // socket room, and unsubscribe / leave on cleanup.
  useEffect(() => {
    if (!selectedId) {
      setActive(null);
      setMessages([]);
      return;
    }
    let cancelled = false;
    Promise.all([
      getConversation(selectedId),
      listMessages(selectedId),
    ])
      .then(([c, m]) => {
        if (cancelled) return;
        setActive(c.data);
        setMessages(m.data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(errorMessage(err, 'Could not open the conversation.'));
        setActive(null);
        setMessages([]);
      });
    joinChat(selectedId);
    return () => {
      cancelled = true;
      leaveChat(selectedId);
    };
  }, [selectedId]); // eslint-disable-line

  // Realtime: receive new messages for any convo. If it's the active one,
  // append to the thread; for any convo, update the sidebar preview.
  useEffect(() => {
    return onSocketEvent('chat:message', (msg) => {
      if (!msg) return;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversation_id
            ? { ...c, last_body: msg.body, last_at: msg.created_at, last_sender_name: msg.sender_name }
            : c
        )
      );
      setMessages((prev) => {
        if (msg.conversation_id !== selectedIdRef.current) return prev;
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
  }, []);

  // Keep a ref to the current selectedId so the socket handler closure stays fresh.
  const selectedIdRef = useRef(selectedId);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  function handleSelect(id) {
    setSelectedId(id);
    navigate(`/chat/${id}`);
  }

  async function handleSend(text) {
    if (!selectedId) return;
    try {
      const res = await sendMessage(selectedId, text);
      // Dedupe in case the socket beat us to it.
      setMessages((prev) => (prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, last_body: res.data.body, last_at: res.data.created_at, last_sender_name: res.data.sender_name }
            : c
        )
      );
    } catch (err) {
      toast.error(errorMessage(err, 'Could not send message.'));
    }
  }

  async function handleStartDirect(email) {
    try {
      const res = await startDirect(email);
      const convo = res.data;
      // Refresh sidebar list (the new convo may not be in it).
      const list = await listConversations();
      setConversations(list.data || []);
      setSelectedId(convo.id);
      navigate(`/chat/${convo.id}`);
      toast.success(`Opened chat with ${convo.other_user_name || convo.other_user_email}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not start that chat.'));
    }
  }

  if (authLoading) return <div className="loading">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  // On phones: render sidebar OR thread, not both. The two-column layout
  // collapses to a stacked single pane that swaps on selection.
  const showThread = !isMobile || !!selectedId;
  const showSidebar = !isMobile || !selectedId;

  function handleBackToList() {
    setSelectedId(null);
    setActive(null);
    setMessages([]);
    navigate('/chat');
  }

  return (
    <div className={`dash chat-page ${isMobile ? 'is-mobile' : ''}`}>
      {!isMobile && (
        <header className="chat-page-head">
          <p className="cal-page-eyebrow">
            <span className="cal-page-eyebrow-dot" />
            Chat
          </p>
          <h1 className="cal-page-title">Conversations</h1>
        </header>
      )}

      <div className={`chat-layout ${isMobile && selectedId ? 'on-thread' : ''}`}>
        {showSidebar && (
          <ConvoSidebar
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelect}
            onStartDirect={handleStartDirect}
            currentUserEmail={user?.email}
          />
        )}
        {showThread && (
          <ChatThread
            conversation={active}
            messages={messages}
            currentUserEmail={user?.email}
            onSend={handleSend}
            onBack={isMobile ? handleBackToList : null}
          />
        )}
      </div>

      {loading && conversations.length === 0 && (
        <p className="dash-empty">Loading conversations…</p>
      )}
    </div>
  );
}

export default ChatPage;
