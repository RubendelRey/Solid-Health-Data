import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes,
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";

import AdminRoutes from "./routes/AdminRoutes";
import DoctorRoutes from "./routes/DoctorRoutes";
import PatientRoutes from "./routes/PatientRoutes";

import "./App.css";

const theme = createTheme({
	palette: {
		primary: {
			main: "#1976d2",
		},
		secondary: {
			main: "#dc004e",
		},
		background: {
			default: "#f5f5f5",
		},
	},
	typography: {
		fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
		h4: {
			fontWeight: 600,
		},
		h5: {
			fontWeight: 600,
		},
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					textTransform: "none",
				},
			},
		},
	},
});

function App() {
	return (
		<ThemeProvider theme={theme}>
			<AuthProvider>
				<CssBaseline />
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					<NotificationProvider>
						<Router>
							<Routes>
								<Route path="/login" element={<Login />} />
								<Route
									path="/*"
									element={
										<ProtectedRoute>
											<Layout>
												<Routes>
													<Route
														path="/"
														element={<Navigate to="/dashboard" replace />}
													/>
													<Route path="/dashboard" element={<Dashboard />} />
													<Route
														path="/patient/*"
														element={
															<ProtectedRoute allowedRoles={["patient"]}>
																<PatientRoutes />
															</ProtectedRoute>
														}
													/>
													<Route
														path="/doctor/*"
														element={
															<ProtectedRoute allowedRoles={["doctor"]}>
																<DoctorRoutes />
															</ProtectedRoute>
														}
													/>
													<Route
														path="/admin/*"
														element={
															<ProtectedRoute allowedRoles={["administrator"]}>
																<AdminRoutes />
															</ProtectedRoute>
														}
													/>
												</Routes>
											</Layout>
										</ProtectedRoute>
									}
								/>
							</Routes>
						</Router>
					</NotificationProvider>
				</LocalizationProvider>
			</AuthProvider>
		</ThemeProvider>
	);
}

export default App;
