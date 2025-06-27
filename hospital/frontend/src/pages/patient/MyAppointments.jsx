import {
	Event as AppointmentIcon,
	PersonOutline,
	Schedule as ScheduleIcon,
	Visibility as ViewIcon,
} from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as services from "../../api/services";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import DataUtils from "../../utils/dataUtils";

const MyAppointments = () => {
	const [appointments, setAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [tabValue, setTabValue] = useState(0);
	const [selectedAppointment, setSelectedAppointment] = useState(null);
	const [openDetailDialog, setOpenDetailDialog] = useState(false);

	const { user } = useAuth();
	const { showNotification } = useNotification();

	const fetchAppointments = useCallback(async () => {
		try {
			setLoading(true);
			const response = await services.getAppointments();
			setAppointments(response.appointments || []);
		} catch (error) {
			console.error("Error fetching appointments:", error);
			showNotification("Error fetching appointments", "error");
			setAppointments([]);
		} finally {
			setLoading(false);
		}
	}, [showNotification]);

	useEffect(() => {
		if (user?.patient?._id) {
			fetchAppointments();
		}
	}, [fetchAppointments, user]);

	const handleViewDetails = (appointment) => {
		setSelectedAppointment(appointment);
		setOpenDetailDialog(true);
	};

	const handleTabChange = (event, newValue) => {
		setTabValue(newValue);
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "completed":
				return "success";
			case "scheduled":
			case "preparation":
				return "primary";
			case "in-progress":
				return "warning";
			case "cancelled":
			case "not-done":
			case "stopped":
				return "error";
			case "on-hold":
				return "warning";
			default:
				return "default";
		}
	};

	const formatDateTime = (dateTime) => {
		if (!dateTime) return "Not specified";
		const date = new Date(dateTime);
		return {
			date: date.toLocaleDateString(),
			time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
		};
	};

	const getFilteredAppointments = () => {
		const now = new Date();

		switch (tabValue) {
			case 0:
				return appointments;
			case 1:
				return appointments.filter(
					(apt) => apt.status === "scheduled" || apt.status === "in-progress"
				);
			case 2:
				return appointments.filter(
					(apt) =>
						new Date(apt.performedDateTime) < now || apt.status === "completed"
				);
			case 3:
				return appointments.filter(
					(apt) =>
						apt.status === "cancelled" ||
						apt.status === "not-done" ||
						apt.status === "stopped"
				);
			default:
				return appointments;
		}
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	const filteredAppointments = getFilteredAppointments();

	return (
		<Box>
			<Typography variant="h4" gutterBottom>
				My Appointments
			</Typography>
			<Typography variant="body1" color="text.secondary" paragraph>
				View and manage your medical appointments and procedures
			</Typography>

			<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
				<Tabs value={tabValue} onChange={handleTabChange}>
					<Tab label={`All (${appointments.length})`} />
					<Tab
						label={`Upcoming (${
							appointments.filter(
								(apt) =>
									apt.status === "scheduled" || apt.status === "in-progress"
							).length
						})`}
					/>
					<Tab
						label={`Past (${
							appointments.filter(
								(apt) =>
									new Date(apt.performedDateTime) < new Date() ||
									apt.status === "completed"
							).length
						})`}
					/>
					<Tab
						label={`Cancelled (${
							appointments.filter(
								(apt) =>
									apt.status === "cancelled" ||
									apt.status === "not-done" ||
									apt.status === "stopped"
							).length
						})`}
					/>
				</Tabs>
			</Box>

			{filteredAppointments.length === 0 ? (
				<Alert severity="info" sx={{ mt: 2 }}>
					No appointments found for the selected filter.
				</Alert>
			) : (
				<Grid container spacing={2}>
					{filteredAppointments.map((appointment, index) => {
						const dateTime = formatDateTime(
							appointment.performedDateTime || appointment.scheduledDateTime
						);

						return (
							<Grid item xs={24} md={12} lg={12} key={appointment._id || index}>
								<Card sx={{ height: "100%" }}>
									<CardContent>
										<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
											<AppointmentIcon sx={{ mr: 1, color: "primary.main" }} />
											<Typography variant="h6" sx={{ flexGrow: 1 }}>
												{appointment.code?.coding?.[0]?.display ||
													appointment.code?.text ||
													"Medical Procedure"}
											</Typography>
											<Chip
												label={appointment.status || "unknown"}
												color={getStatusColor(appointment.status)}
												size="small"
											/>
										</Box>

										<List dense>
											<ListItem>
												<ListItemIcon>
													<ScheduleIcon />
												</ListItemIcon>
												<ListItemText
													primary="Date & Time"
													secondary={`${dateTime.date} at ${dateTime.time}`}
												/>
											</ListItem>

											{appointment.doctorData && (
												<ListItem>
													<ListItemIcon>
														<PersonOutline />
													</ListItemIcon>
													<ListItemText
														primary="Doctor"
														secondary={DataUtils.getDoctorName(
															appointment.doctorData
														)}
													/>
												</ListItem>
											)}

											{appointment.category && (
												<ListItem>
													<ListItemIcon>
														<AppointmentIcon />
													</ListItemIcon>
													<ListItemText
														primary="Category"
														secondary={
															appointment.category?.coding?.[0]?.display ||
															appointment.category?.text ||
															"General"
														}
													/>
												</ListItem>
											)}
										</List>

										<Box
											sx={{
												mt: 2,
												display: "flex",
												justifyContent: "flex-end",
											}}
										>
											<Button
												size="small"
												startIcon={<ViewIcon />}
												onClick={() => handleViewDetails(appointment)}
											>
												View Details
											</Button>
										</Box>
									</CardContent>
								</Card>
							</Grid>
						);
					})}
				</Grid>
			)}

			<Dialog
				open={openDetailDialog}
				onClose={() => setOpenDetailDialog(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>Appointment Details</DialogTitle>
				<DialogContent>
					{selectedAppointment && (
						<Grid container spacing={2} sx={{ mt: 1 }}>
							<Grid item xs={12}>
								<Typography variant="h6">
									{selectedAppointment.code?.coding?.[0]?.display ||
										selectedAppointment.code?.text ||
										"Medical Procedure"}
								</Typography>
							</Grid>

							<Grid item xs={6}>
								<Typography>
									<strong>Date:</strong>{" "}
									{formatDateTime(selectedAppointment.performedDateTime).date}
								</Typography>
							</Grid>

							<Grid item xs={6}>
								<Typography>
									<strong>Time:</strong>{" "}
									{formatDateTime(selectedAppointment.performedDateTime).time}
								</Typography>
							</Grid>

							<Grid item xs={6}>
								<Typography>
									<strong>Status:</strong>{" "}
									<Chip
										label={selectedAppointment.status || "unknown"}
										color={getStatusColor(selectedAppointment.status)}
										size="small"
									/>
								</Typography>
							</Grid>

							<Grid item xs={6}>
								<Typography>
									<strong>Category:</strong>{" "}
									{selectedAppointment.category?.coding?.[0]?.display ||
										selectedAppointment.category?.text ||
										"General"}
								</Typography>
							</Grid>

							{selectedAppointment.doctorData && (
								<Grid item xs={12}>
									<Typography>
										<strong>Doctor:</strong> Dr.{" "}
										{selectedAppointment.doctorData.name?.family ||
											selectedAppointment.doctorData.name}
										{selectedAppointment.doctorData.name?.given?.[0] &&
											`, ${selectedAppointment.doctorData.name.given[0]}`}
									</Typography>
									{selectedAppointment.doctorData.telecom && (
										<Typography variant="body2" color="text.secondary">
											Contact:{" "}
											{selectedAppointment.doctorData.telecom[0]?.value ||
												"Not available"}
										</Typography>
									)}
								</Grid>
							)}

							{selectedAppointment.code?.coding?.[0]?.code && (
								<Grid item xs={12}>
									<Typography>
										<strong>Procedure Code:</strong>{" "}
										{selectedAppointment.code.coding[0].code}
									</Typography>
								</Grid>
							)}

							{selectedAppointment.note && (
								<Grid item xs={12}>
									<Typography>
										<strong>Notes:</strong>
									</Typography>
									<Typography variant="body2">
										{selectedAppointment.note}
									</Typography>
								</Grid>
							)}

							{selectedAppointment.outcome && (
								<Grid item xs={12}>
									<Typography>
										<strong>Outcome:</strong>
									</Typography>
									<Typography variant="body2">
										{selectedAppointment.outcome.text || "No outcome recorded"}
									</Typography>
								</Grid>
							)}
						</Grid>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default MyAppointments;
