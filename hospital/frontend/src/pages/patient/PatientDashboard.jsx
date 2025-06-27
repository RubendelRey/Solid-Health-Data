import {
	Add as AddIcon,
	Warning as AllergyIcon,
	Event as AppointmentIcon,
	Download as DownloadIcon,
	Person as PersonIcon,
	LocalHospital as ProcedureIcon,
	Upload as UploadIcon,
} from "@mui/icons-material";
import {
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
	ListItemText,
	MenuItem,
	TextField,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as patientService from "../../api/services";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatsCard from "../../components/common/StatsCard";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";

const PatientDashboard = () => {
	const [patientData, setPatientData] = useState({});
	const [procedures, setProcedures] = useState([]);
	const [allergies, setAllergies] = useState([]);
	const [appointments, setAppointments] = useState([]);
	const [doctors, setDoctors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [openAppointmentDialog, setOpenAppointmentDialog] = useState(false);
	const [appointmentForm, setAppointmentForm] = useState({
		doctorId: "",
		date: "",
		time: "",
		reason: "",
	});
	const { user } = useAuth();
	const { showNotification } = useNotification();

	const fetchPatientData = useCallback(async () => {
		try {
			setLoading(true);
			const [
				patientResponse,
				proceduresResponse,
				allergiesResponse,
				appointmentsResponse,
				doctorsResponse,
			] = await Promise.all([
				patientService.getPatient(user.patientId),
				patientService.getPatientProcedures(user.patientId),
				patientService.getPatientAllergies(user.patientId),
				patientService.getPatientAppointments(user.patientId),
				patientService.getDoctors(),
			]);

			setPatientData(patientResponse.data || {});
			setProcedures(proceduresResponse.data || []);
			setAllergies(allergiesResponse.data || []);
			setAppointments(appointmentsResponse.data || []);
			setDoctors(doctorsResponse.data || []);
		} catch (error) {
			console.error("Error fetching patient data:", error);
			showNotification("Error loading patient data", "error");
		} finally {
			setLoading(false);
		}
	}, [user.patientId, showNotification]);

	useEffect(() => {
		if (user.patientId) {
			fetchPatientData();
		}
	}, [fetchPatientData, user.patientId]);

	const handleRequestAppointment = async () => {
		try {
			await patientService.requestAppointment({
				...appointmentForm,
				patientId: user.patientId,
			});
			showNotification("Appointment requested successfully", "success");
			setOpenAppointmentDialog(false);
			setAppointmentForm({
				doctorId: "",
				date: "",
				time: "",
				reason: "",
			});
			fetchPatientData();
		} catch (error) {
			console.error("Error requesting appointment:", error);
			showNotification("Error requesting appointment", "error");
		}
	};

	const handleExportToSOLID = async () => {
		try {
			await patientService.exportToSOLID(user.patientId);
			showNotification("Data exported to SOLID pod successfully", "success");
		} catch (error) {
			console.error("Error exporting to SOLID:", error);
			showNotification("Error exporting to SOLID pod", "error");
		}
	};

	const handleImportFromSOLID = async () => {
		try {
			await patientService.importFromSOLID(user.patientId);
			showNotification("Data imported from SOLID pod successfully", "success");
			fetchPatientData();
		} catch (error) {
			console.error("Error importing from SOLID:", error);
			showNotification("Error importing from SOLID pod", "error");
		}
	};

	const getUpcomingAppointments = () => {
		const today = new Date();
		return appointments
			.filter((appointment) => new Date(appointment.date) >= today)
			.slice(0, 5);
	};

	const getRecentProcedures = () => {
		return procedures
			.sort((a, b) => new Date(b.date) - new Date(a.date))
			.slice(0, 3);
	};

	if (loading) {
		return <LoadingSpinner message="Loading your data..." />;
	}

	const upcomingAppointments = getUpcomingAppointments();
	const recentProcedures = getRecentProcedures();

	return (
		<Box>
			<Box display="flex" justify="space-between" alignItems="center" mb={3}>
				<Box>
					<Typography variant="h4" gutterBottom>
						Patient Dashboard
					</Typography>
					<Typography variant="subtitle1" color="text.secondary">
						Welcome back, {patientData.firstName} {patientData.lastName}
					</Typography>
				</Box>
				<Box display="flex" gap={1}>
					<Button
						variant="outlined"
						startIcon={<UploadIcon />}
						onClick={handleImportFromSOLID}
					>
						Import from SOLID
					</Button>
					<Button
						variant="outlined"
						startIcon={<DownloadIcon />}
						onClick={handleExportToSOLID}
					>
						Export to SOLID
					</Button>
				</Box>
			</Box>

			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid item xs={12} sm={6} md={3}>
					<StatsCard
						title="Medical Procedures"
						value={procedures.length}
						icon={<ProcedureIcon />}
						color="primary"
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<StatsCard
						title="Known Allergies"
						value={allergies.length}
						icon={<AllergyIcon />}
						color="warning"
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<StatsCard
						title="Upcoming Appointments"
						value={upcomingAppointments.length}
						icon={<AppointmentIcon />}
						color="success"
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<StatsCard
						title="Total Appointments"
						value={appointments.length}
						icon={<AppointmentIcon />}
						color="info"
					/>
				</Grid>
			</Grid>

			<Grid container spacing={3}>
				<Grid item xs={12} md={4}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								<PersonIcon sx={{ mr: 1, verticalAlign: "middle" }} />
								Personal Information
							</Typography>
							<Box sx={{ mt: 2 }}>
								<Typography variant="body2">
									<strong>Name:</strong> {patientData.firstName}{" "}
									{patientData.lastName}
								</Typography>
								<Typography variant="body2">
									<strong>Date of Birth:</strong>{" "}
									{new Date(patientData.dateOfBirth).toLocaleDateString()}
								</Typography>
								<Typography variant="body2">
									<strong>Gender:</strong> {patientData.gender}
								</Typography>
								<Typography variant="body2">
									<strong>Phone:</strong> {patientData.phone}
								</Typography>
								<Typography variant="body2">
									<strong>Address:</strong> {patientData.address}
								</Typography>
								{patientData.emergencyContact && (
									<Box sx={{ mt: 2 }}>
										<Typography variant="subtitle2">
											Emergency Contact:
										</Typography>
										<Typography variant="body2">
											{patientData.emergencyContact.name}
										</Typography>
										<Typography variant="body2">
											{patientData.emergencyContact.phone}
										</Typography>
									</Box>
								)}
							</Box>
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12} md={4}>
					<Card>
						<CardContent>
							<Box
								display="flex"
								justifyContent="space-between"
								alignItems="center"
								mb={2}
							>
								<Typography variant="h6">
									<AppointmentIcon sx={{ mr: 1, verticalAlign: "middle" }} />
									Upcoming Appointments
								</Typography>
								<Button
									size="small"
									startIcon={<AddIcon />}
									onClick={() => setOpenAppointmentDialog(true)}
								>
									Request
								</Button>
							</Box>
							{upcomingAppointments.length > 0 ? (
								<List dense>
									{upcomingAppointments.map((appointment, index) => (
										<ListItem key={index} sx={{ px: 0 }}>
											<ListItemText
												primary={`Dr. ${appointment.doctor?.firstName} ${appointment.doctor?.lastName}`}
												secondary={
													<Box>
														<Typography variant="body2">
															{new Date(appointment.date).toLocaleDateString()}{" "}
															at {appointment.time}
														</Typography>
														<Chip label={appointment.status} size="small" />
														{appointment.reason && (
															<Typography variant="body2">
																Reason: {appointment.reason}
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

				<Grid item xs={12} md={4}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								<ProcedureIcon sx={{ mr: 1, verticalAlign: "middle" }} />
								Recent Procedures
							</Typography>
							{recentProcedures.length > 0 ? (
								<List dense>
									{recentProcedures.map((procedure, index) => (
										<ListItem key={index} sx={{ px: 0 }}>
											<ListItemText
												primary={
													procedure.procedure?.name || "Unknown Procedure"
												}
												secondary={
													<Box>
														<Typography variant="body2">
															Date:{" "}
															{new Date(procedure.date).toLocaleDateString()}
														</Typography>
														<Typography variant="body2">
															Doctor: Dr. {procedure.doctor?.firstName}{" "}
															{procedure.doctor?.lastName}
														</Typography>
														<Chip label={procedure.status} size="small" />
													</Box>
												}
											/>
										</ListItem>
									))}
								</List>
							) : (
								<Typography variant="body2" color="text.secondary">
									No recent procedures
								</Typography>
							)}
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								<AllergyIcon sx={{ mr: 1, verticalAlign: "middle" }} />
								Known Allergies
							</Typography>
							{allergies.length > 0 ? (
								<Grid container spacing={1}>
									{allergies.map((allergy, index) => (
										<Grid item key={index}>
											<Chip
												label={`${allergy.allergy?.name} (${allergy.severity})`}
												color={
													allergy.severity === "severe" ||
													allergy.severity === "critical"
														? "error"
														: "warning"
												}
												variant="outlined"
											/>
										</Grid>
									))}
								</Grid>
							) : (
								<Typography variant="body2" color="text.secondary">
									No known allergies
								</Typography>
							)}
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			<Dialog
				open={openAppointmentDialog}
				onClose={() => setOpenAppointmentDialog(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Request Appointment</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid item xs={12}>
							<TextField
								fullWidth
								select
								label="Doctor"
								value={appointmentForm.doctorId}
								onChange={(e) =>
									setAppointmentForm({
										...appointmentForm,
										doctorId: e.target.value,
									})
								}
							>
								{doctors.map((doctor) => (
									<MenuItem key={doctor._id} value={doctor._id}>
										Dr. {doctor.firstName} {doctor.lastName} -{" "}
										{doctor.specialization}
									</MenuItem>
								))}
							</TextField>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								label="Date"
								type="date"
								InputLabelProps={{ shrink: true }}
								value={appointmentForm.date}
								onChange={(e) =>
									setAppointmentForm({
										...appointmentForm,
										date: e.target.value,
									})
								}
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								label="Time"
								type="time"
								InputLabelProps={{ shrink: true }}
								value={appointmentForm.time}
								onChange={(e) =>
									setAppointmentForm({
										...appointmentForm,
										time: e.target.value,
									})
								}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Reason for Visit"
								multiline
								rows={3}
								value={appointmentForm.reason}
								onChange={(e) =>
									setAppointmentForm({
										...appointmentForm,
										reason: e.target.value,
									})
								}
							/>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenAppointmentDialog(false)}>
						Cancel
					</Button>
					<Button onClick={handleRequestAppointment} variant="contained">
						Request Appointment
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default PatientDashboard;
