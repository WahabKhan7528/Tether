'use strict';

const NODE_ENV = process.env.NODE_ENV || 'development';

// JWT is now always required — bypass mode is removed
const ALWAYS_REQUIRED = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ACCESS_TOKEN_EXPIRES_IN',
  'REFRESH_TOKEN_EXPIRES_IN',
  'CSRF_SECRET',
];



const IMAGEKIT_REQUIRED = [
  'IMAGEKIT_PUBLIC_KEY',
  'IMAGEKIT_PRIVATE_KEY',
  'IMAGEKIT_URL_ENDPOINT',
];

function validateEnv() {
  // ─── Build required list conditionally ───────────────────────────────────────
  const required = [
    ...ALWAYS_REQUIRED,
    ...IMAGEKIT_REQUIRED,
  ];

  const missing = required.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error(
      `[Tether] FATAL: Missing required environment variables:\n` +
      `  ${missing.join('\n  ')}\n\n` +
      `Please add them to your server/.env file.`
    );
    process.exit(1);
  }

  // ─── Warn about weak JWT secrets ─────────────────────────────────────────────
  ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].forEach((key) => {
    if (process.env[key]?.length < 64) {
      console.warn(`[Tether] WARNING: ${key} is shorter than 64 characters. Use a stronger secret (run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")`);
    }
  });

  console.log(`[Tether] Storage: ImageKit | Env: ${NODE_ENV} | Auth: JWT`);
}

module.exports = validateEnv;
