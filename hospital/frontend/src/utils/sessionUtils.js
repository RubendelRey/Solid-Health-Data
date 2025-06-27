export const getSessionFromStorage = () => {
	return localStorage.getItem("solidSessionId");
};

export const setSessionInStorage = (sessionId) => {
	localStorage.setItem("solidSessionId", sessionId);
};

export const removeSessionFromStorage = () => {
	localStorage.removeItem("solidSessionId");
};
