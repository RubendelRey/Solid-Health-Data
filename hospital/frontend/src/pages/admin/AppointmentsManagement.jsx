import { Box, Tab, Tabs, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as appointmentService from "../../api/services";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useNotification } from "../../contexts/NotificationContext";
import DataUtils from "../../utils/dataUtils";

const AppointmentsManagement = () => {
	const [appointments, setAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentTab, setCurrentTab] = useState(0);
	const { showNotification } = useNotification();
	const columns = [
		{
			field: "patientName",
			headerName: "Patient",
			render: (procedure) => DataUtils.getPatientName(procedure.patientData),
		},
		{
			field: "doctorName",
			headerName: "Doctor",
			render: (procedure) => DataUtils.getDoctorName(procedure.doctorData),
		},
		{
			field: "performedDateTime",
			headerName: "Performed Date",
			type: "datetime",
		},
		{
			field: "status",
			headerName: "Status",
			type: "status",
			statusColors: {
				preparation: "info",
				"in-progress": "warning",
				"not-done": "error",
				"on-hold": "warning",
				stopped: "error",
				completed: "success",
				"entered-in-error": "error",
				unknown: "default",
			},
		},
		{
			field: "procedureName",
			headerName: "Procedure",
			render: (procedure) => {
				return procedure?.procedure?.code.text || "Unknown Procedure";
			},
		},
		{
			field: "category",
			headerName: "Category",
			render: (procedure) => {
				return (
					procedure.category?.coding?.[0]?.display ||
					procedure.category?.text ||
					"General"
				);
			},
		},
	];
	const fetchAppointments = useCallback(async () => {
		try {
			setLoading(true);
			const response = await appointmentService.getAppointments();

			const proceduresCatalog =
				(await appointmentService.getProcedureCatalog()).procedures || [];

			for (let i = 0; i < response.appointments.length; i++) {
				const appointment = response.appointments[i];
				if (appointment.procedure) {
					const procedureDetails = proceduresCatalog.find(
						(p) => p._id.toString() === appointment.procedure
					);
					response.appointments[i].procedure = procedureDetails;
				}
			}
			setAppointments(response.appointments || []);
		} catch (error) {
			console.error("Error fetching appointments:", error);
			showNotification("Error fetching appointments", "error");
		} finally {
			setLoading(false);
		}
	}, [showNotification]);

	useEffect(() => {
		fetchAppointments();
	}, [fetchAppointments]);

	const handleTabChange = (event, newValue) => {
		setCurrentTab(newValue);
	};
	const getFilteredAppointments = () => {
		if (currentTab === 0) {
			return appointments.filter(
				(appointment) => appointment.status === "completed"
			);
		} else {
			return appointments.filter(
				(appointment) =>
					appointment.status === "scheduled" ||
					appointment.status === "preparation" ||
					appointment.status === "in-progress" ||
					appointment.status === "on-hold"
			);
		}
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	const filteredAppointments = getFilteredAppointments();

	return (
		<Box>
			<Typography variant="h4" gutterBottom>
				Procedures Management
			</Typography>
			<Typography variant="body1" color="text.secondary" paragraph>
				View and manage all patient procedures in the system
			</Typography>
			<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
				{" "}
				<Tabs value={currentTab} onChange={handleTabChange}>
					<Tab
						label={`Completed (${
							appointments.filter((a) => a.status === "completed").length
						})`}
					/>
					<Tab
						label={`Pending (${
							appointments.filter(
								(a) =>
									a.status === "scheduled" ||
									a.status === "preparation" ||
									a.status === "in-progress" ||
									a.status === "on-hold"
							).length
						})`}
					/>
				</Tabs>
			</Box>{" "}
			<DataTable
				data={filteredAppointments}
				columns={columns}
				loading={loading}
				title={currentTab === 0 ? "Completed Procedures" : "Pending Procedures"}
			/>
		</Box>
	);
};

export default AppointmentsManagement;
