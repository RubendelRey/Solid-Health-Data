import { parse } from "csv-parse";
import fs from "fs";
import path from "path";

export class ADAService {
	static loaded = false;

	static codes = new Map();

	static async getAdaCode(name) {
		if (!this.loaded) {
			await this.loadCodes();
		}

		while (this.codes.size === 0) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		let codeAda = this.codes.get(name);
		return codeAda;
	}

	static async getName(codeAda) {
		if (!this.loaded) {
			await this.loadCodes();
		}

		while (this.codes.size === 0) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		for (const [name, code] of this.codes.entries()) {
			if (code === codeAda) {
				return name;
			}
		}
		return null;
	}

	static async loadCodes() {
		await this.parse(["name", "codeAda"], "adaCodes.csv", (element) => {
			this.codes.set(element.name, element.codeAda);
		});
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
				delimiter: ",",
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
