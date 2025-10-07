import { MongoClient, Collection } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'kube_credential';

let client: MongoClient;
let issuedCollection: Collection;

export async function connectDB() {
  client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  issuedCollection = db.collection('issued_credentials');
  await issuedCollection.createIndex({ id: 1 }, { unique: true });
}

export function getIssuedCollection() {
  if (!issuedCollection) throw new Error('DB not connected');
  return issuedCollection;
}

export async function closeDB() {
  await client?.close();
}
