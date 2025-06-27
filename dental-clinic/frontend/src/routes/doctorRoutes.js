import { lazy } from "react";
import { Navigate } from "react-router-dom";

const DoctorDashboard = lazy(() => import("../pages/doctors/DoctorDashboard"));
const DoctorProfile = lazy(() => import("../pages/doctors/DoctorProfile"));
const DoctorAppointments = lazy(() =>
	import("../pages/appointments/DoctorAppointments")
);
const DoctorPatients = lazy(() =>
	import("../pages/appointments/DoctorPatients")
);
const DoctorSchedule = lazy(() => import("../pages/doctors/DoctorSchedule"));

const doctorRoutes = [
	{
		path: "dashboard",
		element: <DoctorDashboard />,
	},
	{
		path: "profile",
		element: <DoctorProfile />,
	},
	{
		path: "appointments",
		element: <DoctorAppointments />,
	},
	{
		path: "patients",
		element: <DoctorPatients />,
	},
	{
		path: "schedule",
		element: <DoctorSchedule />,
	},

	{
		path: "",
		element: <Navigate to="dashboard" />,
	},
];

export default doctorRoutes;
