import { v4 as uuidv4 } from "uuid";
import { generateLoadTestData } from "../data/mock/mockDataGenerator.js";
import LoadTestResultRepository from "../repositories/LoadTestResultRepository.js";
import SolidService from "../services/SolidService.js";
import SessionUtils from "../utils/SessionUtils.js";

class BulkExportController {
	async exportAllToSolid(req, res) {
		const startTime = Date.now();

		try {
			if (req.user.role !== "admin") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can run load tests",
				});
			}

			let sessionId = SessionUtils.getSolidSessionId(req);
			if (!sessionId) {
				return res.status(400).json({
					success: false,
					error: "Administrator is not logged into Solid pod",
				});
			}

			const { testsConfiguration, pathConfiguration } = req.body;

			if (
				!testsConfiguration ||
				!Array.isArray(testsConfiguration) ||
				testsConfiguration.length === 0
			) {
				return res.status(400).json({
					success: false,
					error:
						"testsConfiguration array is required and must contain at least one test configuration",
				});
			}

			const paths = {
				baseFolder: pathConfiguration?.baseFolder || "load-tests",
				subfolder: pathConfiguration?.subfolder || "dental-clinic",
				filePrefix: pathConfiguration?.filePrefix || "test",
				...pathConfiguration,
			};

			for (let i = 0; i < testsConfiguration.length; i++) {
				const triplesCount = testsConfiguration[i];
				if (!Number.isInteger(triplesCount) || triplesCount < 10) {
					return res.status(400).json({
						success: false,
						error: `Test ${
							i + 1
						}: triples count must be an integer of at least 10. Received: ${triplesCount}`,
					});
				}
			}

			const numberOfTests = testsConfiguration.length;
			const totalTriples = testsConfiguration.reduce(
				(sum, count) => sum + count,
				0
			);

			const testSession = uuidv4();
			const sessionStartTime = new Date();

			const results = [];
			let completed = 0;
			let failed = 0;

			for (let testIndex = 0; testIndex < numberOfTests; testIndex++) {
				try {
					const testStartTime = Date.now();
					const triplesForThisTest = testsConfiguration[testIndex];
					const testNumber = testIndex + 1;

					const testData = generateLoadTestData(triplesForThisTest);

					const exportResult = await SolidService.exportLoadTestData(
						sessionId,
						testData,
						testNumber,
						numberOfTests,
						paths
					);

					const duration = Date.now() - testStartTime;
					const resultData = {
						testNumber: testNumber,
						triplesCount: triplesForThisTest,
						status: "success",
						duration,
						uploadMetrics: {
							dataFile: exportResult.files.data,
							totalUploadTime: exportResult.totalUploadTime,
						},
						pathUsed: exportResult.pathUsed,
						message: `Successfully exported ${triplesForThisTest} triples to Solid pod`,
					};

					results.push(resultData);

					try {
						const solidServer = await SolidService.getSolidServerFromSession(
							sessionId
						);

						await LoadTestResultRepository.create({
							testDate: sessionStartTime,
							duration,
							solidServer: solidServer,
							triplesCount: triplesForThisTest,
						});
					} catch (dbError) {
						console.error(`⚠️ Error saving test result to database:`, dbError);
					}

					completed++;

					if (testIndex < numberOfTests - 1) {
						await new Promise((resolve) => setTimeout(resolve, 100));
					}
				} catch (error) {
					console.error(`Error in load test ${testNumber}:`, error);
					const resultData = {
						testNumber: testNumber,
						triplesCount: triplesForThisTest,
						status: "failed",
						duration: 0,
						message: error.message,
					};

					results.push(resultData);

					try {
						await LoadTestResultRepository.create({
							testDate: sessionStartTime,
							duration: 0,
							solidServer:
								process.env.SOLID_PROVIDER_URL || "https://solidcommunity.net",
							triplesCount: triplesForThisTest,
						});
					} catch (dbError) {
						console.error(
							`⚠️ Error saving failed test result to database:`,
							dbError
						);
					}

					failed++;

					if (testIndex < numberOfTests - 1) {
						console.log(`⏳ Waiting 5 seconds before next test...`);
						await new Promise((resolve) => setTimeout(resolve, 100));
					}
				}
			}

			const totalDuration = Date.now() - startTime;
			const avgDuration = completed > 0 ? totalDuration / completed : 0;
			const triplesPerSecond =
				totalDuration > 0
					? (totalTriples / (totalDuration / 1000)).toFixed(2)
					: 0;

			res.status(200).json({
				success: true,
				message: `Load testing completed: ${completed} successful, ${failed} failed`,
				testSession,
				stats: {
					totalTests: numberOfTests,
					testsConfiguration,
					completed,
					failed,
					totalTriples,
					totalDuration,
					avgDuration: Math.round(avgDuration),
					triplesPerSecond: parseFloat(triplesPerSecond),
				},
				results,
			});
		} catch (error) {
			const totalDuration = Date.now() - startTime;

			console.error("Error in load testing:", error);
			res.status(500).json({
				success: false,
				message: "Error during load testing",
				error: error.message,
			});
		}
	}
}

export default new BulkExportController();
