import { createContext, useContext, useEffect, useState } from "react";
import solidService from "../api/solidService";

const SolidContext = createContext();

export const useSolid = () => {
	const context = useContext(SolidContext);
	if (!context) {
		throw new Error("useSolid must be used within a SolidProvider");
	}
	return context;
};

const SolidProvider = ({ children }) => {
	const [solidSession, setSolidSession] = useState(null);
	const [isConnected, setIsConnected] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		checkSolidConnection();
	}, []);
	const checkSolidConnection = async () => {
		try {
			const session = await solidService.getSession();
			setSolidSession(session);
			setIsConnected(session.isLoggedIn);
		} catch (error) {
			console.error("Error checking Solid connection:", error);
		}
	};
	const connectToSolid = async (provider) => {
		setLoading(true);
		try {
			solidService.login(provider);
		} catch (error) {
			console.error("Solid connection error:", error);
			throw error;
		} finally {
			setLoading(false);
		}
	};
	const exportData = async (exportConfig) => {
		setLoading(true);
		try {
			const result = await solidService.exportUserData(exportConfig);
			return result;
		} catch (error) {
			console.error("Data export error:", error);
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const disconnect = () => {
		setSolidSession(null);
		setIsConnected(false);
	};

	const value = {
		solidSession,
		isConnected,
		loading,
		connectToSolid,
		exportData,
		disconnect,
		checkSolidConnection,
	};

	return (
		<SolidContext.Provider value={value}>{children}</SolidContext.Provider>
	);
};

export { SolidProvider };
export default SolidContext;
