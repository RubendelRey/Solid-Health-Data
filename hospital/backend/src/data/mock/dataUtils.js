export const getRandomFutureDate = (daysAhead = 60) => {
	const now = new Date();
	const futureDate = new Date(now);
	futureDate.setDate(now.getDate() + Math.floor(Math.random() * daysAhead) + 1);
	futureDate.setMilliseconds(0);
	return futureDate;
};

export const getRandomPastDate = (daysBack = 180) => {
	const now = new Date();
	const pastDate = new Date(now);
	pastDate.setDate(now.getDate() - Math.floor(Math.random() * daysBack) - 1);
	pastDate.setMilliseconds(0);
	return pastDate;
};

export const getRandomItems = (arr, count) => {
	const shuffled = [...arr].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count);
};

export const getRandomElement = (arr) => {
	return arr[Math.floor(Math.random() * arr.length)];
};

export const getRandomStatus = () => {
	const statuses = ["completed", "scheduled", "in-progress", "cancelled"];
	const weights = [0.6, 0.25, 0.1, 0.05];

	const random = Math.random();
	let cumulative = 0;

	for (let i = 0; i < statuses.length; i++) {
		cumulative += weights[i];
		if (random <= cumulative) {
			return statuses[i];
		}
	}

	return statuses[0];
};

export const getRandomCriticality = () => {
	const criticalities = ["low", "medium", "high"];
	const weights = [0.6, 0.3, 0.1];

	const random = Math.random();
	let cumulative = 0;

	for (let i = 0; i < criticalities.length; i++) {
		cumulative += weights[i];
		if (random <= cumulative) {
			return criticalities[i];
		}
	}

	return criticalities[0];
};

export const getRandomAllergyStatus = () => {
	const statuses = ["active", "inactive", "resolved"];
	const weights = [0.7, 0.2, 0.1];

	const random = Math.random();
	let cumulative = 0;

	for (let i = 0; i < statuses.length; i++) {
		cumulative += weights[i];
		if (random <= cumulative) {
			return statuses[i];
		}
	}

	return statuses[0];
};

export const getRandomVerificationStatus = () => {
	const statuses = ["confirmed", "unconfirmed", "refuted"];
	const weights = [0.8, 0.15, 0.05];

	const random = Math.random();
	let cumulative = 0;

	for (let i = 0; i < statuses.length; i++) {
		cumulative += weights[i];
		if (random <= cumulative) {
			return statuses[i];
		}
	}

	return statuses[0];
};
