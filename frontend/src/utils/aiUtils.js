// AI utility functions — keyword heuristics + optional HuggingFace API

const URGENT_KEYWORDS = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'deadline today', 'overdue', 'important'];
const HIGH_KEYWORDS = ['meeting', 'presentation', 'deploy', 'fix', 'bug', 'release', 'client', 'boss', 'report'];
const LOW_KEYWORDS = ['maybe', 'someday', 'eventually', 'low priority', 'nice to have', 'optional'];

const CATEGORY_KEYWORDS = {
  Work: ['work', 'meeting', 'project', 'client', 'report', 'deadline', 'deploy', 'release', 'sprint', 'jira', 'code', 'review', 'presentation', 'email', 'office'],
  Health: ['workout', 'exercise', 'gym', 'run', 'doctor', 'dental', 'health', 'medicine', 'appointment', 'diet', 'sleep', 'yoga', 'meditation'],
  Shopping: ['buy', 'purchase', 'shop', 'order', 'grocery', 'groceries', 'store', 'amazon', 'market'],
  Education: ['study', 'learn', 'course', 'read', 'book', 'lecture', 'homework', 'assignment', 'exam', 'tutorial', 'practice'],
  Personal: ['personal', 'family', 'friend', 'home', 'house', 'clean', 'organize', 'birthday', 'anniversary'],
};

const DESCRIPTION_TEMPLATES = {
  Work: (t) => `Complete the following work task: ${t}.\n\n- Define the scope and acceptance criteria\n- Break down into smaller sub-tasks if needed\n- Set a realistic deadline and allocate time\n- Document progress and blockers`,
  Health: (t) => `${t}.\n\n- Prepare any required equipment or materials\n- Set a specific time slot in your schedule\n- Track duration and any relevant metrics\n- Note how you feel before and after`,
  Shopping: (t) => `${t}.\n\n- Make a complete list before going\n- Compare prices if needed\n- Check for available coupons or discounts\n- Set a budget`,
  Education: (t) => `${t}.\n\n- Review pre-requisite material first\n- Take notes and highlight key concepts\n- Practice with exercises or examples\n- Summarize what you learned`,
  Personal: (t) => `${t}.\n\n- Plan the steps needed to complete this\n- Set aside dedicated time in your calendar\n- Identify any resources or help needed`,
  Other: (t) => `${t}.\n\n- Define what "done" looks like\n- Identify any dependencies\n- Allocate time and set a reminder`,
};

function detectPriority(text) {
  const lower = text.toLowerCase();
  if (URGENT_KEYWORDS.some(k => lower.includes(k))) return 'high';
  if (LOW_KEYWORDS.some(k => lower.includes(k))) return 'low';
  if (HIGH_KEYWORDS.some(k => lower.includes(k))) return 'high';
  return 'medium';
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  let best = 'Other';
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

function suggestDeadline(priority) {
  const days = priority === 'high' ? 2 : priority === 'medium' ? 7 : 14;
  return new Date(Date.now() + days * 86_400_000).toISOString().split('T')[0];
}

async function fetchHFDescription(title, category) {
  const token = import.meta.env.VITE_HF_TOKEN;
  if (!token) return null;
  const prompt = `Write a concise task description for: "${title}" (category: ${category}). Description:`;
  try {
    const res = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 120, temperature: 0.7 } }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const generated = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    return generated ? generated.replace(prompt, '').trim() : null;
  } catch {
    return null;
  }
}

export async function getAISuggestions(title, existingDescription = '') {
  if (!title?.trim()) return null;
  const combined = title + ' ' + existingDescription;
  const category = detectCategory(combined);
  const priority = detectPriority(combined);
  const deadline = suggestDeadline(priority);
  const hfDesc = await fetchHFDescription(title, category);
  const description = hfDesc || DESCRIPTION_TEMPLATES[category]?.(title) || DESCRIPTION_TEMPLATES.Other(title);
  return { category, priority, deadline, description };
}
