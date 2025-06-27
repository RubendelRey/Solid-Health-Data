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
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as services from "../../api/services";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";

const DoctorProceduresView = () => {
	const [procedures, setProcedures] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentTab, setCurrentTab] = useState(0);
	const [selectedProcedure, setSelectedProcedure] = useState(null);
	const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

	const { user } = useAuth();
	const { showNotification } = useNotification();

	const fetchProcedures = useCallback(async () => {
		try {
			setLoading(true);
			if (user?.doctor?._id) {
				const response = await services.getDoctorProcedures(user.doctor._id);
				setProcedures(response.procedures || response || []);
			} else {
				const response = await services.getAppointments();
				setProcedures(response.appointments || []);
			}
		} catch (error) {
			console.error("Error fetching procedures:", error);
			showNotification("Error fetching procedures", "error");
			setProcedures([]);
		} finally {
			setLoading(false);
		}
	}, [user, showNotification]);

	useEffect(() => {
		fetchProcedures();
	}, [fetchProcedures]);

	const handleTabChange = (event, newValue) => {
		setCurrentTab(newValue);
	};

	const getFilteredProcedures = () => {
		const now = new Date();

		switch (currentTab) {
			case 0:
				return procedures;
			case 1:
				return procedures.filter((p) => p.status === "completed");
			case 2:
				return procedures.filter(
					(p) =>
						p.status === "scheduled" ||
						p.status === "preparation" ||
						p.status === "in-progress"
				);
			case 3:
				return procedures.filter(
					(p) =>
						new Date(p.performedDateTime) >= now &&
						(p.status === "scheduled" || p.status === "preparation")
				);
			default:
				return procedures;
		}
	};

	const handleViewDetails = (procedure) => {
		setSelectedProcedure(procedure);
		setDetailsDialogOpen(true);
	};

	const getStatusColor = (status) => {
		const colors = {
			preparation: "info",
			"in-progress": "warning",
			"not-done": "error",
			"on-hold": "warning",
			stopped: "error",
			completed: "success",
			"entered-in-error": "error",
			unknown: "default",
			scheduled: "primary",
		};
		return colors[status] || "default";
	};

	const formatDateTime = (dateTime) => {
		if (!dateTime) return "Not specified";
		return new Date(dateTime).toLocaleString();
	};

	const columns = [
		{
			field: "patientName",
			headerName: "Patient",
			width: 180,
			render: (procedure) => {
				return (
					procedure.patientData?.name?.family +
						", " +
						procedure.patientData?.name?.given?.[0] ||
					procedure.patientData?.name ||
					"Unknown Patient"
				);
			},
		},
		{
			field: "procedureName",
			headerName: "Procedure",
			width: 200,
			render: (procedure) => {
				return (
					procedure.code?.coding?.[0]?.display ||
					procedure.code?.text ||
					"Unknown Procedure"
				);
			},
		},
		{
			field: "performedDateTime",
			headerName: "Date & Time",
			width: 160,
			render: (procedure) => formatDateTime(procedure.performedDateTime),
		},
		{
			field: "status",
			headerName: "Status",
			width: 120,
			render: (procedure) => (
				<Chip
					label={procedure.status || "unknown"}
					color={getStatusColor(procedure.status)}
					size="small"
				/>
			),
		},
		{
			field: "category",
			headerName: "Category",
			width: 130,
			render: (procedure) => {
				return (
					procedure.category?.coding?.[0]?.display ||
					procedure.category?.text ||
					"General"
				);
			},
		},
		{
			field: "actions",
			headerName: "Actions",
			width: 150,
			render: (procedure) => (
				<Box>
					<Button
						size="small"
						onClick={() => handleViewDetails(procedure)}
						sx={{ mr: 1 }}
					>
						View
					</Button>
				</Box>
			),
		},
	];

	if (loading) {
		return <LoadingSpinner />;
	}

	const filteredProcedures = getFilteredProcedures();
	return (
		<Box>
			<Typography variant="h4" gutterBottom>
				My Procedures
			</Typography>
			<Typography variant="body1" color="text.secondary" paragraph>
				View and manage procedures you have performed or will perform
			</Typography>

			<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
				<Tabs value={currentTab} onChange={handleTabChange}>
					<Tab label={`All (${procedures.length})`} />
					<Tab
						label={`Completed (${
							procedures.filter((p) => p.status === "completed").length
						})`}
					/>
					<Tab
						label={`Scheduled (${
							procedures.filter(
								(p) =>
									p.status === "scheduled" ||
									p.status === "preparation" ||
									p.status === "in-progress"
							).length
						})`}
					/>
				</Tabs>
			</Box>

			<DataTable
				data={filteredProcedures}
				columns={columns}
				loading={loading}
				title="Procedures"
			/>

			<Dialog
				open={detailsDialogOpen}
				onClose={() => setDetailsDialogOpen(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>Procedure Details</DialogTitle>
				<DialogContent>
					{selectedProcedure && (
						<Grid container spacing={2}>
							<Grid item xs={12} md={6}>
								<Card>
									<CardContent>
										<Typography variant="h6" gutterBottom>
											Patient Information
										</Typography>
										<Typography>
											<strong>Name:</strong>{" "}
											{selectedProcedure.patientData?.name?.family},{" "}
											{selectedProcedure.patientData?.name?.given?.[0] ||
												selectedProcedure.patientData?.name ||
												"Unknown"}
										</Typography>
										<Typography>
											<strong>Contact:</strong>{" "}
											{selectedProcedure.patientData?.telecom?.[0]?.value ||
												"Not available"}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid item xs={12} md={6}>
								<Card>
									<CardContent>
										<Typography variant="h6" gutterBottom>
											Procedure Information
										</Typography>
										<Typography>
											<strong>Procedure:</strong>{" "}
											{selectedProcedure.code?.coding?.[0]?.display ||
												selectedProcedure.code?.text ||
												"Unknown"}
										</Typography>
										<Typography>
											<strong>Category:</strong>{" "}
											{selectedProcedure.category?.coding?.[0]?.display ||
												selectedProcedure.category?.text ||
												"General"}
										</Typography>
										<Typography>
											<strong>Status:</strong>{" "}
											<Chip
												label={selectedProcedure.status}
												color={getStatusColor(selectedProcedure.status)}
												size="small"
											/>
										</Typography>
										<Typography>
											<strong>Date & Time:</strong>{" "}
											{formatDateTime(selectedProcedure.performedDateTime)}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							{selectedProcedure.note && (
								<Grid item xs={12}>
									<Card>
										<CardContent>
											<Typography variant="h6" gutterBottom>
												Notes
											</Typography>
											<Typography>{selectedProcedure.note}</Typography>
										</CardContent>
									</Card>
								</Grid>
							)}
							{selectedProcedure.outcome && (
								<Grid item xs={12}>
									<Card>
										<CardContent>
											<Typography variant="h6" gutterBottom>
												Outcome
											</Typography>
											<Typography>
												{selectedProcedure.outcome.text ||
													"No outcome recorded"}
											</Typography>
										</CardContent>
									</Card>
								</Grid>
							)}
						</Grid>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default DoctorProceduresView;
