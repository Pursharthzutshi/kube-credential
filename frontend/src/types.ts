// API Response Types
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string | ErrorResponse;
  status?: number | null;
}

export interface ErrorResponse {
  message?: string;
  error?: string;
  details?: unknown;
}

// Credential Types
export interface CredentialPayload {
  id: string;
  subject: {
    holder: string;
    [key: string]: unknown;
  };
}

export interface VerificationPayload {
  id: string;
}

export interface CredentialData {
  id: string;
  subject: {
    holder: string;
    [key: string]: unknown;
  };
  issuedAt?: string;
  expiresAt?: string;
  issuer?: string;
}

export interface VerificationResult {
  valid: boolean;
  verifiedBy?: string;
  timestamp?: string;
  credential?: CredentialData;
  [key: string]: unknown;
}

// Component State Types
export interface IssuanceResult {
  ok?: boolean;
  data?: CredentialData;
  error?: string | ErrorResponse;
  status?: number;
}

export interface VerificationResultState {
  ok?: boolean;
  data?: VerificationResult;
  error?: string | ErrorResponse;
  status?: number;
}

// Error Types
export interface ApiError extends Error {
  response?: {
    status?: number;
    data?: ErrorResponse;
  };
  message: string;
}
