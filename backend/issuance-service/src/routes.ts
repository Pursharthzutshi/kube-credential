import { Router } from 'express';
import { getIssuedCollection } from './db';
import { v4 as uuidv4 } from 'uuid';
import { IssuedCredential, Credential } from './types';


const router = Router();


function getWorkerId() {
return process.env.WORKER_ID || `worker-${Math.floor(Math.random() * 1000)}`;
}


router.post('/issue', async (req, res) => {
try {
const cred: Credential = req.body;
if (!cred || !cred.id) return res.status(400).json({ error: 'credential must contain id' });


const coll = getIssuedCollection();
const existing = await coll.findOne({ id: cred.id });
if (existing) {
return res.status(200).json({ message: 'credential already issued', workerId: existing.workerId });
}


const workerId = getWorkerId();
const issued: IssuedCredential = { ...cred, issuedAt: new Date().toISOString(), workerId };
await coll.insertOne(issued);
return res.status(201).json({ message: 'credential issued', workerId, issuedAt: issued.issuedAt });
} catch (err: any) {
if (err.code === 11000) {
return res.status(200).json({ message: 'credential already issued (race)', workerId: 'unknown' });
}
return res.status(500).json({ error: err.message });
}
});


export default router;