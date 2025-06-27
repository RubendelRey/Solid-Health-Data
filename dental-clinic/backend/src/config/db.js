import { MongoClient } from "mongodb";

const connectDB = async () => {
  try {
    const mongoClient = new MongoClient(process.env.MONGO_URI || 'mongodb://admin:password@localhost:1445/');
    
    return mongoClient;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;