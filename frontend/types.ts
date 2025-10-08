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
  issuedAt: string; // ISO timestamp
  name: string;
  email: string; 
  role: string;
}

export interface IssuanceResult {
  credential: CredentialData;
  // add other fields your issuance endpoint returns
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  credential?: CredentialData;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  status?: number | null;
  error?: any;
}
