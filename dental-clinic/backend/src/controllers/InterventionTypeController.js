import InterventionTypeService from "../services/InterventionTypeService.js";

class InterventionTypeController {
	async getInterventionTypes(req, res) {
		const page = req.query.page ? parseInt(req.query.page, 10) : null;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
		const sort = req.query.sort || "name";
		const category = req.query.category || "";

		const query = {};
		if (category) {
			query.category = category;
		}

		const options = { sort: { [sort]: 1 } };

		if (page !== null && limit !== null) {
			options.page = page;
			options.limit = limit;
		}

		try {
			const result = await InterventionTypeService.getAllInterventionTypes(
				query,
				options
			);

			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getInterventionType(req, res) {
		try {
			const interventionType =
				await InterventionTypeService.getInterventionTypeById(req.params.id);
			res.status(200).json(interventionType);
		} catch (error) {
			res.status(404).json({ error: error.message });
		}
	}

	async getInterventionTypesByCategory(req, res) {
		try {
			const result =
				await InterventionTypeService.getInterventionTypesByCategory(
					req.params.category,
					{
						sort: { name: 1 },
					}
				);

			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async createInterventionType(req, res) {
		try {
			const interventionType =
				await InterventionTypeService.createInterventionType(req.body);
			res.status(201).json(interventionType);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async updateInterventionType(req, res) {
		try {
			const interventionType =
				await InterventionTypeService.updateInterventionType(
					req.params.id,
					req.body
				);
			res.status(200).json(interventionType);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async deleteInterventionType(req, res) {
		try {
			await InterventionTypeService.deleteInterventionType(req.params.id);
			res.status(200).json({});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}
}

export default new InterventionTypeController();
