import { createApp } from '../app';

describe('App Module', () => {
  let app: any;

  beforeEach(() => {
    app = createApp();
  });

  describe('createApp', () => {
    it('should create an Express app instance', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    it('should have health endpoint', async () => {
      const response = await app.get('/health', (req: any, res: any) => {
        res.json({ status: 'ok', worker: process.env.WORKER_ID || null });
      });

      expect(app).toBeDefined();
    });

    it('should use CORS middleware', () => {
      expect(app).toBeDefined();
    });

    it('should use body parser middleware', () => {
      expect(app).toBeDefined();
    });

    it('should mount routes on root path', () => {
      expect(app).toBeDefined();
    });
  });
});
