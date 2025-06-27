import { Add as AddIcon } from "@mui/icons-material";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	Grid,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as allergyService from "../../api/services";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useNotification } from "../../contexts/NotificationContext";

const AllergiesManagement = () => {
	const [allergies, setAllergies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [openDialog, setOpenDialog] = useState(false);
	const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
	const [selectedAllergy, setSelectedAllergy] = useState(null);
	const [formData, setFormData] = useState({
		code: "",
		display: "",
		definition: "",
		category: "",
		severity: "mild",
	});
	const { showNotification } = useNotification();

	const severityOptions = [
		{ value: "mild", label: "Mild" },
		{ value: "moderate", label: "Moderate" },
		{ value: "severe", label: "Severe" },
	];

	const categoryOptions = [
		{ value: "food", label: "Food" },
		{ value: "medication", label: "Medication" },
		{ value: "environmental", label: "Environmental" },
		{ value: "biologic", label: "Biologic" },
		{ value: "other", label: "Other" },
	];
	const columns = [
		{
			field: "code",
			headerName: "Code",
			render: (allergy) =>
				allergy.code?.coding?.[0]?.code || allergy.code?.text || "N/A",
		},
		{
			field: "display",
			headerName: "Name",
			render: (allergy) =>
				allergy.code?.coding?.[0]?.display || allergy.code?.text || "N/A",
		},
		{ field: "description", headerName: "Description" },
		{
			field: "category",
			headerName: "Category",
			render: (allergy) => {
				const category = allergy.category?.[0] || allergy.category;
				const categoryOption = categoryOptions.find(
					(c) => c.value === category
				);
				return categoryOption ? categoryOption.label : category || "Other";
			},
		},
		{
			field: "severity",
			headerName: "Default Severity",
			type: "status",
			statusColors: {
				mild: "success",
				moderate: "warning",
				severe: "error",
			},
			render: (allergy) => {
				const severity = severityOptions.find(
					(s) => s.value === allergy.severity
				);
				return severity ? severity.label : allergy.severity || "Mild";
			},
		},
		{ field: "createdAt", headerName: "Created", type: "date" },
	];
	const fetchAllergies = useCallback(async () => {
		try {
			setLoading(true);
			const response = await allergyService.getAllergyCatalog();
			setAllergies(response.allergies || response.data || response || []);
		} catch (error) {
			console.error("Error fetching allergies:", error);
			showNotification("Error fetching allergies", "error");
		} finally {
			setLoading(false);
		}
	}, [showNotification]);

	useEffect(() => {
		fetchAllergies();
	}, [fetchAllergies]);
	const handleSubmit = async () => {
		try {
			const submitData = {
				code: {
					coding: [
						{
							system: "http://snomed.info/sct",
							code: formData.code,
							display: formData.display,
						},
					],
					text: formData.display,
				},
				category: formData.category ? [formData.category] : ["other"],
				description: formData.definition,
				severity: formData.severity,
				status: "active",
				type: "allergy",
				verificationStatus: "confirmed",
			};

			if (selectedAllergy) {
				await allergyService.updateAllergy(selectedAllergy._id, submitData);
				showNotification("Allergy updated successfully", "success");
			} else {
				await allergyService.createAllergy(submitData);
				showNotification("Allergy created successfully", "success");
			}
			await fetchAllergies();
			handleCloseDialog();
		} catch (error) {
			console.error("Error saving allergy:", error);
			showNotification(
				error.response?.data?.message || "Error saving allergy",
				"error"
			);
		}
	};
	const handleEdit = (allergy) => {
		setSelectedAllergy(allergy);
		setFormData({
			code: allergy.code?.coding?.[0]?.code || "",
			display: allergy.code?.coding?.[0]?.display || allergy.code?.text || "",
			definition: allergy.description || "",
			category: allergy.category?.[0] || allergy.category || "",
			severity: allergy.severity || "mild",
		});
		setOpenDialog(true);
	};

	const handleDelete = (allergy) => {
		setSelectedAllergy(allergy);
		setOpenConfirmDelete(true);
	};

	const confirmDelete = async () => {
		try {
			await allergyService.deleteAllergy(selectedAllergy._id);
			showNotification("Allergy deleted successfully", "success");
			await fetchAllergies();
			setOpenConfirmDelete(false);
			setSelectedAllergy(null);
		} catch (error) {
			console.error("Error deleting allergy:", error);
			showNotification(
				error.response?.data?.message || "Error deleting allergy",
				"error"
			);
		}
	};

	const handleCloseDialog = () => {
		setOpenDialog(false);
		setSelectedAllergy(null);
		setFormData({
			code: "",
			display: "",
			definition: "",
			category: "",
			severity: "mild",
		});
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<Box>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				mb={3}
			>
				<div>
					<Typography variant="h4" gutterBottom>
						Allergies Catalog
					</Typography>
					<Typography variant="body1" color="text.secondary">
						Manage allergens and allergic reactions database
					</Typography>
				</div>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={() => setOpenDialog(true)}
				>
					Add Allergy
				</Button>
			</Box>

			<DataTable
				data={allergies}
				columns={columns}
				loading={loading}
				onEdit={handleEdit}
				onDelete={handleDelete}
			/>

			<Dialog
				open={openDialog}
				onClose={handleCloseDialog}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>
					{selectedAllergy ? "Edit Allergy" : "Add New Allergy"}
				</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								label="Code"
								name="code"
								value={formData.code}
								onChange={handleInputChange}
								required
								helperText="SNOMED CT code or internal allergy code"
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<FormControl fullWidth>
								<InputLabel>Category</InputLabel>
								<Select
									name="category"
									value={formData.category}
									onChange={handleInputChange}
									label="Category"
								>
									{categoryOptions.map((option) => (
										<MenuItem key={option.value} value={option.value}>
											{option.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Allergen Name"
								name="display"
								value={formData.display}
								onChange={handleInputChange}
								required
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Description"
								name="definition"
								value={formData.definition}
								onChange={handleInputChange}
								multiline
								rows={3}
								helperText="Detailed description of the allergen and typical reactions"
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<FormControl fullWidth>
								<InputLabel>Default Severity</InputLabel>
								<Select
									name="severity"
									value={formData.severity}
									onChange={handleInputChange}
									label="Default Severity"
								>
									{severityOptions.map((option) => (
										<MenuItem key={option.value} value={option.value}>
											{option.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseDialog}>Cancel</Button>
					<Button
						onClick={handleSubmit}
						variant="contained"
						disabled={!formData.code || !formData.display}
					>
						{selectedAllergy ? "Update" : "Create"}
					</Button>
				</DialogActions>
			</Dialog>

			<ConfirmDialog
				open={openConfirmDelete}
				onClose={() => setOpenConfirmDelete(false)}
				onConfirm={confirmDelete}
				title="Delete Allergy"
				message={`Are you sure you want to delete the allergy "${selectedAllergy?.display}"? This action cannot be undone.`}
			/>
		</Box>
	);
};

export default AllergiesManagement;
