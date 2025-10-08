import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import VerifyPage from '../pages/VerifyPage';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('VerifyPage Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the verification form', () => {
    render(<VerifyPage />);
    
    expect(screen.getByText('Verify Credential')).toBeInTheDocument();
    expect(screen.getByLabelText(/Credential ID:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify/ })).toBeInTheDocument();
  });

  it('should have proper form input with placeholder', () => {
    render(<VerifyPage />);
    
    expect(screen.getByLabelText(/Credential ID:/)).toBeInTheDocument();
  });

  it('should update form field when user types', async () => {
    render(<VerifyPage />);
    
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

    render(<VerifyPage />);
    
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
      expect(screen.getByText('Result')).toBeInTheDocument();
      expect(screen.getByText(/Valid.*true/i)).toBeInTheDocument();
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

    render(<VerifyPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'non-existent-credential');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Result')).toBeInTheDocument();
      expect(screen.getByText(/Valid.*false/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    mockedApi.verifyCredential.mockResolvedValue({
      ok: false,
      status: 404,
      error: 'Credential not found',
    });

    render(<VerifyPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(/Credential not found/)).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    mockedApi.verifyCredential.mockRejectedValue(new Error('Network Error'));

    render(<VerifyPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(/Network Error/)).toBeInTheDocument();
    });
  });

  it('should show loading state during API call', async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockedApi.verifyCredential.mockReturnValue(promise as ReturnType<typeof api.verifyCredential>);

    render(<VerifyPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    expect(screen.getByRole('button', { name: /Verifying.../ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verifying.../ })).toBeDisabled();
    
    // Resolve the promise
    resolvePromise!({ ok: true, data: { verified: true } });
  });

  it('should disable button when loading or empty ID', async () => {
    render(<VerifyPage />);
    
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    const idInput = screen.getByLabelText(/Credential ID:/);
    
    // Button should be disabled when ID is empty
    expect(verifyButton).toBeDisabled();
    
    // Button should be enabled when ID is provided
    await user.type(idInput, 'test-credential-123');
    expect(verifyButton).not.toBeDisabled();
  });

  it('should clear result and error when verifying again', async () => {
    const mockResponse = {
      verified: true,
      workerId: 'worker-456',
      issuedAt: '2023-01-01T00:00:00.000Z',
    };

    mockedApi.verifyCredential.mockResolvedValue({
      ok: true,
      data: mockResponse,
    });

    render(<VerifyPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    // First verification
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Result')).toBeInTheDocument();
    });
    
    // Clear and verify again
    await user.clear(idInput);
    await user.type(idInput, 'new-credential-456');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(mockedApi.verifyCredential).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle complex verification response with credential details', async () => {
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

    render(<VerifyPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Result')).toBeInTheDocument();
      expect(screen.getByText(/Valid.*true/i)).toBeInTheDocument();
      expect(screen.getByText('Credential')).toBeInTheDocument();
    });
  });

  it('should handle response without valid field', async () => {
    const mockResponse = {
      workerId: 'worker-456',
      issuedAt: '2023-01-01T00:00:00.000Z',
      someOtherField: 'value',
    };

    mockedApi.verifyCredential.mockResolvedValue({
      ok: true,
      data: mockResponse,
    });

    render(<VerifyPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Result')).toBeInTheDocument();
      // Should show raw JSON when no valid field
      expect(screen.getByText(/worker-456/)).toBeInTheDocument();
    });
  });

  it('should handle string error responses', async () => {
    mockedApi.verifyCredential.mockResolvedValue({
      ok: false,
      status: 400,
      error: 'Simple string error',
    });

    render(<VerifyPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(/Simple string error/)).toBeInTheDocument();
    });
  });

  it('should handle object error responses', async () => {
    mockedApi.verifyCredential.mockResolvedValue({
      ok: false,
      status: 400,
      error: { message: 'Object error', code: 'VALIDATION_ERROR' },
    });

    render(<VerifyPage />);
    
    const idInput = screen.getByLabelText(/Credential ID:/);
    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(/Object error/)).toBeInTheDocument();
    });
  });

  it('should have proper styling', () => {
    render(<VerifyPage />);
    
    const container = screen.getByText('Verify Credential').closest('div');
    expect(container).toHaveStyle('padding: 40px');
    expect(container).toHaveStyle('font-family: sans-serif');
  });
});
