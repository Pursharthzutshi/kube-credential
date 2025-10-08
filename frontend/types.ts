// src/types.ts
export interface CredentialPayload {
  name: string;
  email: string;
  role: string;
}

export interface VerificationPayload {
  credentialId: string;
}

export interface CredentialData {
  id: string;
  issuedAt: string; 
  name: string;
  email: string;
  role: string;
}

export interface IssuanceResult {
  credential: CredentialData;
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  credential?: CredentialData;
}


export type ApiError = string | { message?: string; [key: string]: unknown } | unknown;

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  status?: number | null;
  error?: ApiError;
}
