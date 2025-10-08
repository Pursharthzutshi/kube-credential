import axios from 'axios';
import { issueCredential, verifyCredential } from '../../api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockAxiosInstance = {
  post: jest.fn(),
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
};

mockedAxios.create.mockReturnValue(mockAxiosInstance as unknown as ReturnType<typeof axios.create>);

describe('API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('issueCredential', () => {
    const mockPayload = {
      id: 'test-credential-123',
      subject: {
        holder: 'John Doe',
        email: 'john@example.com',
      },
    };

    it('should successfully issue a credential', async () => {
      const mockResponse = {
        message: 'credential issued',
        workerId: 'worker-123',
        issuedAt: '2023-01-01T00:00:00.000Z',
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await issueCredential(mockPayload);

      expect(result).toEqual({
        ok: true,
        data: mockResponse,
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'http://localhost:4001/issue',
        mockPayload
      );
    });

    it('should handle API errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { error: 'Invalid payload' },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      const result = await issueCredential(mockPayload);

      expect(result).toEqual({
        ok: false,
        status: 400,
        error: { error: 'Invalid payload' },
      });
    });

    it('should handle network errors', async () => {
      const mockError = {
        message: 'Network Error',
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      const result = await issueCredential(mockPayload);

      expect(result).toEqual({
        ok: false,
        status: null,
        error: 'Network Error',
      });
    });

    it('should handle unknown errors', async () => {
      mockAxiosInstance.post.mockRejectedValue('Unknown error');

      const result = await issueCredential(mockPayload);

      expect(result).toEqual({
        ok: false,
        status: null,
        error: 'Unknown error',
      });
    });
  });

  describe('verifyCredential', () => {
    const mockPayload = { id: 'test-credential-123' };

    it('should successfully verify a credential', async () => {
      const mockResponse = {
        verified: true,
        workerId: 'worker-456',
        issuedAt: '2023-01-01T00:00:00.000Z',
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await verifyCredential(mockPayload);

      expect(result).toEqual({
        ok: true,
        data: mockResponse,
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'http://localhost:4002/verify',
        mockPayload
      );
    });

    it('should handle verification failure', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { verified: false },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      const result = await verifyCredential(mockPayload);

      expect(result).toEqual({
        ok: false,
        status: 404,
        error: { verified: false },
      });
    });

    it('should handle server errors', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      const result = await verifyCredential(mockPayload);

      expect(result).toEqual({
        ok: false,
        status: 500,
        error: { error: 'Internal server error' },
      });
    });

    it('should handle network errors', async () => {
      const mockError = {
        message: 'Connection timeout',
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      const result = await verifyCredential(mockPayload);

      expect(result).toEqual({
        ok: false,
        status: null,
        error: 'Connection timeout',
      });
    });
  });

  describe('Environment Variables', () => {
    it('should use default URLs when environment variables are not set', async () => {
      const mockResponse = { message: 'success' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      await issueCredential({ id: 'test' });
      await verifyCredential({ id: 'test' });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'http://localhost:4001/issue',
        { id: 'test' }
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'http://localhost:4002/verify',
        { id: 'test' }
      );
    });
  });
});
