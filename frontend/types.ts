// types.ts
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

export interface VerificationResult {
  valid: boolean;
  reason?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  status?: number | null;
  error?: unknown;
}
