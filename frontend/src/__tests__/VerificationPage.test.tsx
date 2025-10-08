import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import VerificationPage from '../pages/VerificationPage';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('VerificationPage Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the verification form', () => {
    render(<VerificationPage />);
    
    expect(screen.getByText('Verify Credential')).toBeInTheDocument();
    expect(screen.getByLabelText(/Credential ID:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify/ })).toBeInTheDocument();
  });

  it('should have proper form input with placeholder', () => {
    render(<VerificationPage />);
    
    expect(screen.getByPlaceholderText('cred-2025-06')).toBeInTheDocument();
  });

  it('should update form field when user types', async () => {
    render(<VerificationPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    
    await user.type(idInput, 'test-credential-123');
    
    expect(idInput).toHaveValue('test-credential-123');
  });

  it('should successfully verify a credential', async () => {
    const mockResponse = {
      verified: true,
      workerId: 'worker-456',
      issuedAt: '2023-01-01T00:00:00.000Z',
    };

    mockedApi.verifyCredential.mockResolvedValue({
      ok: true,
      data: mockResponse,
    });

    render(<VerificationPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(mockedApi.verifyCredential).toHaveBeenCalledWith({
        id: 'test-credential-123',
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Result:')).toBeInTheDocument();
      expect(screen.getByText(/verified.*true/i)).toBeInTheDocument();
    });
  });

  it('should handle verification failure', async () => {
    const mockResponse = {
      verified: false,
    };

    mockedApi.verifyCredential.mockResolvedValue({
      ok: true,
      data: mockResponse,
    });

    render(<VerificationPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'non-existent-credential');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Result:')).toBeInTheDocument();
      expect(screen.getByText(/verified.*false/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    mockedApi.verifyCredential.mockResolvedValue({
      ok: false,
      status: 404,
      error: 'Credential not found',
    });

    render(<VerificationPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Result:')).toBeInTheDocument();
      expect(screen.getByText(/Credential not found/)).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    mockedApi.verifyCredential.mockRejectedValue(new Error('Network Error'));

    render(<VerificationPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Result:')).toBeInTheDocument();
      expect(screen.getByText(/Network Error/)).toBeInTheDocument();
    });
  });

  it('should show loading state during API call', async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockedApi.verifyCredential.mockReturnValue(promise as ReturnType<typeof api.verifyCredential>);

    render(<VerificationPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    expect(screen.getByRole('button', { name: /Verifying.../ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verifying.../ })).toBeDisabled();
    
    // Resolve the promise
    resolvePromise!({ ok: true, data: { verified: true } });
  });

  it('should handle form submission', async () => {
    const mockResponse = {
      verified: true,
      workerId: 'worker-456',
      issuedAt: '2023-01-01T00:00:00.000Z',
    };

    mockedApi.verifyCredential.mockResolvedValue({
      ok: true,
      data: mockResponse,
    });

    render(<VerificationPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    
    await user.type(idInput, 'test-credential-123');
    await user.click(screen.getByRole('button', { name: /Verify/ }));
    
    await waitFor(() => {
      expect(mockedApi.verifyCredential).toHaveBeenCalledWith({
        id: 'test-credential-123',
      });
    });
  });

  it('should clear message when verifying again', async () => {
    const mockResponse = {
      verified: true,
      workerId: 'worker-456',
      issuedAt: '2023-01-01T00:00:00.000Z',
    };

    mockedApi.verifyCredential.mockResolvedValue({
      ok: true,
      data: mockResponse,
    });

    render(<VerificationPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    // First verification
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Result:')).toBeInTheDocument();
    });
    
    // Clear and verify again
    await user.clear(idInput);
    await user.type(idInput, 'new-credential-456');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(mockedApi.verifyCredential).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle empty credential ID', async () => {
    render(<VerificationPage />);
    
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(mockedApi.verifyCredential).toHaveBeenCalledWith({
        id: '',
      });
    });
  });

  it('should have proper styling classes', () => {
    render(<VerificationPage />);
    
    expect(screen.getByText('Verify Credential')).toHaveClass('text-3xl', 'font-bold', 'text-blue-600');
    expect(screen.getByRole('button', { name: /Verify/ })).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
  });

  it('should handle complex verification response', async () => {
    const mockResponse = {
      verified: true,
      workerId: 'worker-789',
      issuedAt: '2023-01-01T00:00:00.000Z',
      credential: {
        id: 'test-credential-123',
        holder: 'John Doe',
        metadata: {
          type: 'education',
          institution: 'University',
        },
      },
    };

    mockedApi.verifyCredential.mockResolvedValue({
      ok: true,
      data: mockResponse,
    });

    render(<VerificationPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Result:')).toBeInTheDocument();
      expect(screen.getByText(/verified.*true/i)).toBeInTheDocument();
    });
  });
});
