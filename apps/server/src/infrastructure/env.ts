/**
 * Strict env validation. Called once at server startup; if anything is
 * missing or malformed, log + process.exit(1) so the failure is loud
 * instead of surfacing later as a confusing runtime error (e.g., CORS
 * silently opening to the world, or a credential decrypt blowing up
 * mid-mutation).
 *
 * The exported `env` object is the single source of truth — code should
 * read from it rather than `process.env` directly.
 */

type NodeEnv = 'production' | 'development' | 'test';

export interface Env {
  NODE_ENV: NodeEnv;
  PORT: number;
  DATABASE_URL: string;
  WEB_URL: string[];
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  CREDENTIALS_ENCRYPTION_KEY: string;
  TEMPORAL_ADDRESS: string;
}

class EnvValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Environment validation failed:\n  - ${errors.join('\n  - ')}`);
    this.name = 'EnvValidationError';
  }
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const HEX_64 = /^[0-9a-fA-F]{64}$/;
const DEV_AUTH_SECRET = 'dev-secret-key-change-in-production';

/**
 * Recognizable placeholder marker used in .env.example. Anyone copying
 * the example without filling values gets a clear error here instead
 * of running with a known-public secret.
 */
const PLACEHOLDER_PREFIX = 'REPLACE_ME';

function looksLikePlaceholder(value: string): boolean {
  return value.startsWith(PLACEHOLDER_PREFIX);
}

export function validateEnv(): Env {
  const errors: string[] = [];
  const raw = process.env;

  const nodeEnv = raw.NODE_ENV;
  if (
    nodeEnv !== 'production' &&
    nodeEnv !== 'development' &&
    nodeEnv !== 'test'
  ) {
    errors.push(
      `NODE_ENV must be 'production' | 'development' | 'test' (got: ${JSON.stringify(nodeEnv)})`
    );
  }

  const port = raw.PORT ? Number(raw.PORT) : 4000;
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    errors.push(`PORT must be a valid port number (got: ${raw.PORT})`);
  }

  if (!raw.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  const webUrl = raw.WEB_URL?.trim();
  if (!webUrl) {
    errors.push(
      'WEB_URL is required (comma-separated list of allowed CORS origins)'
    );
  }
  const webOrigins = webUrl
    ? webUrl
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  for (const origin of webOrigins) {
    if (!isValidUrl(origin)) {
      errors.push(`WEB_URL entry is not a valid URL: ${origin}`);
    }
  }

  if (!raw.BETTER_AUTH_URL) {
    errors.push('BETTER_AUTH_URL is required');
  } else if (!isValidUrl(raw.BETTER_AUTH_URL)) {
    errors.push(`BETTER_AUTH_URL is not a valid URL: ${raw.BETTER_AUTH_URL}`);
  }

  if (!raw.BETTER_AUTH_SECRET) {
    errors.push('BETTER_AUTH_SECRET is required');
  } else if (looksLikePlaceholder(raw.BETTER_AUTH_SECRET)) {
    errors.push(
      'BETTER_AUTH_SECRET is still the .env.example placeholder — generate one via `openssl rand -base64 48`'
    );
  } else if (
    raw.BETTER_AUTH_SECRET === DEV_AUTH_SECRET &&
    nodeEnv === 'production'
  ) {
    errors.push(
      'BETTER_AUTH_SECRET is set to the development fallback in production — generate a unique value'
    );
  } else if (raw.BETTER_AUTH_SECRET.length < 32) {
    errors.push('BETTER_AUTH_SECRET must be at least 32 characters');
  }

  if (!raw.CREDENTIALS_ENCRYPTION_KEY) {
    errors.push('CREDENTIALS_ENCRYPTION_KEY is required');
  } else if (looksLikePlaceholder(raw.CREDENTIALS_ENCRYPTION_KEY)) {
    errors.push(
      'CREDENTIALS_ENCRYPTION_KEY is still the .env.example placeholder — generate one via `openssl rand -hex 32`'
    );
  } else if (!HEX_64.test(raw.CREDENTIALS_ENCRYPTION_KEY)) {
    errors.push(
      'CREDENTIALS_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)'
    );
  }

  if (!raw.TEMPORAL_ADDRESS) {
    errors.push('TEMPORAL_ADDRESS is required (e.g., localhost:7233)');
  }

  if (errors.length > 0) {
    throw new EnvValidationError(errors);
  }

  return {
    NODE_ENV: nodeEnv as NodeEnv,
    PORT: port,
    DATABASE_URL: raw.DATABASE_URL as string,
    WEB_URL: webOrigins,
    BETTER_AUTH_URL: raw.BETTER_AUTH_URL as string,
    BETTER_AUTH_SECRET: raw.BETTER_AUTH_SECRET as string,
    CREDENTIALS_ENCRYPTION_KEY: raw.CREDENTIALS_ENCRYPTION_KEY as string,
    TEMPORAL_ADDRESS: raw.TEMPORAL_ADDRESS as string,
  };
}
