import { createContext, useContext, useEffect, useReducer } from "react";
import { authService } from "../api/authService";

const AuthContext = createContext();

const authReducer = (state, action) => {
	switch (action.type) {
		case "LOGIN_START":
			return {
				...state,
				loading: true,
				error: null,
			};
		case "LOGIN_SUCCESS":
			return {
				...state,
				loading: false,
				isAuthenticated: true,
				user: action.payload.user,
				token: action.payload.token,
				error: null,
			};
		case "LOGIN_FAILURE":
			return {
				...state,
				loading: false,
				isAuthenticated: false,
				user: null,
				token: null,
				error: action.payload,
			};
		case "LOGOUT":
			return {
				...state,
				isAuthenticated: false,
				user: null,
				token: null,
				loading: false,
				error: null,
			};
		case "SET_USER":
			return {
				...state,
				user: action.payload,
			};
		case "CLEAR_ERROR":
			return {
				...state,
				error: null,
			};
		default:
			return state;
	}
};

const initialState = {
	isAuthenticated: false,
	user: null,
	token: null,
	loading: false,
	error: null,
};

export const AuthProvider = ({ children }) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	useEffect(() => {
		const token = localStorage.getItem("token");
		const user = localStorage.getItem("user");

		if (token && user) {
			try {
				const userData = JSON.parse(user);
				dispatch({
					type: "LOGIN_SUCCESS",
					payload: { user: userData, token },
				});
			} catch (error) {
				localStorage.removeItem("token");
				localStorage.removeItem("user");
			}
		}
	}, []);

	const login = async (credentials) => {
		dispatch({ type: "LOGIN_START" });

		try {
			const response = await authService.login(credentials);
			const { user, token } = response.data;

			localStorage.setItem("token", token);
			localStorage.setItem("user", JSON.stringify(user));

			dispatch({
				type: "LOGIN_SUCCESS",
				payload: { user, token },
			});

			return { success: true, user };
		} catch (error) {
			const errorMessage = error.response?.data?.message || "Login failed";
			dispatch({
				type: "LOGIN_FAILURE",
				payload: errorMessage,
			});
			return { success: false, error: errorMessage };
		}
	};

	const logout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		dispatch({ type: "LOGOUT" });
	};

	const clearError = () => {
		dispatch({ type: "CLEAR_ERROR" });
	};

	const updateUser = (userData) => {
		const updatedUser = { ...state.user, ...userData };
		localStorage.setItem("user", JSON.stringify(updatedUser));
		dispatch({ type: "SET_USER", payload: updatedUser });
	};

	const value = {
		...state,
		login,
		logout,
		clearError,
		updateUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export default AuthContext;
