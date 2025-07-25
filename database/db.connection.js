import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

if (!uri) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

// Global cached connection
let cachedClient = null;
let cachedDb = null;

export const connectToDB = async () => {
  if (cachedDb) {
    console.log("Using cached MongoDB connection");
    return cachedDb;
  }

  try {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      tls: true, // Enforce TLS
      maxPoolSize: 10, // Adjust based on your needs
      connectTimeoutMS: 5000, // 5 seconds timeout
    });

    await client.connect();
    console.log("Successfully connected to MongoDB");
    
    cachedClient = client;
    cachedDb = client.db(dbName);
    
    return cachedDb;
  } catch (error) {
    console.error("MongoDB connection failed", error);
    throw error;
  }
};

// Graceful shutdown handler
process.on('SIGINT', async () => {
  if (cachedClient) {
    await cachedClient.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
});