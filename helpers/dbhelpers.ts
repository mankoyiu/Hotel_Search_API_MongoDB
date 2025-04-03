import { MongoClient, ServerApiVersion, ObjectId, Db } from 'mongodb';

const uri = "mongodb+srv://xxxx:xxxx@cluster0.xo02lwp.mongodb.net";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Global variable to hold the database instance
let db: Db;
let isConnected = false;

// Function to initialize the database connection
const initializeDb = async () => {
  try {
    if (!isConnected) {
      await client.connect();
      db = client.db('apihoteldb');
      isConnected = true;
      console.log('Database connected successfully');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

// Initialize the database connection
initializeDb();

// Function to ensure database is connected before operations
const ensureConnected = async () => {
  if (!isConnected) {
    await initializeDb();
  }
  return db;
};

// Find documents that match the given query
export const find = async (collectionName: string, query: any) => {
  try {
    const db = await ensureConnected();
    const collection = db.collection(collectionName);
    return await collection.find(query).toArray();
  } catch (error) {
    console.error('Database error in find:', error);
    throw error;
  }
};

// Function to find a document by ID
export const findById = async (collectionName: string, id: string) => {
  try {
    const collection = db.collection(collectionName);
    return await collection.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error('Database error in findById:', error);
    throw error;
  }
};

// Function to add a new document to a collection
export const add = async (collectionName: string, document: any) => {
  try {
    const collection = db.collection(collectionName);
    return await collection.insertOne(document);
  } catch (error) {
    console.error('Database error in add:', error);
    throw error;
  }
};

// Function to update a document by ID or query
export const update: any = async (collectionName: string, query: any, newItem: any) => {
  let values: any;
  try {
      const collection = db.collection(collectionName);
      
      // Ensure query is in the proper format
      if (typeof query === 'string') {
          query = { _id: new ObjectId(query) };
      } else if (query._id && typeof query._id === 'string') {
          query._id = new ObjectId(query._id);
      }

      const updateDoc = { $set: newItem };
      const result = await collection.updateOne(query, updateDoc);
      values = {
          acknowledged: result.acknowledged,
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount
      };
      return values;
  } catch (error) {
      console.error('Database error in update:', error);
      values = error;
      throw error;
  }
};

// Function to remove a document
export const remove = async (collectionName: string, query: Record<string, any>) => {
  try {
    const collection = db.collection(collectionName);
    return await collection.deleteOne(query);
  } catch (error) {
    console.error('Database error in remove:', error);
    throw error;
  }
};

// Function to get the maximum uid using MongoDB sorting and limiting
export const getMaxUid = async (collectionName: string) => {
  try {
    const collection = db.collection(collectionName);
    const maxArticle = await collection
      .find({})
      .sort({ uid: -1 }) // sort in descending order by uid
      .limit(1)
      .toArray();
    
    if (maxArticle.length > 0 && typeof maxArticle[0].uid === 'number') {
      return maxArticle[0].uid;
    }
    return 0;
  } catch (error) {
    console.error('Database error in getMaxUid:', error);
    throw error;
  }
};

// Function to get the database instance
export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

// Close the client when the application is shutting down
process.on('SIGINT', async () => {
  if (isConnected) {
    await client.close();
    isConnected = false;
    console.log('Database connection closed');
  }
  process.exit(0);
});