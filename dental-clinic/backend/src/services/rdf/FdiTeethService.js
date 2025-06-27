export class FDITeethService {
	static getFDITeethName(code) {
		let zone = Number(code.toString().substring(0, 1));

		if (zone <= 4) {
			return this.getTeeth(code, this.getPermanentNames(), "permanent");
		}
		return this.getTeeth(code, this.getTemporaryNames(), "temporary");
	}

	static getTeeth(code, teethNames, teethType) {
		let zone = Number(code.toString().substring(0, 1));
		let position = Number(code.toString().substring(1, 2));

		let teethName = teethNames[position - 1];
		let aux = zone % 4;
		aux = aux === 0 ? 4 : aux;
		let location = this.locations[aux - 1];

		return `${teethName} ${location} ${teethType}`;
	}
	static getPermanentNames() {
		return [
			"Central incisor",
			"Lateral incisor",
			"Canine",
			"First premolar",
			"Second premolar",
			"First molar",
			"Second molar",
			"Third molar",
		];
	}
	static getTemporaryNames() {
		return [
			"Central incisor",
			"Lateral incisor",
			"Canine",
			"First molar",
			"Second molar",
		];
	}
	static locations = ["upper right", "upper left", "lower left", "lower right"];
}
