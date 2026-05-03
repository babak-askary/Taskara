const cloudinary = require('cloudinary').v2;

const UPLOAD_TIMEOUT_MS = 30_000; // 30s — handler request time budget

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Upload a buffer (from multer.memoryStorage) to Cloudinary. Returns
// { secure_url, public_id, bytes, resource_type, format } on success.
// Bounded by UPLOAD_TIMEOUT_MS so a hung Cloudinary connection can't pin
// an Express request open indefinitely.
function uploadBuffer(buffer, { folder = 'taskara', filename } = {}) {
  const upload = new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        public_id: filename ? filename.replace(/\.[^.]+$/, '') : undefined,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Cloudinary upload timed out after ${UPLOAD_TIMEOUT_MS}ms`)), UPLOAD_TIMEOUT_MS)
  );

  return Promise.race([upload, timeout]);
}

async function destroy(publicId, resourceType = 'image') {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = { uploadBuffer, destroy, isConfigured };
