import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
let client: MongoClient | null = null;
let dbPromise: Promise<MongoClient> | null = null;

export async function getMongoClient() {
  if (client) return client;
  if (!dbPromise) {
    console.log("Connecting to MongoDB...", uri.replace(/:[^:]*@/, ':***@'));
    dbPromise = MongoClient.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
  }
  client = await dbPromise;
  return client;
}

export async function loadState(collectionName: string, defaultData: any) {
  try {
    const c = await getMongoClient();
    const db = c.db("worksphere");
    // @ts-ignore - TS complains about string _id, but we are using string IDs
    const doc = await db.collection(collectionName).findOne({ _id: "main_state" as any });
    if (doc && doc.data) {
      return doc.data;
    }
  } catch (err) {
    console.error(`Failed to load state from MongoDB (${collectionName}), falling back to default/local`, err);
  }
  
  // Try to load from local file as fallback
  try {
    const localPath = path.resolve(process.cwd(), collectionName === 'main_db' ? 'db.json' : 'saas_db.json');
    if (fs.existsSync(localPath)) {
      const data = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
      return data;
    }
  } catch (e) {}

  return defaultData;
}

export async function saveState(collectionName: string, data: any) {
  try {
    const c = await getMongoClient();
    const db = c.db("worksphere");
    await db.collection(collectionName).updateOne(
      // @ts-ignore
      { _id: "main_state" as any },
      { $set: { data, updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error(`Failed to save state to MongoDB (${collectionName})`, err);
  }
}
