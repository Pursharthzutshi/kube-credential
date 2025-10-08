import axios, { AxiosError } from 'axios';
import type { 
  CredentialPayload, 
  VerificationPayload, 
  ApiResponse, 
  IssuanceResult, 
  VerificationResult
} from './types';

const ISSUANCE_BASE = import.meta.env.VITE_ISSUANCE_URL || 'http://localhost:4001';
const VERIFY_BASE = import.meta.env.VITE_VERIFY_URL || 'http://localhost:4002';

const axiosInstance = axios.create({
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});


export async function issueCredential(
  payload: CredentialPayload
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
