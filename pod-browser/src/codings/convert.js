export async function convertCoding(targetCoding, equivalentCoding) {
	let newCode = await convertCode(
		targetCoding.code,
		targetCoding.system,
		equivalentCoding
	);

	if (!newCode) {
		throw new Error(
			`No equivalent code found for ${targetCoding.code} in ${targetCoding.system} to ${equivalentCoding}`
		);
	}

	return {
		system: equivalentCoding,
		display: targetCoding.display,
		code: newCode,
	};
}

async function convertCode(code, sourceSystem, targetSystem) {
	if (sourceSystem === targetSystem) {
		return code;
	}

	if (
		sourceSystem === "http://snomed.info/sct" &&
		targetSystem === "https://www.ada.org/snodent"
	) {
		return adaSnomedEquivalent[code];
	}

	if (
		sourceSystem === "https://www.ada.org/snodent" &&
		targetSystem === "http://snomed.info/sct"
	) {
		const adaToSnomed = Object.entries(adaSnomedEquivalent).reduce(
			(acc, [snomedCode, adaCode]) => {
				acc[adaCode] = snomedCode;
				return acc;
			},
			{}
		);
		return adaToSnomed[code];
	}

	throw new Error(
		`Unsupported conversion from ${sourceSystem} to ${targetSystem}`
	);
}

const adaSnomedEquivalent = {
	34043003: "D0120",
	1258927004: "D1110",
	287451003: "D2330",
	234712004: "D3310",
	55162003: "D7140",
	42937000: "D2740",
	86288009: "D6010",
	1285005000: "D6240",
	12491002: "D9972",
	46209003: "D8080",
	239700001: "D8670",
	65546002: "D7240",
	68071007: "D1206",
	1269321004: "D5110",
};
