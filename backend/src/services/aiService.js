const dashboardModel = require('../models/dashboardModel');
const taskModel = require('../models/taskModel');

// Gathers a compact snapshot of the user's tasks to feed both Claude
// (as system context) and the local heuristic responder.
async function buildContext(userId) {
  const [stats, perf, category, upcoming, overdue] = await Promise.all([
    dashboardModel.getTaskStats(userId),
    dashboardModel.getPerformanceMetrics(userId),
    dashboardModel.getCategoryBreakdown(userId),
    taskModel.findAll({
      userId,
      status: 'todo',
      sortBy: 'due_date',
      sortOrder: 'ASC',
      limit: 8,
    }),
    taskModel.findAll({
      userId,
      dueBefore: new Date().toISOString(),
      sortBy: 'due_date',
      sortOrder: 'ASC',
      limit: 5,
    }),
  ]);

  const overdueOnly = overdue.filter((t) => t.status !== 'done');

  return {
    stats,
    perf,
    category,
    upcoming,
    overdue: overdueOnly,
  };
}

// Format a UTC ISO timestamp as a readable local string in the given IANA TZ.
// Returns null for null/undefined input so callers can decide how to render.
function fmtLocal(iso, timezone) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toISOString();
  }
}

// Tiny intent router for the "no API key" fallback. The responses are
// deterministic but use real user data, so it still feels useful.
function localReply(prompt, ctx, timezone) {
  const p = (prompt || '').toLowerCase();
  const { stats, perf, upcoming, overdue, category } = ctx;

  const fmtList = (items, mapper) =>
    items.length === 0
      ? '—'
      : items.map((t, i) => `${i + 1}. ${mapper(t)}`).join('\n');

  const taskLine = (t) => {
    const due = t.due_date ? ` (due ${fmtLocal(t.due_date, timezone)})` : '';
    const pri = t.priority ? ` [${t.priority}]` : '';
    return `${t.title}${pri}${due}`;
  };

  if (/(overdue|late|missed)/.test(p)) {
    if (overdue.length === 0) {
      return "Nothing is overdue right now. Nice job staying on top of things.";
    }
    return `You have ${overdue.length} overdue task${overdue.length === 1 ? '' : 's'}:\n\n${fmtList(overdue, taskLine)}`;
  }

  if (/(focus|today|now|start|next|what.*do)/.test(p)) {
    const today = upcoming.slice(0, 3);
    if (today.length === 0) {
      return "You're clear for today — no pending tasks with a deadline. A good moment to plan the week.";
    }
    return `Here's what I'd focus on first:\n\n${fmtList(today, taskLine)}`;
  }

  if (/(week|summary|progress|doing|review|recap)/.test(p)) {
    const diff = perf.completed_this_week - perf.completed_last_week;
    const trend =
      diff > 0 ? `up ${diff} from last week`
        : diff < 0 ? `down ${Math.abs(diff)} from last week`
        : 'flat vs last week';
    return (
      `This week: ${perf.completed_this_week} task${perf.completed_this_week === 1 ? '' : 's'} completed (${trend}).\n` +
      `On-time rate: ${perf.on_time_rate}%.\n` +
      `Still open: ${stats.todo + stats.in_progress} task${stats.todo + stats.in_progress === 1 ? '' : 's'}.` +
      (stats.overdue ? `\nOverdue: ${stats.overdue}.` : '')
    );
  }

  if (/(category|categories|breakdown|where.*time)/.test(p)) {
    if (category.length === 0) return 'No category data yet — try assigning categories to your tasks.';
    const top = category.slice(0, 4);
    return `Top categories:\n\n${top.map((c, i) => `${i + 1}. ${c.name} — ${c.count} task${c.count === 1 ? '' : 's'}`).join('\n')}`;
  }

  if (/(break.*down|split|sub.*task|steps)/.test(p)) {
    return (
      "Pick a task and I'll suggest 3–5 small sub-steps. For example:\n" +
      "1. Draft the outline.\n" +
      "2. Gather the data or references.\n" +
      "3. Write the first pass.\n" +
      "4. Review and polish.\n" +
      "5. Publish / share."
    );
  }

  // Default: contextual overview.
  const today = upcoming.slice(0, 3);
  return (
    `Here's your quick snapshot:\n\n` +
    `• Open: ${stats.todo + stats.in_progress}\n` +
    `• Done this week: ${perf.completed_this_week}\n` +
    `• Overdue: ${stats.overdue}\n\n` +
    `Top of your list:\n${fmtList(today, taskLine)}\n\n` +
    `Ask me things like "What should I focus on today?" or "How did this week go?".`
  );
}

// Calls Hugging Face's OpenAI-compatible chat completions router.
// Returns the reply string, or throws so the caller can fall back.
async function callHuggingFace(prompt, ctx, timezone) {
  const key = process.env.HUGGINGFACE_API_KEY;
  if (!key) throw new Error('no-api-key');

  const model = process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';

  const context = JSON.stringify({
    stats: ctx.stats,
    performance: ctx.perf,
    categories: ctx.category.slice(0, 5),
    upcoming: ctx.upcoming.slice(0, 6).map((t) => ({
      title: t.title,
      priority: t.priority,
      status: t.status,
      due_date: fmtLocal(t.due_date, timezone),
      category: t.category_name,
    })),
    overdue: ctx.overdue.slice(0, 5).map((t) => ({
      title: t.title,
      due_date: fmtLocal(t.due_date, timezone),
    })),
    now: fmtLocal(new Date().toISOString(), timezone),
    timezone,
  });

  const system =
    "You are Taskara's built-in assistant. Answer the user's question about " +
    "their own tasks, using the JSON snapshot below as the ONLY source of truth " +
    "about their data. All dates are pre-formatted in the user's local timezone — " +
    "use them verbatim and do not convert. Keep replies short, direct, and warm. " +
    "Prefer bullets or numbered lists over paragraphs. Never invent tasks that " +
    "aren't in the snapshot.\n\n" +
    `USER SNAPSHOT:\n${context}`;

  const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`huggingface ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content || '').trim();
  if (!text) throw new Error('empty response');
  return text;
}

async function ask(userId, prompt, { timezone = 'UTC' } = {}) {
  const ctx = await buildContext(userId);

  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const reply = await callHuggingFace(prompt, ctx, timezone);
      return { reply, source: 'huggingface' };
    } catch (err) {
      console.warn('[ai] Hugging Face call failed, falling back to local:', err.message);
    }
  }

  return { reply: localReply(prompt, ctx, timezone), source: 'local' };
}

module.exports = { ask };
