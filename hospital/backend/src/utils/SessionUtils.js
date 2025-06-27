export default class SessionUtils {
	static getSolidSessionId(req) {
		const sessions = req.sessionStore.sessions;
		for (const s in sessions) {
			const sessionData = JSON.parse(sessions[s]);
			if (sessionData.solidSessionId !== undefined) {
				return sessionData.solidSessionId;
			}
		}
		return null;
	}
}
