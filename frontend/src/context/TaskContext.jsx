/* eslint-disable react-refresh/only-export-components */
// Context file: intentionally exports reducer, provider, and custom hook.
import { createContext, useContext, useReducer, useEffect } from 'react';

const TaskContext = createContext(null);

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const initialState = { tasks: [] };

function taskReducer(state, action) {
  switch (action.type) {
    case 'LOAD_TASKS':
      return { ...state, tasks: action.payload };

    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.id
            ? { ...t, ...action.payload, updatedAt: new Date().toISOString() }
            : t
        ),
      };

    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };

    case 'ADD_COMMENT':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, comments: [...t.comments, action.payload.comment], updatedAt: new Date().toISOString() }
            : t
        ),
      };

    case 'DELETE_COMMENT':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, comments: t.comments.filter(c => c.id !== action.payload.commentId) }
            : t
        ),
      };

    case 'ADD_ATTACHMENT':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, attachments: [...t.attachments, action.payload.attachment] }
            : t
        ),
      };

    case 'LOG_TIME':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, timeSpent: (t.timeSpent || 0) + action.payload.minutes }
            : t
        ),
      };

    default:
      return state;
  }
}

// ─── Sample seed data ────────────────────────────────────────────────────────
function createSampleTasks() {
  const now = new Date();
  const future = (days) =>
    new Date(now.getTime() + days * 86_400_000).toISOString().split('T')[0];

  return [
    {
      id: 'sample-1',
      title: 'Design user authentication flow',
      description:
        'Create wireframes and implement Auth0 integration for login, registration, and user profile management.',
      category: 'Work',
      status: 'completed',
      priority: 'high',
      deadline: future(-2),
      recurring: 'none',
      timeSpent: 180,
      comments: [
        {
          id: 'c1',
          text: 'Auth0 setup is complete! Redirect callbacks are working.',
          author: 'Alice',
          authorPicture: null,
          createdAt: new Date(now - 86_400_000).toISOString(),
        },
      ],
      attachments: [
        {
          id: 'a1',
          name: 'auth-flow-diagram.png',
          size: 245678,
          type: 'image/png',
          uploadedAt: new Date(now - 86_400_000).toISOString(),
        },
      ],
      sharedWith: [],
      createdAt: new Date(now - 7 * 86_400_000).toISOString(),
      updatedAt: new Date(now - 86_400_000).toISOString(),
    },
    {
      id: 'sample-2',
      title: 'Set up PostgreSQL database schema',
      description:
        'Design and implement the database schema for tasks, users, and categories. Use Neon for cloud hosting.',
      category: 'Work',
      status: 'in-progress',
      priority: 'high',
      deadline: future(3),
      recurring: 'none',
      timeSpent: 90,
      comments: [],
      attachments: [],
      sharedWith: [],
      createdAt: new Date(now - 5 * 86_400_000).toISOString(),
      updatedAt: new Date(now - 2 * 86_400_000).toISOString(),
    },
    {
      id: 'sample-3',
      title: 'Build task dashboard with charts',
      description:
        'Create an interactive dashboard showing task progress, completion rates, and team performance metrics.',
      category: 'Work',
      status: 'in-progress',
      priority: 'medium',
      deadline: future(7),
      recurring: 'none',
      timeSpent: 45,
      comments: [],
      attachments: [],
      sharedWith: [],
      createdAt: new Date(now - 3 * 86_400_000).toISOString(),
      updatedAt: new Date(now - 86_400_000).toISOString(),
    },
    {
      id: 'sample-4',
      title: 'Weekly team standup meeting',
      description: 'Sync on project progress, blockers, and upcoming milestones.',
      category: 'Work',
      status: 'todo',
      priority: 'medium',
      deadline: future(1),
      recurring: 'weekly',
      timeSpent: 0,
      comments: [],
      attachments: [],
      sharedWith: [],
      createdAt: new Date(now - 2 * 86_400_000).toISOString(),
      updatedAt: new Date(now - 2 * 86_400_000).toISOString(),
    },
    {
      id: 'sample-5',
      title: 'Morning workout session',
      description: '30-minute cardio + strength training. Track reps and sets.',
      category: 'Health',
      status: 'todo',
      priority: 'medium',
      deadline: future(0),
      recurring: 'daily',
      timeSpent: 0,
      comments: [],
      attachments: [],
      sharedWith: [],
      createdAt: new Date(now - 86_400_000).toISOString(),
      updatedAt: new Date(now - 86_400_000).toISOString(),
    },
    {
      id: 'sample-6',
      title: 'Buy weekly groceries',
      description: 'Milk, eggs, bread, fresh fruits, and vegetables.',
      category: 'Shopping',
      status: 'todo',
      priority: 'low',
      deadline: future(2),
      recurring: 'weekly',
      timeSpent: 0,
      comments: [],
      attachments: [],
      sharedWith: [],
      createdAt: new Date(now - 86_400_000).toISOString(),
      updatedAt: new Date(now - 86_400_000).toISOString(),
    },
    {
      id: 'sample-7',
      title: 'Complete React Hooks module',
      description:
        'Finish the React Hooks and Context API sections of the online course and complete the exercises.',
      category: 'Education',
      status: 'in-progress',
      priority: 'medium',
      deadline: future(5),
      recurring: 'none',
      timeSpent: 120,
      comments: [],
      attachments: [],
      sharedWith: [],
      createdAt: new Date(now - 4 * 86_400_000).toISOString(),
      updatedAt: new Date(now - 2 * 86_400_000).toISOString(),
    },
    {
      id: 'sample-8',
      title: 'Annual dental check-up',
      description: 'Book and attend yearly dental appointment.',
      category: 'Health',
      status: 'todo',
      priority: 'low',
      deadline: future(14),
      recurring: 'none',
      timeSpent: 0,
      comments: [],
      attachments: [],
      sharedWith: [],
      createdAt: new Date(now - 86_400_000).toISOString(),
      updatedAt: new Date(now - 86_400_000).toISOString(),
    },
  ];
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('taskflow_tasks');
      if (stored) {
        dispatch({ type: 'LOAD_TASKS', payload: JSON.parse(stored) });
      } else {
        dispatch({ type: 'LOAD_TASKS', payload: createSampleTasks() });
      }
    } catch {
      dispatch({ type: 'LOAD_TASKS', payload: createSampleTasks() });
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem('taskflow_tasks', JSON.stringify(state.tasks));
  }, [state.tasks]);

  // ── Action helpers ──
  function addTask(data) {
    const task = {
      id: generateId(),
      title: '',
      description: '',
      category: 'Work',
      status: 'todo',
      priority: 'medium',
      deadline: '',
      recurring: 'none',
      timeSpent: 0,
      comments: [],
      attachments: [],
      sharedWith: [],
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_TASK', payload: task });
    return task;
  }

  function updateTask(id, updates) {
    dispatch({ type: 'UPDATE_TASK', payload: { id, ...updates } });
  }

  function deleteTask(id) {
    dispatch({ type: 'DELETE_TASK', payload: id });
  }

  function addComment(taskId, commentData) {
    const comment = {
      id: generateId(),
      ...commentData,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_COMMENT', payload: { taskId, comment } });
  }

  function deleteComment(taskId, commentId) {
    dispatch({ type: 'DELETE_COMMENT', payload: { taskId, commentId } });
  }

  function addAttachment(taskId, file) {
    const attachment = {
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_ATTACHMENT', payload: { taskId, attachment } });
  }

  function logTime(taskId, minutes) {
    dispatch({ type: 'LOG_TIME', payload: { taskId, minutes } });
  }

  return (
    <TaskContext.Provider
      value={{ tasks: state.tasks, addTask, updateTask, deleteTask, addComment, deleteComment, addAttachment, logTime }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
}
