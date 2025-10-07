import { Router } from 'express';
import { getIssuedCollection } from './db';

const router = Router();

function getWorkerId() { return process.env.WORKER_ID || `worker-${Math.floor(Math.random()*1000)}`; }

router.post('/verify', async (req, res) => {
try {
const { id } = req.body;
if (!id) return res.status(400).json({ error: 'credential id required' });


const coll = getIssuedCollection();
const found = await coll.findOne({ id });
if (!found) return res.status(404).json({ verified: false });


return res.json({ verified: true, workerId: getWorkerId(), issuedAt: found.issuedAt });
} catch (err: any) {
return res.status(500).json({ error: err.message });
}
});


export default router;