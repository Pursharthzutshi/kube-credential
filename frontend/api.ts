import axios, { AxiosError } from 'axios';
import type {
  CredentialPayload,
  VerificationPayload,
  ApiResponse,
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

const axiosInstance = axios.create({
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

export async function issueCredential(
  payload: CredentialPayload,
): Promise<ApiResponse<IssuanceResult>> {
  try {
    const { data } = await axiosInstance.post(`${ISSUANCE_BASE}/issue`, payload);
    return { ok: true, data };
  } catch (err) {
    const axiosError = err as AxiosError;
    console.error(
      'issueCredential error',
      axiosError?.response?.status,
      axiosError?.message,
      axiosError?.response?.data
    );
    return {
      ok: false,
      status: axiosError?.response?.status || null,
      error: axiosError?.response?.data || axiosError?.message || 'unknown error'
    };
  }
}


export async function verifyCredential(
  payload: VerificationPayload
): Promise<ApiResponse<VerificationResult>> {
  try {
    const { data } = await axiosInstance.post(`${VERIFY_BASE}/verify`, payload);
    return { ok: true, data };
  } catch (err) {
    const axiosError = err as AxiosError;
    console.error(
      'verifyCredential error',
      axiosError?.response?.status,
      axiosError?.message,
      axiosError?.response?.data
    );
    return {
      ok: false,
      status: axiosError?.response?.status || null,
      error: axiosError?.response?.data || axiosError?.message || 'unknown error'
    };
  }
}
