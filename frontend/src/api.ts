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

function resolveTimeoutMs() {
  const raw = import.meta.env.VITE_API_TIMEOUT_MS;
  if (!raw) return 15000;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15000;
}

const axiosInstance = axios.create({
  timeout: resolveTimeoutMs(),
  headers: { 'Content-Type': 'application/json' },
});

export async function issueCredential(payload: CredentialPayload): Promise<IssuanceResult> {
  try {
    const { data } = await axiosInstance.post(`${ISSUANCE_BASE}/issue`, payload);
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
    const { data } = await axiosInstance.post(`${VERIFY_BASE}/verify`, payload);
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
