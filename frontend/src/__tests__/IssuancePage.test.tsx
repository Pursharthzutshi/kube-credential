import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import IssuePage from '../pages/IssuancePage';
import * as api from '../../api';

// Mock the API module
jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('IssuancePage Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the issuance form', () => {
    render(<IssuePage />);
    
    expect(screen.getByText('Issue Credential')).toBeInTheDocument();
    expect(screen.getByLabelText(/ID:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Holder:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Extra JSON fields:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Issue/ })).toBeInTheDocument();
  });

  it('should have proper form inputs with placeholders', () => {
    render(<IssuePage />);
    
    expect(screen.getByPlaceholderText('cred-2025-06')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('{"email": "john@example.com", "department": "Design"}')).toBeInTheDocument();
  });

  it('should update form fields when user types', async () => {
    render(<IssuePage />);
    
    const idInput = screen.getByLabelText(/ID:/);
    const holderInput = screen.getByLabelText(/Holder:/);
    const subjectTextarea = screen.getByLabelText(/Extra JSON fields:/);
    
    await user.type(idInput, 'test-credential-123');
    await user.type(holderInput, 'John Doe');
    await user.type(subjectTextarea, '{"email": "john@example.com"}');
    
    expect(idInput).toHaveValue('test-credential-123');
    expect(holderInput).toHaveValue('John Doe');
    expect(subjectTextarea).toHaveValue('{"email": "john@example.com"}');
  });

  it('should successfully issue a credential', async () => {
    const mockResponse = {
      message: 'credential issued',
      workerId: 'worker-123',
      issuedAt: '2023-01-01T00:00:00.000Z',
    };

    mockedApi.issueCredential.mockResolvedValue({
      ok: true,
      data: mockResponse,
    });

    render(<IssuePage />);
    
    const idInput = screen.getByLabelText(/ID:/);
    const holderInput = screen.getByLabelText(/Holder:/);
    const issueButton = screen.getByRole('button', { name: /Issue/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.type(holderInput, 'John Doe');
    
    await user.click(issueButton);
    
    await waitFor(() => {
      expect(mockedApi.issueCredential).toHaveBeenCalledWith({
        id: 'test-credential-123',
        subject: {
          holder: 'John Doe',
        },
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Response:')).toBeInTheDocument();
      expect(screen.getByText(/credential issued/)).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    mockedApi.issueCredential.mockResolvedValue({
      ok: false,
      status: 400,
      error: 'Invalid payload',
    });

    render(<IssuePage />);
    
    const idInput = screen.getByLabelText(/ID:/);
    const issueButton = screen.getByRole('button', { name: /Issue/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(issueButton);
    
    await waitFor(() => {
      expect(screen.getByText('Response:')).toBeInTheDocument();
      expect(screen.getByText(/Invalid payload/)).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    mockedApi.issueCredential.mockRejectedValue(new Error('Network Error'));

    render(<IssuePage />);
    
    const idInput = screen.getByLabelText(/ID:/);
    const issueButton = screen.getByRole('button', { name: /Issue/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(issueButton);
    
    await waitFor(() => {
      expect(screen.getByText('Response:')).toBeInTheDocument();
      expect(screen.getByText(/Network Error/)).toBeInTheDocument();
    });
  });

  it('should show loading state during API call', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockedApi.issueCredential.mockReturnValue(promise as any);

    render(<IssuePage />);
    
    const idInput = screen.getByLabelText(/ID:/);
    const issueButton = screen.getByRole('button', { name: /Issue/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.click(issueButton);
    
    expect(screen.getByRole('button', { name: /Issuing/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Issuing/ })).toBeDisabled();
    
    // Resolve the promise
    resolvePromise!({ ok: true, data: { message: 'success' } });
  });

  it('should parse JSON subject correctly', async () => {
    const mockResponse = {
      message: 'credential issued',
      workerId: 'worker-123',
      issuedAt: '2023-01-01T00:00:00.000Z',
    };

    mockedApi.issueCredential.mockResolvedValue({
      ok: true,
      data: mockResponse,
    });

    render(<IssuePage />);
    
    const idInput = screen.getByLabelText(/ID:/);
    const holderInput = screen.getByLabelText(/Holder:/);
    const subjectTextarea = screen.getByLabelText(/Extra JSON fields:/);
    const issueButton = screen.getByRole('button', { name: /Issue/ });
    
    await user.type(idInput, 'test-credential-123');
    await user.type(holderInput, 'John Doe');
    await user.clear(subjectTextarea);
    await user.type(subjectTextarea, '{"email": "john@example.com", "department": "Engineering"}');
    
    await user.click(issueButton);
    
    await waitFor(() => {
      expect(mockedApi.issueCredential).toHaveBeenCalledWith({
        id: 'test-credential-123',
        subject: {
          holder: 'John Doe',
          email: 'john@example.com',
          department: 'Engineering',
        },
      });
    });
  });

  it('should handle empty holder with default value', async () => {
    const mockResponse = {
      message: 'credential issued',
      workerId: 'worker-123',
      issuedAt: '2023-01-01T00:00:00.000Z',
    };

    mockedApi.issueCredential.mockResolvedValue({
      ok: true,
      data: mockResponse,
    });

    render(<IssuePage />);
    
    const idInput = screen.getByLabelText(/ID:/);
    const issueButton = screen.getByRole('button', { name: /Issue/ });
    
    await user.type(idInput, 'test-credential-123');
    // Leave holder empty
    await user.click(issueButton);
    
    await waitFor(() => {
      expect(mockedApi.issueCredential).toHaveBeenCalledWith({
        id: 'test-credential-123',
        subject: {
          holder: 'Unknown Holder',
        },
      });
    });
  });

  it('should handle invalid JSON in subject field', async () => {
    render(<IssuePage />);
    
    const subjectTextarea = screen.getByLabelText(/Extra JSON fields:/);
    
    await user.clear(subjectTextarea);
    await user.type(subjectTextarea, 'invalid json');
    
    expect(subjectTextarea).toHaveValue('invalid json');
  });

  it('should clear result when issuing again', async () => {
    const mockResponse = {
      message: 'credential issued',
      workerId: 'worker-123',
      issuedAt: '2023-01-01T00:00:00.000Z',
    };

    mockedApi.issueCredential.mockResolvedValue({
      ok: true,
      data: mockResponse,
    });

    render(<IssuePage />);
    
    const idInput = screen.getByLabelText(/ID:/);
    const issueButton = screen.getByRole('button', { name: /Issue/ });
    
    // First issue
    await user.type(idInput, 'test-credential-123');
    await user.click(issueButton);
    
    await waitFor(() => {
      expect(screen.getByText('Response:')).toBeInTheDocument();
    });
    
    // Clear and issue again
    await user.clear(idInput);
    await user.type(idInput, 'new-credential-456');
    await user.click(issueButton);
    
    await waitFor(() => {
      expect(mockedApi.issueCredential).toHaveBeenCalledTimes(2);
    });
  });

  it('should have proper styling classes', () => {
    render(<IssuePage />);
    
    expect(screen.getByText('Issue Credential')).toHaveClass('text-3xl', 'font-bold', 'text-blue-600');
    expect(screen.getByRole('button', { name: /Issue/ })).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
  });
});
