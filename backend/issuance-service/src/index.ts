import { createApp } from './app';
import { connectDB } from './db';
import https from 'https';
import fs from 'fs';

const port = process.env.PORT ? Number(process.env.PORT) : 443; // use 443 for HTTPS

(async () => {
  await connectDB();
  const app = createApp();

  const sslOptions = {
    key: fs.readFileSync('./certs/key.pem'),
    cert: fs.readFileSync('./certs/cert.pem'),
  };

  https.createServer(sslOptions, app).listen(port, '0.0.0.0', () => {
    console.log(` Issuance service running on HTTPS port ${port}`);
  });
})();
