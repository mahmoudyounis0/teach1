import { connectToDB } from "./db.connection.js";

export const createIndexes = async () => {
  const db = await connectToDB();
  
  await Promise.all([
    db.collection('user').createIndex({ email: 1 }, { unique: true }),
    db.collection('pendingUser').createIndex({ email: 1 }, { unique: true }),
    db.collection('codes').createIndex({ email: 1 }, { unique: true }),
    db.collection('codes').createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })
  ]);
};