import BaseRepository from "./BaseRepository.js";

class LoadTestResultRepository extends BaseRepository {
	constructor() {
		super("loadTestResults");
	}

	async create(testResultData) {
		try {
			const collection = await this.getCollection();
			const result = await collection.insertOne({
				testDate: testResultData.testDate || new Date(),
				duration: testResultData.duration,
				solidServer: testResultData.solidServer,
				triplesCount: testResultData.triplesCount,
				createdAt: new Date(),
			});

			return {
				_id: result.insertedId,
				testDate: testResultData.testDate || new Date(),
				duration: testResultData.duration,
				solidServer: testResultData.solidServer,
				triplesCount: testResultData.triplesCount,
				createdAt: new Date(),
			};
		} catch (error) {
			console.error("Error creating load test result:", error);
			throw error;
		}
	}

	async findAll(page = 1, limit = 20, filters = {}) {
		try {
			const skip = (page - 1) * limit;
			const query = this.buildQuery(filters);
			const collection = await this.getCollection();

			const results = await collection
				.find(query)
				.sort({ testDate: -1 })
				.skip(skip)
				.limit(limit)
				.toArray();

			const total = await collection.countDocuments(query);

			return {
				results,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			console.error("Error finding load test results:", error);
			throw error;
		}
	}

	async getBasicStats(filters = {}) {
		try {
			const collection = await this.getCollection();
			const query = this.buildQuery(filters);

			const pipeline = [
				{ $match: query },
				{
					$group: {
						_id: null,
						totalTests: { $sum: 1 },
						avgDuration: { $avg: "$duration" },
						totalTriples: { $sum: "$triplesCount" },
						minDuration: { $min: "$duration" },
						maxDuration: { $max: "$duration" },
					},
				},
			];

			const result = await collection.aggregate(pipeline).toArray();

			if (result.length === 0) {
				return {
					totalTests: 0,
					avgDuration: 0,
					totalTriples: 0,
					minDuration: 0,
					maxDuration: 0,
				};
			}

			return result[0];
		} catch (error) {
			console.error("Error getting basic stats:", error);
			throw error;
		}
	}

	buildQuery(filters) {
		const query = {};

		if (filters.dateFrom || filters.dateTo) {
			query.testDate = {};
			if (filters.dateFrom) {
				query.testDate.$gte = new Date(filters.dateFrom);
			}
			if (filters.dateTo) {
				query.testDate.$lte = new Date(filters.dateTo);
			}
		}

		if (filters.solidServer) {
			query.solidServer = filters.solidServer;
		}

		if (filters.triplesCountMin || filters.triplesCountMax) {
			query.triplesCount = {};
			if (filters.triplesCountMin) {
				query.triplesCount.$gte = parseInt(filters.triplesCountMin);
			}
			if (filters.triplesCountMax) {
				query.triplesCount.$lte = parseInt(filters.triplesCountMax);
			}
		}

		return query;
	}
}

export default new LoadTestResultRepository();
