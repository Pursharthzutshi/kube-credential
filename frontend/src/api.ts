import axios, { AxiosError } from 'axios';
import type {
  CredentialPayload,
  VerificationPayload,
  IssuanceResult,
  VerificationResult,
} from './types';

type BaseUrlOptions = {
  envValue: string | undefined;
  envKey: string;
  localPort: number;
  serviceName: string;
};

function resolveBaseUrl({ envValue, envKey, localPort, serviceName }: BaseUrlOptions) {
  const trimmed = envValue?.trim();

  if (trimmed) {
    return trimmed.replace(/\/$/, '');
  }

  const fallback = `http://localhost:${localPort}`;

  if (import.meta.env.PROD) {
    console.warn(
      `[config] Missing VITE_${envKey}; falling back to ${fallback}. Requests will fail unless the ${serviceName} service is running locally.`,
    );
  }

  return fallback;
}

const ISSUANCE_BASE = resolveBaseUrl({
  envValue: import.meta.env.VITE_ISSUANCE_URL,
  envKey: 'ISSUANCE_URL',
  localPort: 4001,
  serviceName: 'issuance',
});

const VERIFY_BASE = resolveBaseUrl({
  envValue: import.meta.env.VITE_VERIFY_URL,
  envKey: 'VERIFY_URL',
  localPort: 4002,
  serviceName: 'verification',
});

function parsePositiveInt(raw: string | undefined, fallback: number) {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveTimeoutMs() {
  return parsePositiveInt(import.meta.env.VITE_API_TIMEOUT_MS, 15000);
}

const retryConfig = {
  attempts: parsePositiveInt(import.meta.env.VITE_API_RETRY_ATTEMPTS, 3),
  baseDelayMs: parsePositiveInt(import.meta.env.VITE_API_RETRY_DELAY_MS, 500),
};

const axiosInstance = axios.create({
  timeout: resolveTimeoutMs(),
  headers: { 'Content-Type': 'application/json' },
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function isRetryable(error: AxiosError) {
  if (!error.response) return true;
  const status = error.response.status;
  return status >= 500 || status === 429;
}

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < retryConfig.attempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (!axios.isAxiosError(error) || !isRetryable(error) || attempt >= retryConfig.attempts) {
        throw error;
      }

      const delay = retryConfig.baseDelayMs * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function issueCredential(payload: CredentialPayload): Promise<IssuanceResult> {
  try {
    const { data } = await withRetry(() => axiosInstance.post(`${ISSUANCE_BASE}/issue`, payload));
    return { ok: true, data };
  } catch (err) {
    const axiosError = err as AxiosError;
    // Normalize error for frontend
    console.error('issueCredential error', axiosError?.response?.status, axiosError?.message, axiosError?.response?.data);
    return {
      ok: false,
      status: axiosError?.response?.status ?? undefined,
      error: axiosError?.response?.data || axiosError?.message || 'unknown error'
    };
  }
}

export async function verifyCredential(payload: VerificationPayload): Promise<VerificationResult> {
  try {
    const { data } = await withRetry(() => axiosInstance.post(`${VERIFY_BASE}/verify`, payload));
    return { ok: true, data };
  } catch (err) {
    const axiosError = err as AxiosError;
    console.error('verifyCredential error', axiosError?.response?.status, axiosError?.message, axiosError?.response?.data);
    return {
      ok: false,
      status: axiosError?.response?.status ?? undefined,
      error: axiosError?.response?.data || axiosError?.message || 'unknown error'
    };
  }
}
