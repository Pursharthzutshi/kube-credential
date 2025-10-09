import request from 'supertest';
import { createApp } from '../app';
import { getIssuedCollection, connectDB, closeDB } from '../db';
import { IssuedCredential, Credential } from '../types';

// Mock MongoDB
jest.mock('../db', () => ({
  getIssuedCollection: jest.fn(),
  connectDB: jest.fn(),
  closeDB: jest.fn(),
}));

const mockCollection = {
  findOne: jest.fn(),
  insertOne: jest.fn(),
  createIndex: jest.fn(),
};

const mockGetIssuedCollection = getIssuedCollection as jest.MockedFunction<typeof getIssuedCollection>;

describe('Issuance Service', () => {
  let app: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIssuedCollection.mockReturnValue(mockCollection as any);
    app = createApp();
  });

  describe('POST /issue', () => {
    const validCredential: Credential = {
      id: 'test-credential-123',
      holder: 'test-user',
      metadata: { type: 'test' }
    };

    it('should issue a new credential successfully', async () => {
      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.insertOne.mockResolvedValue({ insertedId: 'test-id' });

      const response = await request(app)
        .post('/issue')
        .send(validCredential)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'credential issued',
        workerId: expect.any(String),
        issuedAt: expect.any(String)
      });

      expect(mockCollection.findOne).toHaveBeenCalledWith({ id: validCredential.id });
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: validCredential.id,
          holder: validCredential.holder,
          metadata: validCredential.metadata,
          issuedAt: expect.any(String),
          workerId: expect.any(String)
        })
      );
    });

    it('should return 200 when credential already exists', async () => {
      const existingCredential: IssuedCredential = {
        ...validCredential,
        issuedAt: '2023-01-01T00:00:00.000Z',
        workerId: 'worker-123'
      };

      mockCollection.findOne.mockResolvedValue(existingCredential);

      const response = await request(app)
        .post('/issue')
        .send(validCredential)
        .expect(200);

      expect(response.body).toEqual({
        message: 'credential already issued',
        workerId: 'worker-123'
      });

      expect(mockCollection.findOne).toHaveBeenCalledWith({ id: validCredential.id });
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should return 400 when credential is missing', async () => {
      const response = await request(app)
        .post('/issue')
        .send({})
        .expect(400);

      expect(response.body).toEqual({ error: 'credential must contain id' });
    });

    it('should return 400 when credential id is missing', async () => {
      const response = await request(app)
        .post('/issue')
        .send({ holder: 'test-user' })
        .expect(400);

      expect(response.body).toEqual({ error: 'credential must contain id' });
    });

    it('should handle MongoDB duplicate key error', async () => {
      mockCollection.findOne.mockResolvedValue(null);
      const duplicateError = new Error('Duplicate key error');
      (duplicateError as any).code = 11000;
      mockCollection.insertOne.mockRejectedValue(duplicateError);

      const response = await request(app)
        .post('/issue')
        .send(validCredential)
        .expect(200);

      expect(response.body).toEqual({
        message: 'credential already issued (race)',
        workerId: 'unknown'
      });
    });

    it('should handle database errors', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/issue')
        .send(validCredential)
        .expect(500);

      expect(response.body).toEqual({ error: 'Database connection failed' });
    });

    it('should handle insertOne errors', async () => {
      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.insertOne.mockRejectedValue(new Error('Insert failed'));

      const response = await request(app)
        .post('/issue')
        .send(validCredential)
        .expect(500);

      expect(response.body).toEqual({ error: 'Insert failed' });
    });

    it('should generate consistent worker ID when WORKER_ID env var is set', async () => {
      const originalWorkerId = process.env.WORKER_ID;
      process.env.WORKER_ID = 'test-worker-123';

      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.insertOne.mockResolvedValue({ insertedId: 'test-id' });

      const response = await request(app)
        .post('/issue')
        .send(validCredential)
        .expect(201);

      expect(response.body.workerId).toBe('test-worker-123');

      // Restore original value
      if (originalWorkerId) {
        process.env.WORKER_ID = originalWorkerId;
      } else {
        delete process.env.WORKER_ID;
      }
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
      process.env.WORKER_ID = 'test-worker-456';

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        worker: 'test-worker-456'
      });

      // Restore original value
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
