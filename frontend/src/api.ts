import axios, { AxiosError } from 'axios';
import type { 
  CredentialPayload, 
  VerificationPayload, 
  ApiResponse, 
  IssuanceResponse, 
  VerificationResponse,
} from './types';

// Environment variables - works in both Vite and Node.js environments
const ISSUANCE_BASE = process.env.VITE_ISSUANCE_URL || 'http://localhost:4001';
const VERIFY_BASE = process.env.VITE_VERIFY_URL || 'http://localhost:4002';

const axiosInstance = axios.create({
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

export async function issueCredential(payload: CredentialPayload): Promise<ApiResponse<IssuanceResponse>> {
  try {
    const { data } = await axiosInstance.post(`${ISSUANCE_BASE}/issue`, payload);
    return { ok: true, data };
  } catch (err) {
    const axiosError = err as AxiosError;
    // Normalize error for frontend
    console.error('issueCredential error', axiosError?.response?.status, axiosError?.message, axiosError?.response?.data);
    return {
      ok: false,
      status: axiosError?.response?.status || null,
      error: axiosError?.response?.data || axiosError?.message || 'unknown error'
    };
  }
}

export async function verifyCredential(payload: VerificationPayload): Promise<ApiResponse<VerificationResponse>> {
  try {
    const { data } = await axiosInstance.post(`${VERIFY_BASE}/verify`, payload);
    return { ok: true, data };
  } catch (err) {
    const axiosError = err as AxiosError;
    console.error('verifyCredential error', axiosError?.response?.status, axiosError?.message, axiosError?.response?.data);
    return {
      ok: false,
      status: axiosError?.response?.status || null,
      error: axiosError?.response?.data || axiosError?.message || 'unknown error'
    };
  }
}
