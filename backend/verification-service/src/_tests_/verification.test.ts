import request from 'supertest';
import { createApp } from '../app';
import { getIssuedCollection } from '../db';
import { IssuedCredential } from '../types';

// Mock MongoDB
jest.mock('../db', () => ({
  getIssuedCollection: jest.fn(),
}));

const mockCollection = {
  findOne: jest.fn(),
};

const mockGetIssuedCollection = getIssuedCollection as jest.MockedFunction<typeof getIssuedCollection>;

describe('Verification Service', () => {
  let app: any;

  beforeEach(() => {
    app = createApp();
    mockGetIssuedCollection.mockReturnValue(mockCollection as any);
    jest.clearAllMocks();
  });

  describe('POST /verify', () => {
    const testCredentialId = 'test-credential-123';
    const existingCredential: IssuedCredential = {
      id: testCredentialId,
      holder: 'test-user',
      metadata: { type: 'test' },
      issuedAt: '2023-01-01T00:00:00.000Z',
      workerId: 'worker-123'
    };

    it('should verify an existing credential successfully', async () => {
      mockCollection.findOne.mockResolvedValue(existingCredential);

      const response = await request(app)
        .post('/verify')
        .send({ id: testCredentialId })
        .expect(200);

      expect(response.body).toEqual({
        verified: true,
        workerId: expect.any(String),
        issuedAt: existingCredential.issuedAt
      });

      expect(mockCollection.findOne).toHaveBeenCalledWith({ id: testCredentialId });
    });

    it('should return 404 when credential not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/verify')
        .send({ id: 'non-existent-credential' })
        .expect(404);

      expect(response.body).toEqual({ verified: false });
      expect(mockCollection.findOne).toHaveBeenCalledWith({ id: 'non-existent-credential' });
    });

    it('should return 400 when credential id is missing', async () => {
      const response = await request(app)
        .post('/verify')
        .send({})
        .expect(400);

      expect(response.body).toEqual({ error: 'credential id required' });
    });

    it('should return 400 when credential id is empty string', async () => {
      const response = await request(app)
        .post('/verify')
        .send({ id: '' })
        .expect(400);

      expect(response.body).toEqual({ error: 'credential id required' });
    });

    it('should return 400 when credential id is null', async () => {
      const response = await request(app)
        .post('/verify')
        .send({ id: null })
        .expect(400);

      expect(response.body).toEqual({ error: 'credential id required' });
    });

    it('should return 400 when credential id is undefined', async () => {
      const response = await request(app)
        .post('/verify')
        .send({ id: undefined })
        .expect(400);

      expect(response.body).toEqual({ error: 'credential id required' });
    });

    it('should handle database errors', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/verify')
        .send({ id: testCredentialId })
        .expect(500);

      expect(response.body).toEqual({ error: 'Database connection failed' });
    });

    it('should generate consistent worker ID when WORKER_ID env var is set', async () => {
      const originalWorkerId = process.env.WORKER_ID;
      process.env.WORKER_ID = 'test-worker-456';

      mockCollection.findOne.mockResolvedValue(existingCredential);

      const response = await request(app)
        .post('/verify')
        .send({ id: testCredentialId })
        .expect(200);

      expect(response.body.workerId).toBe('test-worker-456');

      if (originalWorkerId) {
        process.env.WORKER_ID = originalWorkerId;
      } else {
        delete process.env.WORKER_ID;
      }
    });

    it('should generate random worker ID when WORKER_ID is not set', async () => {
      const originalWorkerId = process.env.WORKER_ID;
      delete process.env.WORKER_ID;

      mockCollection.findOne.mockResolvedValue(existingCredential);

      const response = await request(app)
        .post('/verify')
        .send({ id: testCredentialId })
        .expect(200);

      expect(response.body.workerId).toMatch(/^worker-\d+$/);

      if (originalWorkerId) {
        process.env.WORKER_ID = originalWorkerId;
      }
    });

    it('should handle additional fields in request body', async () => {
      mockCollection.findOne.mockResolvedValue(existingCredential);

      const response = await request(app)
        .post('/verify')
        .send({ 
          id: testCredentialId,
          extraField: 'should be ignored',
          anotherField: 123
        })
        .expect(200);

      expect(response.body.verified).toBe(true);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ id: testCredentialId });
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        worker: null
      });
    });

    it('should return worker ID when WORKER_ID is set', async () => {
      const originalWorkerId = process.env.WORKER_ID;
      process.env.WORKER_ID = 'test-worker-789';

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        worker: 'test-worker-789'
      });

      if (originalWorkerId) {
        process.env.WORKER_ID = originalWorkerId;
      } else {
        delete process.env.WORKER_ID;
      }
    });
  });

  describe('App Configuration', () => {
    it('should create app with correct middleware', () => {
      expect(app).toBeDefined();
    });
  });
});
