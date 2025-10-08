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

// Frontend API Types (matching what frontend actually sends)
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

// Backend Response Types
export interface IssuanceResponse {
  message: string;
  workerId: string;
  issuedAt?: string;
}

export interface VerificationResponse {
  verified: boolean;
  workerId?: string;
  issuedAt?: string;
  error?: string;
}

// Component State Types
export interface IssuanceResult {
  ok?: boolean;
  data?: IssuanceResponse;
  error?: string | ErrorResponse;
  status?: number;
}

export interface VerificationResultState {
  ok?: boolean;
  data?: VerificationResponse;
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
