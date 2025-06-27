import { Box, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as doctorService from "../../api/services";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useNotification } from "../../contexts/NotificationContext";
import DataUtils from "../../utils/dataUtils";

const DoctorsManagement = () => {
	const [doctors, setDoctors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [openDialog, setOpenDialog] = useState(false);
	const [openViewDialog, setOpenViewDialog] = useState(false);
	const [selectedDoctor, setSelectedDoctor] = useState(null);
	const [viewTabValue, setViewTabValue] = useState(0);
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		dateOfBirth: "",
		gender: "",
		phone: "",
		address: "",
		specialization: "",
		licenseNumber: "",
		workingHours: {
			monday: { start: "09:00", end: "17:00", available: true },
			tuesday: { start: "09:00", end: "17:00", available: true },
			wednesday: { start: "09:00", end: "17:00", available: true },
			thursday: { start: "09:00", end: "17:00", available: true },
			friday: { start: "09:00", end: "17:00", available: true },
			saturday: { start: "09:00", end: "13:00", available: false },
			sunday: { start: "09:00", end: "13:00", available: false },
		},
	});
	const { showNotification } = useNotification();

	const columns = [
		{
			field: "firstName",
			headerName: "First Name",
			render: (doctor) => DataUtils.getFirstName(doctor),
		},
		{
			field: "lastName",
			headerName: "Last Name",
			render: (doctor) => DataUtils.getLastName(doctor),
		},
		{
			field: "specialization",
			headerName: "Specialization",
			render: (doctor) =>
				doctor.specialty.map((s) => s.coding[0].display).join(", ") || "N/A",
		},
		{
			field: "licenseNumber",
			headerName: "License Number",
			render: (doctor) =>
				doctor?.qualification[0]?.identifier[0]?.value || "N/A",
		},
		{
			field: "phone",
			headerName: "Phone",
			render: (doctor) =>
				doctor.telecom
					?.filter((t) => t.system === "phone")
					.map((t) => t.value)
					.join(", ") || "N/A",
		},
		{ field: "createdAt", headerName: "Registered", type: "date" },
	];

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

	const fetchDoctors = useCallback(async () => {
		try {
			setLoading(true);
			const response = await doctorService.getDoctors();
			setDoctors(response.doctors || []);
		} catch (error) {
			console.error("Error fetching doctors:", error);
			showNotification("Error fetching doctors", "error");
		} finally {
			setLoading(false);
		}
	}, [showNotification]);

	useEffect(() => {
		fetchDoctors();
	}, [fetchDoctors]);

	const handleSubmit = async () => {
		try {
			await doctorService.updateDoctor(selectedDoctor._id, formData);
			showNotification("Doctor updated successfully", "success");
			setOpenDialog(false);
			fetchDoctors();
		} catch (error) {
			console.error("Error updating doctor:", error);
			showNotification(
				error.response?.data?.message || "Error updating doctor",
				"error"
			);
		}
	};

	const handleEdit = (doctor) => {
		setSelectedDoctor(doctor);
		setFormData({
			firstName: doctor.firstName || "",
			lastName: doctor.lastName || "",
			dateOfBirth: doctor.dateOfBirth ? doctor.dateOfBirth.split("T")[0] : "",
			gender: doctor.gender || "",
			phone: doctor.phone || "",
			address: doctor.address || "",
			specialization: doctor.specialization || "",
			licenseNumber: doctor.licenseNumber || "",
			workingHours: doctor.workingHours || {
				monday: { start: "09:00", end: "17:00", available: true },
				tuesday: { start: "09:00", end: "17:00", available: true },
				wednesday: { start: "09:00", end: "17:00", available: true },
				thursday: { start: "09:00", end: "17:00", available: true },
				friday: { start: "09:00", end: "17:00", available: true },
				saturday: { start: "09:00", end: "13:00", available: false },
				sunday: { start: "09:00", end: "13:00", available: false },
			},
		});
		setOpenDialog(true);
	};

	const handleView = async (doctor) => {
		try {
			const [doctorDetails, appointments] = await Promise.all([
				doctorService.getDoctor(doctor._id),
				doctorService.getDoctorAppointments(doctor._id),
			]);

			setSelectedDoctor({
				...doctorDetails.data,
				appointments: appointments.data || [],
			});
			setViewTabValue(0);
			setOpenViewDialog(true);
		} catch (error) {
			console.error("Error fetching doctor details:", error);
			showNotification("Error fetching doctor details", "error");
		}
	};

	const handleWorkingHourChange = (day, field, value) => {
		setFormData({
			...formData,
			workingHours: {
				...formData.workingHours,
				[day]: {
					...formData.workingHours[day],
					[field]: value,
				},
			},
		});
	};

	if (loading) {
		return <LoadingSpinner message="Loading doctors..." />;
	}

	return (
		<Box>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				mb={3}
			>
				<Typography variant="h4">Doctors Management</Typography>
			</Box>

			<DataTable data={doctors} columns={columns} totalCount={doctors.length} />
		</Box>
	);
};

export default DoctorsManagement;
