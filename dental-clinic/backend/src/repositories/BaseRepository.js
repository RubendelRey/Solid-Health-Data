import { ObjectId } from "mongodb";
import connectDB from "../config/db.js";

class BaseRepository {
	constructor(collectionName) {
		this.collectionName = collectionName;
		this.client = null;
		this.db = null;
		this.collection = null;
		this.initialize();
	}

	async initialize() {
		try {
			this.client = await connectDB();
			this.db = this.client.db(process.env.MONGO_DB_NAME || "dental_clinic");
			this.collection = this.db.collection(this.collectionName);
		} catch (error) {
			console.error(
				`Error initializing repository for ${this.collectionName}:`,
				error
			);
			throw error;
		}
	}

	async getCollection() {
		if (!this.collection) {
			await this.initialize();
		}
		return this.collection;
	}

	async findAll(query = {}, options = {}) {
		const { sort = { createdAt: -1 }, limit = 100, page = 1 } = options;

		const skip = (page - 1) * limit;

		try {
			const collection = await this.getCollection();
			return await collection
				.find(query)
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.toArray();
		} catch (error) {
			console.error(`Error in findAll for ${this.collectionName}:`, error);
			throw error;
		}
	}

	async findById(id) {
		try {
			const collection = await this.getCollection();
			const _id = typeof id === "string" ? new ObjectId(id) : id;
			return await collection.findOne({ _id });
		} catch (error) {
			console.error(`Error in findById for ${this.collectionName}:`, error);
			throw error;
		}
	}

	async findOne(query = {}) {
		try {
			const collection = await this.getCollection();
			return await collection.findOne(query);
		} catch (error) {
			console.error(`Error in findOne for ${this.collectionName}:`, error);
			throw error;
		}
	}

	async create(data) {
		try {
			const collection = await this.getCollection();
			const document = {
				...data,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const result = await collection.insertOne(document);
			return { ...document, _id: result.insertedId };
		} catch (error) {
			console.error(`Error in create for ${this.collectionName}:`, error);
			throw error;
		}
	}

	async update(id, data) {
		try {
			const collection = await this.getCollection();
			const _id = typeof id === "string" ? new ObjectId(id) : id;
			const updateData = {
				...data,
				updatedAt: new Date(),
			};

			const result = await collection.findOneAndUpdate(
				{ _id },
				{ $set: updateData },
				{ returnDocument: "after" }
			);

			return result;
		} catch (error) {
			console.error(`Error in update for ${this.collectionName}:`, error);
			throw error;
		}
	}

	async delete(id) {
		try {
			const collection = await this.getCollection();
			const _id = typeof id === "string" ? new ObjectId(id) : id;
			const result = await collection.findOneAndDelete({ _id });
			return result;
		} catch (error) {
			console.error(`Error in delete for ${this.collectionName}:`, error);
			throw error;
		}
	}

	async deleteAll(query = {}) {
		try {
			const collection = await this.getCollection();
			return await collection.deleteMany(query);
		} catch (error) {
			console.error(`Error in deleteAll for ${this.collectionName}:`, error);
			throw error;
		}
	}

	async count(query = {}) {
		try {
			const collection = await this.getCollection();
			return await collection.countDocuments(query);
		} catch (error) {
			console.error(`Error in count for ${this.collectionName}:`, error);
			throw error;
		}
	}

	async aggregate(pipeline = []) {
		try {
			const collection = await this.getCollection();
			return await collection.aggregate(pipeline).toArray();
		} catch (error) {
			console.error(`Error in aggregate for ${this.collectionName}:`, error);
			throw error;
		}
	}

	async bulkWrite(operations = [], options = {}) {
		try {
			const collection = await this.getCollection();
			return await collection.bulkWrite(operations, options);
		} catch (error) {
			console.error(`Error in bulkWrite for ${this.collectionName}:`, error);
			throw error;
		}
	}
}

export default BaseRepository;
