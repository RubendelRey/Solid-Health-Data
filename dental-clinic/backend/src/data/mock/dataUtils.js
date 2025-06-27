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

export const getRandomTeeth = (count) => {
	const validTeeth = [
		...Array.from({ length: 8 }, (_, i) => 11 + i),
		...Array.from({ length: 8 }, (_, i) => 21 + i),
		...Array.from({ length: 8 }, (_, i) => 31 + i),
		...Array.from({ length: 8 }, (_, i) => 41 + i),
		...Array.from({ length: 5 }, (_, i) => 51 + i),
		...Array.from({ length: 5 }, (_, i) => 61 + i),
		...Array.from({ length: 5 }, (_, i) => 71 + i),
		...Array.from({ length: 5 }, (_, i) => 81 + i),
	];

	return getRandomItems(validTeeth, count);
};
