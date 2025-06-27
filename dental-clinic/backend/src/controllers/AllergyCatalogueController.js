import AllergyCatalogueService from "../services/AllergyCatalogueService.js";

class AllergyCatalogueController {
	async getAllergies(req, res) {
		const page = req.query.page ? parseInt(req.query.page, 10) : null;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
		const sort = req.query.sort || "name";
		const type = req.query.type || "";
		const search = req.query.search || "";

		const query = {};
		if (type) {
			query.type = type;
		}
		if (search) {
			query.$or = [
				{ code: { $regex: search, $options: "i" } },
				{ name: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
			];
		}

		const options = { sort: { [sort]: 1 } };

		if (page !== null && limit !== null) {
			options.page = page;
			options.limit = limit;
		}

		const result = await AllergyCatalogueService.getAllAllergies(
			query,
			options
		);

		if (!result.success) {
			return res.status(400).json(result);
		}

		res.status(200).json(result);
	}

	async getAllergy(req, res) {
		const result = await AllergyCatalogueService.getAllergyById(req.params.id);

		if (!result.success) {
			return res.status(404).json(result);
		}

		res.status(200).json(result);
	}

	async getAllergyByCode(req, res) {
		const result = await AllergyCatalogueService.getAllergyByCode(
			req.params.code
		);

		if (!result.success) {
			return res.status(404).json(result);
		}

		res.status(200).json(result);
	}

	async getAllergiesByType(req, res) {
		const result = await AllergyCatalogueService.getAllergiesByType(
			req.params.type,
			{
				sort: { name: 1 },
			}
		);

		if (!result.success) {
			return res.status(400).json(result);
		}

		res.status(200).json(result);
	}

	async createAllergy(req, res) {
		const result = await AllergyCatalogueService.createAllergy(req.body);

		if (!result.success) {
			return res.status(400).json(result);
		}

		res.status(201).json(result);
	}

	async updateAllergy(req, res) {
		const result = await AllergyCatalogueService.updateAllergy(
			req.params.id,
			req.body
		);

		if (!result.success) {
			return res.status(400).json(result);
		}

		res.status(200).json(result);
	}

	async deleteAllergy(req, res) {
		const result = await AllergyCatalogueService.deleteAllergy(req.params.id);

		if (!result.success) {
			return res.status(400).json(result);
		}

		res.status(200).json(result);
	}
}

export default new AllergyCatalogueController();
