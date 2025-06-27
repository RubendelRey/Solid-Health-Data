import { parse } from "csv-parse";
import fs from "fs";
import path from "path";

export class SnomedService {
	static loaded = false;

	static codes = new Map();

	static async getSnomedCode(allergyCode) {
		if (!this.loaded) {
			await this.loadCodes();
		}

		while (this.codes.size === 0) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		let snomedCode = this.codes.get(allergyCode);
		return snomedCode;
	}

	static async getCode(snomedCode) {
		if (!this.loaded) {
			await this.loadCodes();
		}
		while (this.codes.size === 0) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		for (const [allergyCode, code] of this.codes.entries()) {
			if (code === snomedCode) {
				return allergyCode;
			}
		}
		return null;
	}

	static async loadCodes() {
		await this.parse(
			["allergyCode", "snomedCode"],
			"allergySnomedCodes.csv",
			(element) => {
				this.codes.set(element.allergyCode, element.snomedCode);
			}
		);
		this.loaded = true;
	}

	static async parse(headers, file, func) {
		let csvFilePath = path.resolve(
			path.resolve(path.dirname("")),
			"src/resources",
			file
		);
		const fileContent = fs.readFileSync(csvFilePath, { encoding: "utf-8" });
		parse(
			fileContent,
			{
				delimiter: ";",
				columns: headers,
			},
			(error, result) => {
				if (error) {
					console.error(error);
				} else {
					result.forEach((element) => {
						func(element);
					});
				}
			}
		);
	}
}
