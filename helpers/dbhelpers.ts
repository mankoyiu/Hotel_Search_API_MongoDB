import { MongoClient, ServerApiVersion, ObjectId, Db } from 'mongodb';

const uri = "mongodb+srv://xxxxx:xxxxxx@cluster0.xo02lwp.mongodb.net";
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
      console.log('Attempting to connect to MongoDB...');
      await client.connect();
      console.log('Connected to MongoDB server');
      
      db = client.db('apihoteldb');
      console.log('Selected database: apihoteldb');
      
      // Verify the hotels collection exists
      const collections = await db.listCollections({ name: 'hotels' }).toArray();
      console.log('Found collections:', collections.map(c => c.name));
      
      if (collections.length === 0) {
        console.log('Hotels collection not found, creating it...');
        await db.createCollection('hotels');
        console.log('Hotels collection created');
      }
      
      isConnected = true;
      console.log('Database initialization completed successfully');
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

// Modified find function to work specifically with members collection for auth
export const find = async (collection: string, query: any) => {
    try {
        console.log(`Finding documents in collection '${collection}' with query:`, query);
        await initializeDb();
        const result = await db.collection(collection).find(query).toArray();
        console.log(`Found ${result.length} documents in '${collection}'`);
        return result;
    } catch (err) {
        console.error(`Error finding documents in '${collection}':`, err);
        throw err;
    }
};

// NEW: Specialized function for member authentication
// export const authenticateMember = async (username: string, password: string) => {
//   try {
//     const db = await ensureConnected();
//     const collection = db.collection('members');
    
//     // Find member with username and password
//     const member = await collection.findOne({ 
//       username, 
//       password // Note: In production, you should use hashed passwords
//     });
    
//     if (!member) {
//       throw new Error('Invalid credentials');
//     }
    
//     // Generate and store token
//     const token = Date.now().toString();
//     await collection.updateOne(
//       { _id: member._id },
//       { $set: { token } }
//     );
    
//     return {
//       ...member,
//       token,
//       password: undefined // Remove password from return object
//     };
    
//   } catch (error) {
//     console.error('Authentication error:', error);
//     throw error;
//   }
// };


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
export const add = async (collection: string, document: any) => {
    try {
        console.log(`Adding document to collection '${collection}':`, document);
        await initializeDb();
        const result = await db.collection(collection).insertOne(document);
        console.log(`Document added to '${collection}' with ID:`, result.insertedId);
        return result;
    } catch (err) {
        console.error(`Error adding document to '${collection}':`, err);
        throw err;
    }
};

// Function to update a document by ID
export const update = async (collection: string, query: any, update: any) => {
    try {
        console.log(`Updating documents in collection '${collection}' with query:`, query);
        console.log('Update:', update);
        await initializeDb();
        const result = await db.collection(collection).updateOne(query, { $set: update });
        console.log(`Updated ${result.modifiedCount} documents in '${collection}'`);
        return result;
    } catch (err) {
        console.error(`Error updating documents in '${collection}':`, err);
        throw err;
    }
};
// export const update:any = async (collectionName: string, query: any, newItem: any) => {
//   let values: any;
//   try {
//     const collection = db.collection(collectionName);
//         // If the query contains an _id field, convert it to ObjectId
//         if (query._id && typeof query._id === 'string') {
//           query._id = new ObjectId(query._id);
//       }
//       // Prepare the update document
//       const updateDoc = { $set: newItem };
//       // Perform the update operation
//     return await collection.updateOne(query, updateDoc);
//   } catch (error) {
//     console.error('Database error in update:', error);
//     values = error;
//     throw error;
//   }
// };

// export const update = async (collectionName: string, id: string, document: any) => {
//   try {
//     const collection = db.collection(collectionName);
//     return await collection.updateOne(
//       { _id: new ObjectId(id) },
//       { $set: document }
//     );
//   } catch (error) {
//     console.error('Database error in update:', error);
//     throw error;
//   }
// };


// Function to remove a document
export const remove = async (collection: string, query: any) => {
    try {
        console.log(`Removing documents from collection '${collection}' with query:`, query);
        await initializeDb();
        const result = await db.collection(collection).deleteOne(query);
        console.log(`Removed ${result.deletedCount} documents from '${collection}'`);
        return result;
    } catch (err) {
        console.error(`Error removing documents from '${collection}':`, err);
        throw err;
    }
};

// New function to get the maximum uid using MongoDB sorting and limiting
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
