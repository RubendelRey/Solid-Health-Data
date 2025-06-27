import fs from "fs";
import path from "path";

class ExportLoggerService {
	constructor() {
		this.logFilePath = path.join(process.cwd(), "export_logs.csv");
		this.initializeCSV();
	}

	initializeCSV() {
		if (!fs.existsSync(this.logFilePath)) {
			const header =
				"procedures_exported,allergies_exported,total_records,export_duration_ms\n";
			fs.writeFileSync(this.logFilePath, header, "utf8");
		}
	}

	logExport(logData) {
		const { proceduresCount, allergiesCount, duration } = logData;

		console.log(logData);
		const totalRecords = proceduresCount + allergiesCount;

		const csvLine = `${proceduresCount},${allergiesCount},${totalRecords},${duration}\n`;

		try {
			fs.appendFileSync(this.logFilePath, csvLine, "utf8");
			console.log(
				`Export logged: ${totalRecords} records exported in ${duration}ms`
			);
		} catch (error) {
			console.error("Error writing to export log:", error);
		}
	}
}

export default new ExportLoggerService();
