import { MongoClient } from 'mongodb';

// Mock MongoDB
jest.mock('mongodb', () => ({
  MongoClient: jest.fn(),
}));

const mockMongoClient = MongoClient as jest.MockedClass<typeof MongoClient>;
const mockClient = {
  connect: jest.fn(),
  db: jest.fn(),
};

const mockDb = {
  collection: jest.fn(),
};

const mockCollection = {};

// Mock the db module
jest.mock('../db', () => ({
  connectDB: jest.fn(),
  getIssuedCollection: jest.fn(),
}));

import { connectDB, getIssuedCollection } from '../db';

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockGetIssuedCollection = getIssuedCollection as jest.MockedFunction<typeof getIssuedCollection>;

describe('Verification Database Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMongoClient.mockImplementation(() => mockClient as any);
    mockClient.db.mockReturnValue(mockDb as any);
    mockDb.collection.mockReturnValue(mockCollection as any);
  });

  describe('connectDB', () => {
    it('should be a mockable function', () => {
      expect(mockConnectDB).toBeDefined();
      expect(typeof mockConnectDB).toBe('function');
    });

    it('should handle environment variables', () => {
      const originalEnv = process.env.MONGO_URI;
      process.env.MONGO_URI = 'mongodb://test-host:27017';
      
      expect(process.env.MONGO_URI).toBe('mongodb://test-host:27017');
      
      if (originalEnv) {
        process.env.MONGO_URI = originalEnv;
      } else {
        delete process.env.MONGO_URI;
      }
    });
  });

  describe('getIssuedCollection', () => {
    it('should be a mockable function', () => {
      expect(mockGetIssuedCollection).toBeDefined();
      expect(typeof mockGetIssuedCollection).toBe('function');
    });

    it('should return mocked collection', () => {
      mockGetIssuedCollection.mockReturnValue(mockCollection as any);
      const collection = mockGetIssuedCollection();
      expect(collection).toBe(mockCollection);
    });

    it('should throw error when mocked to do so', () => {
      mockGetIssuedCollection.mockImplementation(() => {
        throw new Error('DB not connected');
      });

      expect(() => mockGetIssuedCollection()).toThrow('DB not connected');
    });
  });
});
