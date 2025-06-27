import { Box, CircularProgress, Typography } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
	const { isAuthenticated, user, loading } = useAuth();
	const location = useLocation();

	if (loading) {
		return (
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					height: "100vh",
					gap: 2,
				}}
			>
				<CircularProgress size={60} />
				<Typography variant="h6" color="textSecondary">
					Loading...
				</Typography>
			</Box>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
		return (
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					height: "100vh",
					gap: 2,
					p: 3,
				}}
			>
				<Typography variant="h4" color="error" gutterBottom>
					Access Denied
				</Typography>
				<Typography variant="body1" color="textSecondary" textAlign="center">
					You don't have permission to access this page.
				</Typography>
				<Typography variant="body2" color="textSecondary">
					Required roles: {allowedRoles.join(", ")}
				</Typography>
				<Typography variant="body2" color="textSecondary">
					Your role: {user?.role}
				</Typography>
			</Box>
		);
	}

	return children;
};

export default ProtectedRoute;
