import {
	Assessment,
	Event,
	Healing,
	LocalHospital,
	MedicalServices,
	People,
	TrendingUp,
} from "@mui/icons-material";
import {
	Avatar,
	Box,
	Card,
	CardContent,
	Chip,
	Grid,
	LinearProgress,
	Paper,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { statsService } from "../api/services";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";

const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
	<Card sx={{ height: "100%" }}>
		<CardContent>
			<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
				<Avatar sx={{ bgcolor: color, mr: 2 }}>{icon}</Avatar>
				<Box>
					<Typography variant="h4" component="div" fontWeight="bold">
						{value}
					</Typography>
					<Typography variant="body2" color="textSecondary">
						{title}
					</Typography>
				</Box>
			</Box>
			{subtitle && (
				<Typography variant="body2" color="textSecondary">
					{subtitle}
				</Typography>
			)}
			{trend && (
				<Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
					<TrendingUp
						sx={{
							color: trend > 0 ? "success.main" : "error.main",
							mr: 0.5,
							fontSize: 16,
						}}
					/>
					<Typography
						variant="body2"
						color={trend > 0 ? "success.main" : "error.main"}
					>
						{trend > 0 ? "+" : ""}
						{trend}% from last month
					</Typography>
				</Box>
			)}
		</CardContent>
	</Card>
);

const Dashboard = () => {
	const { user } = useAuth();
	const { showError } = useNotification();
	const [dashboardData, setDashboardData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchDashboardData();
	}, []);

	const fetchDashboardData = async () => {
		try {
			setLoading(true);
			const response = await statsService.getDashboard();
			setDashboardData(response.data);
		} catch (error) {
			showError("Failed to load dashboard data");
			console.error("Dashboard error:", error);
		} finally {
			setLoading(false);
		}
	};

	const getWelcomeMessage = () => {
		const hour = new Date().getHours();
		let greeting = "Good morning";
		if (hour >= 12 && hour < 17) greeting = "Good afternoon";
		else if (hour >= 17) greeting = "Good evening";

		return `${greeting}, ${user?.profile.firstName} ${user?.profile.lastName}!`;
	};

	const getRoleSpecificStats = () => {
		if (!dashboardData) return [];
		switch (user?.role) {
			case "administrator":
				return [
					{
						title: "Total Patients",
						value: dashboardData.data.totalPatients || 0,
						icon: <People />,
						color: "primary.main",
						trend: dashboardData.data.patientsTrend,
						subtitle: `${
							dashboardData.data.newPatientsThisMonth || 0
						} new this month`,
					},
					{
						title: "Total Doctors",
						value: dashboardData.data.totalDoctors || 0,
						icon: <LocalHospital />,
						color: "success.main",
						trend: dashboardData.data.doctorsTrend,
						subtitle: `${dashboardData.data.activeDoctors || 0} active`,
					},
					{
						title: "Appointments Today",
						value: dashboardData.data.appointmentsToday || 0,
						icon: <Event />,
						color: "warning.main",
						subtitle: `${dashboardData.data.pendingAppointments || 0} pending`,
					},
					{
						title: "Total Procedures",
						value: dashboardData.data.totalProcedures || 0,
						icon: <MedicalServices />,
						color: "info.main",
						trend: dashboardData.data.proceduresTrend,
						subtitle: `${
							dashboardData.data.proceduresThisMonth || 0
						} this month`,
					},
				];

			case "doctor":
				return [
					{
						title: "My Patients",
						value: dashboardData.data.myPatients || 0,
						icon: <People />,
						color: "primary.main",
						subtitle: `${
							dashboardData.data.newPatentsThisWeek || 0
						} new this week`,
					},
					{
						title: "Today's Appointments",
						value: dashboardData.data.todaysProcedures || 0,
						icon: <Event />,
						color: "warning.main",
						subtitle: `${dashboardData.data.completedToday || 0} completed`,
					},
					{
						title: "Procedures This Month",
						value: dashboardData.data.proceduresThisMonth || 0,
						icon: <MedicalServices />,
						color: "info.main",
						trend: dashboardData.data.proceduresTrend,
					},
					{
						title: "Patient Satisfaction",
						value: `${dashboardData.data.satisfactionRate || 0}%`,
						icon: <Assessment />,
						color: "success.main",
						subtitle: "Average rating",
					},
				];

			case "patient":
				return [
					{
						title: "Next Appointment",
						value: dashboardData.data.nextAppointmentDate || "None",
						icon: <Event />,
						color: "primary.main",
					},
					{
						title: "My Procedures",
						value: dashboardData.data.myProcedures || 0,
						icon: <MedicalServices />,
						color: "info.main",
						subtitle: `${dashboardData.data.recentProcedures || 0} recent`,
					},
					{
						title: "My Allergies",
						value: dashboardData.data.myAllergies || 0,
						icon: <Healing />,
						color: "warning.main",
						subtitle: "Documented",
					},
					{
						title: "Health Score",
						value: `${dashboardData.data.healthScore || 0}%`,
						icon: <Assessment />,
						color: "success.main",
						subtitle: "Based on recent data",
					},
				];

			default:
				return [];
		}
	};

	if (loading) {
		return (
			<Box sx={{ width: "100%", mt: 2 }}>
				<LinearProgress />
				<Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
					Loading dashboard...
				</Typography>
			</Box>
		);
	}

	const roleStats = getRoleSpecificStats();

	return (
		<Box>
			<Paper
				sx={{
					p: 3,
					mb: 3,
					background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
					color: "white",
				}}
			>
				<Typography variant="h4" gutterBottom>
					{getWelcomeMessage()}
				</Typography>
				<Typography variant="h6" sx={{ opacity: 0.9 }}>
					{user?.role.charAt(0).toUpperCase() + user?.role.slice(1)} Dashboard
				</Typography>
				<Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
					<Chip
						label={user?.role}
						sx={{
							bgcolor: "rgba(255,255,255,0.2)",
							color: "white",
							fontWeight: "bold",
						}}
					/>
					<Typography variant="body2" sx={{ opacity: 0.8 }}>
						{user?.email}
					</Typography>
				</Box>
			</Paper>

			<Grid container spacing={3} sx={{ mb: 3 }}>
				{roleStats.map((stat, index) => (
					<Grid item xs={12} sm={6} md={3} key={index}>
						<StatCard {...stat} />
					</Grid>
				))}
			</Grid>
		</Box>
	);
};

export default Dashboard;
