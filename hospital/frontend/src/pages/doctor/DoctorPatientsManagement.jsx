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
	FormControl,
	Grid,
	InputLabel,
	List,
	ListItem,
	ListItemText,
	MenuItem,
	Select,
	Tab,
	Tabs,
	TextField,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as patientService from "../../api/services";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import DataUtils from "../../utils/dataUtils";

const DoctorPatientsManagement = () => {
	const [patients, setPatients] = useState([]);
	const [procedures, setProcedures] = useState([]);
	const [allergies, setAllergies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [openViewDialog, setOpenViewDialog] = useState(false);
	const [openProcedureDialog, setOpenProcedureDialog] = useState(false);
	const [openAllergyDialog, setOpenAllergyDialog] = useState(false);
	const [selectedPatient, setSelectedPatient] = useState(null);
	const [viewTabValue, setViewTabValue] = useState(0);
	const [procedureForm, setProcedureForm] = useState({
		procedureId: "",
		date: "",
		status: "scheduled",
		notes: "",
	});
	const [allergyForm, setAllergyForm] = useState({
		allergyId: "",
		severity: "mild",
		diagnosedDate: "",
		notes: "",
	});
	const { user } = useAuth();
	const { showNotification } = useNotification();

	const columns = [
		{
			field: "firstName",
			headerName: "First Name",
			render: (patient) => DataUtils.getFirstName(patient),
		},
		{
			field: "lastName",
			headerName: "Last Name",
			render: (patient) => DataUtils.getLastName(patient),
		},
		{ field: "birthDate", headerName: "Date of Birth", type: "date" },
		{ field: "gender", headerName: "Gender" },
		{
			field: "phone",
			headerName: "Phone",
			render: (patient) =>
				patient.telecom
					?.filter((t) => t.system === "phone")
					.map((t) => t.value)
					.join(", ") || "N/A",
		},
	];

	const fetchPatientsAndCatalogs = useCallback(async () => {
		try {
			setLoading(true);
			const [patientsResponse, proceduresResponse, allergiesResponse] =
				await Promise.all([
					patientService.getPatients(),
					patientService.getProcedureCatalog(),
					patientService.getAllergyCatalog(),
				]);

			setPatients(patientsResponse.patients || []);
			setProcedures(proceduresResponse.procedures || []);
			setAllergies(allergiesResponse.allergies || []);
		} catch (error) {
			console.error("Error fetching data:", error);
			showNotification("Error fetching data", "error");
		} finally {
			setLoading(false);
		}
	}, [showNotification]);

	useEffect(() => {
		fetchPatientsAndCatalogs();
	}, [fetchPatientsAndCatalogs]);

	const handleView = async (patient) => {
		try {
			const [procedures, allergies] = await Promise.all([
				patientService.getPatientProcedures(patient._id),
				patientService.getPatientAllergies(patient._id),
			]);

			const proceduresCatalog =
				(await patientService.getProcedureCatalog()).procedures || [];

			const allergiesCatalog =
				(await patientService.getAllergyCatalog()).allergies || [];

			const doctorsCatalog = (await patientService.getDoctors()).doctors || [];

			for (let i = 0; i < procedures.procedures.length; i++) {
				const procedure = procedures.procedures[i];
				if (procedure.procedure) {
					const procedureDetails = proceduresCatalog.find(
						(p) => p._id.toString() === procedure.procedure
					);
					const doctorDetails = doctorsCatalog.find(
						(d) => d._id.toString() === procedure.doctor
					);
					procedures.procedures[i].procedure = procedureDetails;
					procedures.procedures[i].doctor = doctorDetails;
				}
			}

			for (let i = 0; i < allergies.allergies.length; i++) {
				const allergy = allergies.allergies[i];
				if (allergy.allergy) {
					const allergyDetails = allergiesCatalog.find(
						(a) => a._id.toString() === allergy.allergy
					);
					allergies.allergies[i].allergy = allergyDetails;
				}
			}

			setSelectedPatient({
				patient,
				procedures: procedures.procedures || [],
				allergies: allergies.allergies || [],
			});
			setViewTabValue(0);
			setOpenViewDialog(true);
		} catch (error) {
			console.error("Error fetching patient details:", error);
			showNotification("Error fetching patient details", "error");
		}
	};

	const handleAddProcedure = async () => {
		try {
			await patientService.addPatientProcedure(selectedPatient._id, {
				...procedureForm,
				doctorId: user.doctorId,
			});
			showNotification("Procedure added successfully", "success");
			setOpenProcedureDialog(false);
			setProcedureForm({
				procedureId: "",
				date: "",
				status: "scheduled",
				notes: "",
			});
			handleView(selectedPatient);
		} catch (error) {
			console.error("Error adding procedure:", error);
			showNotification("Error adding procedure", "error");
		}
	};

	const handleAddAllergy = async () => {
		try {
			await patientService.addPatientAllergy(selectedPatient._id, {
				...allergyForm,
				doctorId: user.doctorId,
			});
			showNotification("Allergy added successfully", "success");
			setOpenAllergyDialog(false);
			setAllergyForm({
				allergyId: "",
				severity: "mild",
				diagnosedDate: "",
				notes: "",
			});
			handleView(selectedPatient);
		} catch (error) {
			console.error("Error adding allergy:", error);
			showNotification("Error adding allergy", "error");
		}
	};

	if (loading) {
		return <LoadingSpinner message="Loading patients..." />;
	}

	return (
		<Box>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				mb={3}
			>
				<Typography variant="h4">Patient Management</Typography>
			</Box>

			<DataTable
				data={patients}
				columns={columns}
				onView={handleView}
				totalCount={patients.length}
			/>

			<Dialog
				open={openViewDialog}
				onClose={() => setOpenViewDialog(false)}
				maxWidth="lg"
				fullWidth
			>
				<DialogTitle>Patient Details</DialogTitle>
				<DialogContent>
					{selectedPatient && (
						<Box>
							<Card sx={{ mb: 2 }}>
								<CardContent>
									<Typography variant="h6" gutterBottom>
										{DataUtils.getPatientName(selectedPatient.patient)}
									</Typography>
									<Grid container spacing={2}>
										<Grid item xs={6}>
											<Typography>
												<strong>Date of Birth:</strong>{" "}
												{new Date(
													selectedPatient.patient.birthDate
												).toLocaleDateString()}
											</Typography>
										</Grid>
										<Grid item xs={6}>
											<Typography>
												<strong>Gender:</strong>{" "}
												{selectedPatient.patient.gender}
											</Typography>
										</Grid>
										<Grid item xs={6}>
											<Typography>
												<strong>Email:</strong>{" "}
												{selectedPatient.patient.telecom
													?.filter((t) => t.system === "email")
													.map((t) => t.value)
													.join(", ") || "N/A"}
											</Typography>
										</Grid>
										<Grid item xs={6}>
											<Typography>
												<strong>Phone:</strong>{" "}
												{selectedPatient.patient.telecom
													?.filter((t) => t.system === "phone")
													.map((t) => t.value)
													.join(", ") || "N/A"}
											</Typography>
										</Grid>
										<Grid item xs={6}>
											<Typography>
												<strong>Address:</strong>{" "}
												{selectedPatient.patient.address[0].text}
											</Typography>
										</Grid>
									</Grid>
								</CardContent>
							</Card>
							<Tabs
								value={viewTabValue}
								onChange={(e, newValue) => setViewTabValue(newValue)}
							>
								<Tab label="Procedures" />
								<Tab label="Allergies" />
							</Tabs>

							{viewTabValue === 0 && (
								<Box sx={{ mt: 2 }}>
									<Typography variant="h6" gutterBottom>
										Medical Procedures
									</Typography>
									{selectedPatient.procedures?.length > 0 ? (
										<List>
											{selectedPatient.procedures.map((procedure, index) => (
												<ListItem key={index}>
													<ListItemText
														primary={
															procedure.procedure?.code.text ||
															"Unknown Procedure"
														}
														secondary={
															<Box>
																<Typography variant="body2">
																	Date:{" "}
																	{new Date(
																		procedure.performedDateTime
																	).toLocaleDateString()}
																</Typography>
																<Typography variant="body2">
																	Doctor:{" "}
																	{DataUtils.getDoctorName(procedure.doctor)}
																</Typography>
																<Typography variant="body2">
																	Status:{" "}
																	<Chip label={procedure.status} size="small" />
																</Typography>
															</Box>
														}
													/>
												</ListItem>
											))}
										</List>
									) : (
										<Typography variant="body2" color="text.secondary">
											No procedures recorded
										</Typography>
									)}
								</Box>
							)}

							{viewTabValue === 1 && (
								<Box sx={{ mt: 2 }}>
									<Typography variant="h6" gutterBottom>
										Allergies
									</Typography>
									{selectedPatient.allergies?.length > 0 ? (
										<List>
											{selectedPatient.allergies.map((allergy, index) => (
												<ListItem key={index}>
													<ListItemText
														primary={
															allergy.allergy?.code.text || "Unknown Allergy"
														}
														secondary={
															<Box>
																<Typography variant="body2">
																	Severity:{" "}
																	<Chip
																		label={allergy.allergy?.criticality}
																		size="small"
																	/>
																</Typography>
																<Typography variant="body2">
																	Diagnosed:{" "}
																	{new Date(
																		allergy.recordedDate
																	).toLocaleDateString()}
																</Typography>
																{allergy.notes && (
																	<Typography variant="body2">
																		Notes: {allergy.notes}
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
											No allergies recorded
										</Typography>
									)}
								</Box>
							)}
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenViewDialog(false)}>Close</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={openProcedureDialog}
				onClose={() => setOpenProcedureDialog(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Add Medical Procedure</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid item xs={12}>
							<FormControl fullWidth>
								<InputLabel>Procedure</InputLabel>
								<Select
									value={procedureForm.procedureId}
									onChange={(e) =>
										setProcedureForm({
											...procedureForm,
											procedureId: e.target.value,
										})
									}
									label="Procedure"
								>
									{procedures.map((procedure) => (
										<MenuItem key={procedure._id} value={procedure._id}>
											{procedure.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								label="Date"
								type="date"
								InputLabelProps={{ shrink: true }}
								value={procedureForm.date}
								onChange={(e) =>
									setProcedureForm({ ...procedureForm, date: e.target.value })
								}
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								select
								label="Status"
								value={procedureForm.status}
								onChange={(e) =>
									setProcedureForm({ ...procedureForm, status: e.target.value })
								}
							>
								<MenuItem value="scheduled">Scheduled</MenuItem>
								<MenuItem value="completed">Completed</MenuItem>
								<MenuItem value="cancelled">Cancelled</MenuItem>
							</TextField>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Notes"
								multiline
								rows={3}
								value={procedureForm.notes}
								onChange={(e) =>
									setProcedureForm({ ...procedureForm, notes: e.target.value })
								}
							/>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenProcedureDialog(false)}>Cancel</Button>
					<Button onClick={handleAddProcedure} variant="contained">
						Add Procedure
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={openAllergyDialog}
				onClose={() => setOpenAllergyDialog(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Add Allergy</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid item xs={12}>
							<FormControl fullWidth>
								<InputLabel>Allergy</InputLabel>
								<Select
									value={allergyForm.allergyId}
									onChange={(e) =>
										setAllergyForm({
											...allergyForm,
											allergyId: e.target.value,
										})
									}
									label="Allergy"
								>
									{allergies.map((allergy) => (
										<MenuItem key={allergy._id} value={allergy._id}>
											{allergy.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								select
								label="Severity"
								value={allergyForm.severity}
								onChange={(e) =>
									setAllergyForm({ ...allergyForm, severity: e.target.value })
								}
							>
								<MenuItem value="mild">Mild</MenuItem>
								<MenuItem value="moderate">Moderate</MenuItem>
								<MenuItem value="severe">Severe</MenuItem>
								<MenuItem value="critical">Critical</MenuItem>
							</TextField>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								label="Diagnosed Date"
								type="date"
								InputLabelProps={{ shrink: true }}
								value={allergyForm.diagnosedDate}
								onChange={(e) =>
									setAllergyForm({
										...allergyForm,
										diagnosedDate: e.target.value,
									})
								}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Notes"
								multiline
								rows={3}
								value={allergyForm.notes}
								onChange={(e) =>
									setAllergyForm({ ...allergyForm, notes: e.target.value })
								}
							/>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenAllergyDialog(false)}>Cancel</Button>
					<Button onClick={handleAddAllergy} variant="contained">
						Add Allergy
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default DoctorPatientsManagement;
