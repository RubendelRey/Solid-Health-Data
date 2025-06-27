import { createContext, useContext, useEffect, useState } from "react";
import authService from "../api/authService";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const initAuth = () => {
			try {
				if (authService.isAuthenticated()) {
					setUser(authService.getCurrentUser());
				}
			} catch (error) {
				console.error("Error initializing auth:", error);
				authService.logout();
			} finally {
				setLoading(false);
			}
		};

		initAuth();
	}, []);

	const login = async (email, password) => {
		setLoading(true);
		try {
			const user = await authService.login(email, password);
			setUser(user);
			return user;
		} finally {
			setLoading(false);
		}
	};

	const register = async (userData) => {
		setLoading(true);
		try {
			return await authService.register(userData);
		} finally {
			setLoading(false);
		}
	};

	const logout = () => {
		authService.logout();
		setUser(null);
	};

	const value = {
		user,
		loading,
		login,
		logout,
		register,
		isAuthenticated: !!user,
		isAdmin: user?.role === "admin",
		isDoctor: user?.role === "doctor",
		isPatient: user?.role === "patient",
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
