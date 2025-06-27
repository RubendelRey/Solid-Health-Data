import { App as AntApp, ConfigProvider } from "antd";
import { CookiesProvider } from "react-cookie";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import DentalLayout from "./layouts/DentalLayout";
import AllergiesCatalog from "./pages/admin/AllergiesCatalog";
import AllergyPatientsReport from "./pages/admin/AllergyPatientsReport";
import BulkDataExport from "./pages/admin/BulkDataExport";
import InterventionTypes from "./pages/admin/InterventionTypes";
import LoadTestResults from "./pages/admin/LoadTestResults";
import UserManagement from "./pages/admin/UserManagement";
import DoctorAppointments from "./pages/appointments/DoctorAppointments";
import DoctorPatients from "./pages/appointments/DoctorPatients";
import NewAppointment from "./pages/appointments/NewAppointment";
import PatientAppointments from "./pages/appointments/PatientAppointments";
import Login from "./pages/auth/Login";
import SolidLoginSuccess from "./pages/auth/SolidLoginSuccess";
import DoctorProfile from "./pages/doctors/DoctorProfile";
import DoctorsList from "./pages/doctors/DoctorsList";
import Home from "./pages/home/Home";
import InterventionsList from "./pages/interventions/InterventionsList";
import DataExport from "./pages/patients/DataExport";
import DataImport from "./pages/patients/DataImport";
import MyAllergies from "./pages/patients/MyAllergies";
import MyInfo from "./pages/patients/MyInfo";
import PatientProfile from "./pages/patients/PatientProfile";
import PatientsList from "./pages/patients/PatientsList";

const theme = {
	token: {
		colorPrimary: "#1890ff",
		colorSuccess: "#52c41a",
		colorWarning: "#faad14",
		colorError: "#f5222d",
		colorInfo: "#1890ff",
		borderRadius: 6,
		wireframe: false,
	},
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
	const { isAuthenticated, loading, user } = useAuth();

	if (loading) {
		return <div>Loading...</div>;
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
		if (user?.role === "admin") {
			return <Navigate to="/admin/dashboard" replace />;
		} else if (user?.role === "doctor") {
			return <Navigate to="/doctor/patients" replace />;
		} else if (user?.role === "patient") {
			return <Navigate to="/my-appointments" replace />;
		} else {
			return <Navigate to="/" replace />;
		}
	}

	return children;
};

const LayoutWrapper = ({ children, allowedRoles = [] }) => {
	return (
		<ProtectedRoute allowedRoles={allowedRoles}>
			<DentalLayout>{children}</DentalLayout>
		</ProtectedRoute>
	);
};

function App() {
	return (
		<CookiesProvider>
			<ConfigProvider theme={theme}>
				<AntApp>
					<AuthProvider>
						<BrowserRouter>
							<Routes>
								<Route path="/login" element={<Login />} />
								<Route
									path="/solidLoginSuccessful"
									element={<SolidLoginSuccess />}
								/>
								<Route
									path="/"
									element={
										<LayoutWrapper
											allowedRoles={["patient", "doctor", "admin"]}
										>
											<Home />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/admin/patients"
									element={
										<LayoutWrapper allowedRoles={["admin"]}>
											<PatientsList />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/admin/interventions"
									element={
										<LayoutWrapper allowedRoles={["admin"]}>
											<InterventionsList />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/admin/intervention-types"
									element={
										<LayoutWrapper allowedRoles={["admin"]}>
											<InterventionTypes />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/admin/allergies"
									element={
										<LayoutWrapper allowedRoles={["admin"]}>
											<AllergiesCatalog />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/admin/users"
									element={
										<LayoutWrapper allowedRoles={["admin"]}>
											<UserManagement />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/admin/bulk-export"
									element={
										<LayoutWrapper allowedRoles={["admin"]}>
											<BulkDataExport />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/admin/load-test-results"
									element={
										<LayoutWrapper allowedRoles={["admin"]}>
											<LoadTestResults />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/admin/allergies/:allergyId/patients"
									element={
										<LayoutWrapper allowedRoles={["admin", "doctor"]}>
											<AllergyPatientsReport />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/doctor/patients"
									element={
										<LayoutWrapper allowedRoles={["doctor"]}>
											<DoctorPatients />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/doctor/appointments"
									element={
										<LayoutWrapper allowedRoles={["doctor"]}>
											<DoctorAppointments />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/doctor/interventions"
									element={
										<LayoutWrapper allowedRoles={["doctor"]}>
											<InterventionsList />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/patient/appointments"
									element={<Navigate to="/my-appointments" replace />}
								/>
								<Route
									path="/patient/interventions"
									element={<Navigate to="/my-interventions" replace />}
								/>
								<Route
									path="/my-appointments"
									element={
										<LayoutWrapper allowedRoles={["patient"]}>
											<PatientAppointments />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/appointments/new"
									element={
										<LayoutWrapper allowedRoles={["patient"]}>
											<NewAppointment />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/my-interventions"
									element={
										<LayoutWrapper allowedRoles={["patient"]}>
											<InterventionsList />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/my-allergies"
									element={
										<LayoutWrapper allowedRoles={["patient"]}>
											<MyAllergies />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/my-info"
									element={
										<LayoutWrapper allowedRoles={["patient"]}>
											<MyInfo />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/data-export"
									element={
										<LayoutWrapper allowedRoles={["patient"]}>
											<DataExport />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/data-import"
									element={
										<LayoutWrapper allowedRoles={["patient"]}>
											<DataImport />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/patients"
									element={
										<LayoutWrapper allowedRoles={["admin", "doctor"]}>
											<PatientsList />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/patients/:id"
									element={
										<LayoutWrapper
											allowedRoles={["admin", "doctor", "patient"]}
										>
											<PatientProfile />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/doctors"
									element={
										<LayoutWrapper
											allowedRoles={["admin", "doctor", "patient"]}
										>
											<DoctorsList />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/doctors/:id"
									element={
										<LayoutWrapper
											allowedRoles={["admin", "doctor", "patient"]}
										>
											<DoctorProfile />
										</LayoutWrapper>
									}
								/>
								<Route
									path="/interventions"
									element={
										<LayoutWrapper
											allowedRoles={["admin", "doctor", "patient"]}
										>
											<InterventionsList />
										</LayoutWrapper>
									}
								/>
								<Route path="*" element={<Navigate to="/" replace />} />{" "}
							</Routes>
						</BrowserRouter>
					</AuthProvider>
				</AntApp>
			</ConfigProvider>
		</CookiesProvider>
	);
}

export default App;
