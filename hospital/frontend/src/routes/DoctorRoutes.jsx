import { Route, Routes } from "react-router-dom";
import DoctorPatientsManagement from "../pages/doctor/DoctorPatientsManagement";
import DoctorProceduresView from "../pages/doctor/DoctorProceduresView";
import DoctorSchedule from "../pages/doctor/DoctorSchedule";

const DoctorRoutes = () => {
	return (
		<Routes>
			<Route path="/patients" element={<DoctorPatientsManagement />} />
			<Route path="/schedule" element={<DoctorSchedule />} />
			<Route path="/procedures" element={<DoctorProceduresView />} />
		</Routes>
	);
};

export default DoctorRoutes;
