import { Credential, IssuedCredential } from '../types';

export const createMockCredential = (overrides: Partial<Credential> = {}): Credential => ({
  id: 'test-credential-123',
  holder: 'test-user',
  metadata: { type: 'test' },
  ...overrides
});

export const createMockIssuedCredential = (overrides: Partial<IssuedCredential> = {}): IssuedCredential => ({
  id: 'test-credential-123',
  holder: 'test-user',
  metadata: { type: 'test' },
  issuedAt: '2023-01-01T00:00:00.000Z',
  workerId: 'worker-123',
  ...overrides
});

export const mockMongoCollection = {
  findOne: jest.fn(),
  insertOne: jest.fn(),
  createIndex: jest.fn(),
  find: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
};

export const mockMongoClient = {
  connect: jest.fn(),
  close: jest.fn(),
  db: jest.fn(),
};

export const mockMongoDb = {
  collection: jest.fn(),
};

export const setupMongoMocks = () => {
  jest.clearAllMocks();
  mockMongoDb.collection.mockReturnValue(mockMongoCollection);
  mockMongoClient.db.mockReturnValue(mockMongoDb);
};

export const resetEnvironmentVariables = () => {
  const originalEnv = { ...process.env };
  
  return {
    restore: () => {
      process.env = originalEnv;
    },
    setWorkerId: (workerId: string) => {
      process.env.WORKER_ID = workerId;
    },
    unsetWorkerId: () => {
      delete process.env.WORKER_ID;
    },
    setMongoUri: (uri: string) => {
      process.env.MONGO_URI = uri;
    },
    setDbName: (name: string) => {
      process.env.DB_NAME = name;
    }
  };
};

export const expectValidTimestamp = (timestamp: string) => {
  expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  expect(new Date(timestamp).getTime()).not.toBeNaN();
};

export const expectValidWorkerId = (workerId: string) => {
  expect(workerId).toMatch(/^worker-\d+$/);
};
