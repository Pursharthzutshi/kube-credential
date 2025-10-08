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

// Credential Data Type (what tests expect)
export interface CredentialData {
  id: string;
  holder: string;
  issuedAt?: string;
  name?: string;
  email?: string;
  role?: string;
  metadata?: Record<string, unknown>;
}

// Backend Response Types (what the API actually returns)
export interface IssuanceResponse {
  message: string;
  workerId: string;
  issuedAt?: string;
  credential?: CredentialData;
}

export interface VerificationResponse {
  valid: boolean;
  workerId?: string;
  issuedAt?: string;
  error?: string;
  credential?: CredentialData;
}

// Component State Types (what components actually use)
export interface IssuanceResult {
  ok?: boolean;
  data?: IssuanceResponse;
  error?: string | ErrorResponse;
  status?: number;
}

export interface VerificationResult {
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
