import {
	Event as EventIcon,
	Schedule as ScheduleIcon,
	Today as TodayIcon,
} from "@mui/icons-material";
import {
	Box,
	Card,
	CardContent,
	Chip,
	Grid,
	List,
	ListItem,
	ListItemText,
	TextField,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as doctorService from "../../api/services";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import DataUtils from "../../utils/dataUtils";

const DoctorSchedule = () => {
	const [appointments, setAppointments] = useState([]);
	const [workingHours, setWorkingHours] = useState({});
	const [loading, setLoading] = useState(true);
	const [selectedDate, setSelectedDate] = useState(
		new Date().toISOString().split("T")[0]
	);
	const { user } = useAuth();
	const { showNotification } = useNotification();

	const daysOfWeek = [
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
		"sunday",
	];
	const dayLabels = {
		monday: "Monday",
		tuesday: "Tuesday",
		wednesday: "Wednesday",
		thursday: "Thursday",
		friday: "Friday",
		saturday: "Saturday",
		sunday: "Sunday",
	};

	const fetchScheduleData = useCallback(async () => {
		try {
			setLoading(true);
			const [appointmentsResponse] = await Promise.all([
				doctorService.getDoctorAppointments(user.doctor._id, selectedDate),
			]);

			let patients =
				(await doctorService.getPatients(user.doctor._id)).patients || [];

			for (let i = 0; i < appointmentsResponse.procedures.length; i++) {
				const appointment = appointmentsResponse.procedures[i];
				const patient = patients.find((p) => p._id === appointment.patient);
				if (patient) {
					appointment.patient = patient;
				}
			}

			setAppointments(appointmentsResponse.procedures || []);
			setWorkingHours(user.doctor.workingHours || {});
		} catch (error) {
			console.error("Error fetching schedule data:", error);
			showNotification("Error loading schedule data", "error");
		} finally {
			setLoading(false);
		}
	}, [user.doctorId, selectedDate, showNotification]);

	useEffect(() => {
		if (user.doctor) {
			fetchScheduleData();
		}
	}, [fetchScheduleData, user.doctor]);

	const getStatusColor = (status) => {
		switch (status) {
			case "scheduled":
				return "primary";
			case "confirmed":
				return "success";
			case "completed":
				return "info";
			case "cancelled":
				return "error";
			default:
				return "default";
		}
	};

	const getTodayAppointments = () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date();
		tomorrow.setDate(today.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);
		return appointments
			.filter(
				(appointment) =>
					new Date(
						appointment.performedDateTime || appointment.scheduledDateTime
					) > today &&
					new Date(
						appointment.performedDateTime || appointment.scheduledDateTime
					) < tomorrow
			)
			.slice(0, 10);
	};

	const getUpcomingAppointments = () => {
		const today = new Date(selectedDate);
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(selectedDate);
		tomorrow.setDate(today.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);
		return appointments
			.filter(
				(appointment) =>
					new Date(
						appointment.performedDateTime || appointment.scheduledDateTime
					) > today &&
					new Date(
						appointment.performedDateTime || appointment.scheduledDateTime
					) < tomorrow
			)
			.slice(0, 10);
	};

	if (loading) {
		return <LoadingSpinner message="Loading schedule..." />;
	}

	const todayAppointments = getTodayAppointments();
	const upcomingAppointments = getUpcomingAppointments();

	return (
		<Box>
			<Typography variant="h4" gutterBottom>
				My Schedule
			</Typography>

			<Grid container spacing={3}>
				<Grid item xs={12} md={6}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								<ScheduleIcon sx={{ mr: 1, verticalAlign: "middle" }} />
								Working Hours
							</Typography>
							<Grid container spacing={1}>
								{daysOfWeek.map((day) => (
									<Grid item xs={12} sm={6} key={day}>
										<Card variant="outlined" sx={{ p: 1 }}>
											<Typography variant="subtitle2">
												{dayLabels[day]}
											</Typography>
											{workingHours[day] ? (
												<Typography variant="body2" color="success.main">
													{workingHours[day].start} - {workingHours[day].end}
												</Typography>
											) : (
												<Typography variant="body2" color="text.secondary">
													Not available
												</Typography>
											)}
										</Card>
									</Grid>
								))}
							</Grid>
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12} md={6}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								<TodayIcon sx={{ mr: 1, verticalAlign: "middle" }} />
								Today's Appointments ({todayAppointments.length})
							</Typography>
							{todayAppointments.length > 0 ? (
								<List dense>
									{todayAppointments.map((appointment, index) => (
										<ListItem key={index} sx={{ px: 0 }}>
											<ListItemText
												primary={
													<Box
														display="flex"
														justifyContent="space-between"
														alignItems="center"
													>
														<Typography variant="subtitle2">
															{new Date(
																appointment.performedDateTime ||
																	appointment.scheduledDateTime
															).toLocaleTimeString()}{" "}
															- {DataUtils.getPatientName(appointment.patient)}
														</Typography>
														<Chip
															label={appointment.status}
															size="small"
															color={getStatusColor(appointment.status)}
														/>
													</Box>
												}
											/>
										</ListItem>
									))}
								</List>
							) : (
								<Typography variant="body2" color="text.secondary">
									No appointments scheduled for today
								</Typography>
							)}
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								<EventIcon sx={{ mr: 1, verticalAlign: "middle" }} />
								Upcoming Appointments
							</Typography>
							<Box sx={{ mb: 2 }}>
								<TextField
									type="date"
									label="Filter by date"
									value={selectedDate}
									onChange={(e) => setSelectedDate(e.target.value)}
									InputLabelProps={{ shrink: true }}
									size="small"
								/>
							</Box>
							{upcomingAppointments.length > 0 ? (
								<List>
									{upcomingAppointments.map((appointment, index) => (
										<ListItem key={index} divider>
											<ListItemText
												primary={
													<Box
														display="flex"
														justifyContent="space-between"
														alignItems="center"
													>
														<Typography variant="subtitle1">
															{DataUtils.getPatientName(appointment.patient)}
														</Typography>
													</Box>
												}
												secondary={
													<Box>
														<Typography variant="body2">
															Date:{" "}
															{new Date(
																appointment.performedDateTime ||
																	appointment.scheduledDateTime
															).toLocaleDateString()}{" "}
															at{" "}
															{new Date(
																appointment.performedDateTime ||
																	appointment.scheduledDateTime
															).toLocaleTimeString()}
														</Typography>
														<Typography variant="body2">
															Status:{" "}
															<Chip
																label={appointment.status}
																size="small"
																color={getStatusColor(appointment.status)}
															/>
														</Typography>
														{appointment.reason && (
															<Typography variant="body2">
																Reason: {appointment.reason}
															</Typography>
														)}
														{appointment.patient?.phone && (
															<Typography variant="body2">
																Phone: {appointment.patient.phone}
															</Typography>
														)}
													</Box>
												}
											/>
										</ListItem>
									))}
								</List>
							) : (
								<Typography variant="body2" color="text.secondary">
									No upcoming appointments
								</Typography>
							)}
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</Box>
	);
};

export default DoctorSchedule;
