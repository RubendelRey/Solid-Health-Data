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
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as patientService from "../../api/services";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useNotification } from "../../contexts/NotificationContext";
import DataUtils from "../../utils/dataUtils";

const PatientsManagement = () => {
	const [patients, setPatients] = useState([]);
	const [loading, setLoading] = useState(true);
	const [openViewDialog, setOpenViewDialog] = useState(false);
	const [selectedPatient, setSelectedPatient] = useState(null);
	const [viewTabValue, setViewTabValue] = useState(0);
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
		{ field: "createdAt", headerName: "Registered", type: "date" },
	];

	const fetchPatients = useCallback(async () => {
		try {
			setLoading(true);
			const response = await patientService.getPatients();
			setPatients(response.patients || []);
		} catch (error) {
			console.error("Error fetching patients:", error);
			showNotification("Error fetching patients", "error");
		} finally {
			setLoading(false);
		}
	}, [showNotification]);

	useEffect(() => {
		fetchPatients();
	}, [fetchPatients]);

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
				<Typography variant="h4">Patients Management</Typography>
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
		</Box>
	);
};

export default PatientsManagement;
