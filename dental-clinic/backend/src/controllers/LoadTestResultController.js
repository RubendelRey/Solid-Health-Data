import LoadTestResultRepository from "../repositories/LoadTestResultRepository.js";

class LoadTestResultController {
	async getAllResults(req, res) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 20;
			const filters = {
				dateFrom: req.query.dateFrom,
				dateTo: req.query.dateTo,
				solidServer: req.query.solidServer,
				triplesCountMin: req.query.triplesCountMin,
				triplesCountMax: req.query.triplesCountMax,
			};

			const result = await LoadTestResultRepository.findAll(
				page,
				limit,
				filters
			);

			res.status(200).json({
				success: true,
				data: {
					results: result.results,
					totalCount: result.pagination?.total || result.results?.length || 0,
				},
				pagination: result.pagination,
			});
		} catch (error) {
			console.error("Error getting load test results:", error);
			res.status(500).json({
				success: false,
				message: "Failed to get load test results",
				error: error.message,
			});
		}
	}

	async getAggregatedStats(req, res) {
		try {
			const filters = {
				dateFrom: req.query.dateFrom,
				dateTo: req.query.dateTo,
				solidServer: req.query.solidServer,
				triplesCountMin: req.query.triplesCountMin,
				triplesCountMax: req.query.triplesCountMax,
			};

			const stats = await LoadTestResultRepository.getBasicStats(filters);

			res.status(200).json({
				success: true,
				data: {
					totalTests: stats.totalTests,
					averageDuration: Math.round(stats.avgDuration || 0),
					averageTriples: Math.round(stats.avgTriples || 0),
					uniqueServers: stats.uniqueServers || 0,
					minDuration: stats.minDuration || 0,
					maxDuration: stats.maxDuration || 0,
				},
			});
		} catch (error) {
			console.error("Error getting aggregated stats:", error);
			res.status(500).json({
				success: false,
				message: "Failed to get aggregated stats",
				error: error.message,
			});
		}
	}

	async exportToCsv(req, res) {
		try {
			const filters = {
				dateFrom: req.query.dateFrom,
				dateTo: req.query.dateTo,
				solidServer: req.query.solidServer,
				triplesCountMin: req.query.triplesCountMin,
				triplesCountMax: req.query.triplesCountMax,
			};

			const result = await LoadTestResultRepository.findAll(1, 1000, filters);
			const results = result.results;

			const csvHeaders = [
				"Test Date",
				"Duration (ms)",
				"Solid Server",
				"Triples Count",
			];

			const csvRows = results.map((result) => [
				new Date(result.testDate).toISOString(),
				result.duration,
				result.solidServer,
				result.triplesCount,
			]);

			const csvContent = [
				csvHeaders.join(","),
				...csvRows.map((row) => row.join(",")),
			].join("\n");

			res.setHeader("Content-Type", "text/csv");
			res.setHeader(
				"Content-Disposition",
				"attachment; filename=load_test_results.csv"
			);
			res.status(200).send(csvContent);
		} catch (error) {
			console.error("Error exporting to CSV:", error);
			res.status(500).json({
				success: false,
				message: "Failed to export to CSV",
				error: error.message,
			});
		}
	}
}

export default new LoadTestResultController();
