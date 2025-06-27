import { Box, Typography } from "@mui/material";
import { Route, Routes } from "react-router-dom";
import AllergiesManagement from "../pages/admin/AllergiesManagement";
import AppointmentsManagement from "../pages/admin/AppointmentsManagement";
import BulkDataExport from "../pages/admin/BulkDataExport";
import DoctorsManagement from "../pages/admin/DoctorsManagement";
import LoadTestResults from "../pages/admin/LoadTestResults";
import PatientsManagement from "../pages/admin/PatientsManagement";
import ProceduresManagement from "../pages/admin/ProceduresManagement";
import UsersManagement from "../pages/admin/UsersManagement";

const SystemSettings = () => (
	<Box>
		<Typography variant="h4" gutterBottom>
			System Settings
		</Typography>
		<Typography variant="body1">
			This page will allow administrators to configure system-wide settings.
			Features will include database management, backup settings, security
			policies, and system maintenance.
		</Typography>
	</Box>
);

const AdminRoutes = () => {
	return (
		<Routes>
			<Route path="/users" element={<UsersManagement />} />
			<Route path="/patients" element={<PatientsManagement />} />
			<Route path="/doctors" element={<DoctorsManagement />} />
			<Route path="/appointments" element={<AppointmentsManagement />} />
			<Route path="/procedures" element={<ProceduresManagement />} />
			<Route path="/allergies" element={<AllergiesManagement />} />
			<Route path="/bulk-export" element={<BulkDataExport />} />
			<Route path="/load-test-results" element={<LoadTestResults />} />
			<Route path="/settings" element={<SystemSettings />} />
		</Routes>
	);
};

export default AdminRoutes;
