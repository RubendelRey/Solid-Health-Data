import { Route, Routes } from "react-router-dom";
import DataExport from "../pages/patient/DataExport";
import DataImport from "../pages/patient/DataImport";
import MyAppointments from "../pages/patient/MyAppointments";
import PatientDashboard from "../pages/patient/PatientDashboard";
import PatientMedicalRecords from "../pages/patient/PatientMedicalRecords";

const PatientRoutes = () => {
	return (
		<Routes>
			<Route path="/" element={<PatientDashboard />} />
			<Route path="/medical-records" element={<PatientMedicalRecords />} />
			<Route path="/appointments" element={<MyAppointments />} />
			<Route path="/data-export" element={<DataExport />} />
			<Route path="/data-import" element={<DataImport />} />
		</Routes>
	);
};

export default PatientRoutes;
