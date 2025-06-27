import {
	Warning as AllergyIcon,
	LocalHospital as ProcedureIcon,
	Visibility as ViewIcon,
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
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as patientService from "../../api/services";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import DataUtils from "../../utils/dataUtils";

const PatientMedicalRecords = () => {
	const [procedures, setProcedures] = useState([]);
	const [allergies, setAllergies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [tabValue, setTabValue] = useState(0);
	const [openProcedureDialog, setOpenProcedureDialog] = useState(false);
	const [openAllergyDialog, setOpenAllergyDialog] = useState(false);
	const [selectedProcedure, setSelectedProcedure] = useState(null);
	const [selectedAllergy, setSelectedAllergy] = useState(null);
	const { user } = useAuth();
	const { showNotification } = useNotification();

	const fetchMedicalRecords = useCallback(async () => {
		try {
			setLoading(true);
			const [procedures, allergies] = await Promise.all([
				patientService.getPatientProcedures(user.patient._id),
				patientService.getPatientAllergies(user.patient._id),
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

			setProcedures(procedures.procedures || []);
			setAllergies(allergies.allergies || []);
		} catch (error) {
			console.error("Error fetching medical records:", error);
			showNotification("Error loading medical records", "error");
		} finally {
			setLoading(false);
		}
	}, [user.patient._id, showNotification]);

	useEffect(() => {
		if (user.patient._id) {
			fetchMedicalRecords();
		}
	}, [fetchMedicalRecords, user.patient._id]);
	const handleViewProcedure = (procedure) => {
		setSelectedProcedure(procedure);
		setOpenProcedureDialog(true);
	};

	const handleViewAllergy = (allergy) => {
		setSelectedAllergy(allergy);
		setOpenAllergyDialog(true);
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "completed":
				return "success";
			case "scheduled":
				return "primary";
			case "cancelled":
				return "error";
			default:
				return "default";
		}
	};

	const getSeverityColor = (severity) => {
		switch (severity) {
			case "mild":
				return "success";
			case "moderate":
				return "warning";
			case "severe":
			case "critical":
				return "error";
			default:
				return "default";
		}
	};

	if (loading) {
		return <LoadingSpinner message="Loading medical records..." />;
	}

	return (
		<Box>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				mb={3}
			>
				<Typography variant="h4">Medical Records</Typography>
			</Box>
			<Card>
				<CardContent>
					<Tabs
						value={tabValue}
						onChange={(e, newValue) => setTabValue(newValue)}
					>
						<Tab
							label={`Procedures (${procedures.length})`}
							icon={<ProcedureIcon />}
							iconPosition="start"
						/>
						<Tab
							label={`Allergies (${allergies.length})`}
							icon={<AllergyIcon />}
							iconPosition="start"
						/>
					</Tabs>

					{tabValue === 0 && (
						<Box sx={{ mt: 3 }}>
							<Typography variant="h6" gutterBottom>
								Medical Procedures
							</Typography>
							{procedures.length > 0 ? (
								<List>
									{procedures.map((procedure, index) => (
										<ListItem key={index} divider>
											<ListItemText
												primary={
													<Box
														display="flex"
														justifyContent="space-between"
														alignItems="center"
													>
														<Typography variant="subtitle1">
															{procedure.procedure?.code.text ||
																"Unknown Procedure"}
														</Typography>{" "}
														<Button
															size="small"
															startIcon={<ViewIcon />}
															onClick={() => handleViewProcedure(procedure)}
														>
															Details
														</Button>
													</Box>
												}
												secondary={
													<Box sx={{ mt: 1 }}>
														<Typography variant="body2">
															<strong>Date:</strong>{" "}
															{new Date(
																procedure.performedDateTime ||
																	procedure.scheduledDateTime
															).toLocaleDateString()}
														</Typography>
														<Typography variant="body2">
															<strong>Doctor:</strong> Dr.{" "}
															{DataUtils.getDoctorName(procedure.doctor)}
														</Typography>
														<Typography variant="body2" sx={{ mt: 0.5 }}>
															<strong>Status:</strong>{" "}
															<Chip
																label={procedure.status}
																size="small"
																color={getStatusColor(procedure.status)}
															/>
														</Typography>
														{procedure.procedure?.code && (
															<Typography variant="body2">
																<strong>Code:</strong>{" "}
																{procedure.procedure.code.coding[0].code}
															</Typography>
														)}
														{procedure.notes && (
															<Typography variant="body2" sx={{ mt: 0.5 }}>
																<strong>Notes:</strong> {procedure.notes}
															</Typography>
														)}
													</Box>
												}
											/>
										</ListItem>
									))}
								</List>
							) : (
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ textAlign: "center", py: 4 }}
								>
									No medical procedures recorded
								</Typography>
							)}
						</Box>
					)}

					{tabValue === 1 && (
						<Box sx={{ mt: 3 }}>
							<Typography variant="h6" gutterBottom>
								Known Allergies
							</Typography>
							{allergies.length > 0 ? (
								<List>
									{allergies.map((allergy, index) => (
										<ListItem key={index} divider>
											<ListItemText
												primary={
													<Box
														display="flex"
														justifyContent="space-between"
														alignItems="center"
													>
														<Typography variant="subtitle1">
															{allergy.allergy?.code.text || "Unknown Allergy"}
														</Typography>{" "}
														<Button
															size="small"
															startIcon={<ViewIcon />}
															onClick={() => handleViewAllergy(allergy)}
														>
															Details
														</Button>
													</Box>
												}
												secondary={
													<Box sx={{ mt: 1 }}>
														<Typography variant="body2">
															<strong>Severity:</strong>{" "}
															<Chip
																label={allergy.criticality}
																size="small"
																color={getSeverityColor(allergy.criticality)}
															/>
														</Typography>
														<Typography variant="body2">
															<strong>Diagnosed:</strong>{" "}
															{new Date(
																allergy.recordedDate
															).toLocaleDateString()}
														</Typography>
														{allergy.allergy?.code && (
															<Typography variant="body2">
																<strong>Code:</strong>{" "}
																{allergy.allergy.code.coding[0].code}
															</Typography>
														)}
													</Box>
												}
											/>
										</ListItem>
									))}
								</List>
							) : (
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ textAlign: "center", py: 4 }}
								>
									No allergies recorded
								</Typography>
							)}
						</Box>
					)}
				</CardContent>
			</Card>{" "}
			<Dialog
				open={openProcedureDialog}
				onClose={() => setOpenProcedureDialog(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>Procedure Details</DialogTitle>
				<DialogContent>
					{selectedProcedure && (
						<Grid container spacing={2} sx={{ mt: 1 }}>
							<Grid item xs={12}>
								<Typography variant="h6">
									{selectedProcedure.procedure?.code.text}
								</Typography>
							</Grid>
							<Grid item xs={6}>
								<Typography>
									<strong>Date:</strong>{" "}
									{new Date(
										selectedProcedure.scheduledDateTime ||
											selectedProcedure.performedDateTime
									).toLocaleDateString()}
								</Typography>
							</Grid>
							<Grid item xs={6}>
								<Typography>
									<strong>Status:</strong> {selectedProcedure.status}
								</Typography>
							</Grid>
							<Grid item xs={12}>
								<Typography>
									<strong>Doctor:</strong> Dr.{" "}
									{DataUtils.getDoctorName(selectedProcedure.doctor)}
								</Typography>
							</Grid>
							{selectedProcedure.procedure?.code && (
								<Grid item xs={12}>
									<Typography>
										<strong>Procedure Code:</strong>{" "}
										{selectedProcedure.procedure.code.coding[0].code}
									</Typography>
								</Grid>
							)}
							{selectedProcedure.procedure?.description && (
								<Grid item xs={12}>
									<Typography>
										<strong>Description:</strong>{" "}
										{selectedProcedure.procedure.description}
									</Typography>
								</Grid>
							)}
						</Grid>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenProcedureDialog(false)}>Close</Button>
				</DialogActions>
			</Dialog>
			<Dialog
				open={openAllergyDialog}
				onClose={() => setOpenAllergyDialog(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>Allergy Details</DialogTitle>
				<DialogContent>
					{selectedAllergy && (
						<Grid container spacing={2} sx={{ mt: 1 }}>
							<Grid item xs={12}>
								<Typography variant="h6">
									{selectedAllergy.allergy?.code.text || "Unknown Allergy"}
								</Typography>
							</Grid>
							<Grid item xs={6}>
								<Typography>
									<strong>Severity:</strong> {selectedAllergy.criticality}
								</Typography>
							</Grid>
							<Grid item xs={6}>
								<Typography>
									<strong>Status:</strong>{" "}
									{selectedAllergy.clinicalStatus.coding[0].code}
								</Typography>
							</Grid>
							<Grid item xs={6}>
								<Typography>
									<strong>Diagnosed:</strong>{" "}
									{new Date(selectedAllergy.recordedDate).toLocaleDateString()}
								</Typography>
							</Grid>
							{selectedAllergy.allergy?.code && (
								<Grid item xs={12}>
									<Typography>
										<strong>Code:</strong>{" "}
										{selectedAllergy.allergy.code.coding[0].code}
									</Typography>
								</Grid>
							)}
							{selectedAllergy.allergy?.description && (
								<Grid item xs={12}>
									<Typography>
										<strong>Description:</strong>{" "}
										{selectedAllergy.allergy.description}
									</Typography>
								</Grid>
							)}
						</Grid>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenAllergyDialog(false)}>Close</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default PatientMedicalRecords;
