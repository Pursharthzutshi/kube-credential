import { createApp } from './app';
import { connectDB } from './db';


const port = process.env.PORT ? Number(process.env.PORT) : 4001;
(async () => {
await connectDB();
const app = createApp();
app.listen(port, () => {
console.log(`Issuance service running on ${port} — worker=${process.env.WORKER_ID || 'dev'}`);
});
})();