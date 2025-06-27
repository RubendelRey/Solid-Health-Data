import { ObjectId } from "mongodb";
import BaseRepository from "./BaseRepository.js";

class InterventionRepository extends BaseRepository {
	constructor() {
		super("interventions");
	}

	async findByPatient(patientId, options = {}) {
		try {
			return await this.findAll({ patient: new ObjectId(patientId) }, options);
		} catch (error) {
			console.error("Error in findByPatient:", error);
			throw error;
		}
	}

	async findByDoctor(doctorId, options = {}) {
		try {
			return await this.findAll({ doctor: new ObjectId(doctorId) }, options);
		} catch (error) {
			console.error("Error in findByDoctor:", error);
			throw error;
		}
	}

	async findByDateRange(startDate, endDate, options = {}) {
		try {
			return await this.findAll(
				{
					date: {
						$gte: new Date(startDate),
						$lte: new Date(endDate),
					},
				},
				options
			);
		} catch (error) {
			console.error("Error in findByDateRange:", error);
			throw error;
		}
	}

	async findByType(interventionTypeId, options = {}) {
		try {
			return await this.findAll(
				{ interventionType: new ObjectId(interventionTypeId) },
				options
			);
		} catch (error) {
			console.error("Error in findByType:", error);
			throw error;
		}
	}

	async findByState(state, options = {}) {
		try {
			return await this.findAll({ state }, options);
		} catch (error) {
			console.error("Error in findByState:", error);
			throw error;
		}
	}

	async updateState(interventionId, state) {
		try {
			return await this.update(interventionId, { state });
		} catch (error) {
			console.error("Error in updateState:", error);
			throw error;
		}
	}

	async findUpcoming(options = {}) {
		try {
			return await this.findAll(
				{
					date: { $gte: new Date() },
					state: "scheduled",
				},
				options
			);
		} catch (error) {
			console.error("Error in findUpcoming:", error);
			throw error;
		}
	}

	async findByToothNumber(toothNumber, options = {}) {
		try {
			return await this.findAll({ teethAffected: toothNumber }, options);
		} catch (error) {
			console.error("Error in findByToothNumber:", error);
			throw error;
		}
	}

	async getStatsByType() {
		try {
			const pipeline = [
				{
					$group: {
						_id: "$interventionType",
						count: { $sum: 1 },
						totalCost: { $sum: "$cost" },
						avgCost: { $avg: "$cost" },
					},
				},
				{
					$lookup: {
						from: "interventionTypes",
						localField: "_id",
						foreignField: "_id",
						as: "typeInfo",
					},
				},
				{
					$unwind: "$typeInfo",
				},
				{
					$project: {
						type: "$typeInfo.name",
						count: 1,
						totalCost: 1,
						avgCost: 1,
					},
				},
			];

			return await this.aggregate(pipeline);
		} catch (error) {
			console.error("Error in getStatsByType:", error);
			throw error;
		}
	}
}

export default new InterventionRepository();
