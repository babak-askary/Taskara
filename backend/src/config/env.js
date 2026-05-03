// Load .env and fail fast if anything required is missing. Required modules
// should require this BEFORE reading process.env so the failure surfaces at
// boot instead of at first request.
require('dotenv').config();

// Hard-required: app can't function without these.
const REQUIRED = [
  'DATABASE_URL',
  'AUTH0_AUDIENCE',
  'AUTH0_ISSUER_BASE_URL',
];

// Optional but downgrade specific features when missing. Logged so an operator
// notices, but boot continues so e.g. local dev without Cloudinary still works.
const OPTIONAL = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'HUGGINGFACE_API_KEY',
  'FRONTEND_URL',
];

const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[env] Missing required env vars: ${missing.join(', ')}`);
  console.error('[env] Set these in backend/.env (see backend/.env.example) and restart.');
  process.exit(1);
}

const missingOptional = OPTIONAL.filter((k) => !process.env[k]);
if (missingOptional.length) {
  console.warn(`[env] Optional env vars not set (some features disabled): ${missingOptional.join(', ')}`);
}
