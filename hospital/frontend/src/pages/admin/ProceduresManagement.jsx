import { Add as AddIcon } from "@mui/icons-material";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	TextField,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as procedureService from "../../api/services";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useNotification } from "../../contexts/NotificationContext";

const ProceduresManagement = () => {
	const [procedures, setProcedures] = useState([]);
	const [loading, setLoading] = useState(true);
	const [openDialog, setOpenDialog] = useState(false);
	const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
	const [selectedProcedure, setSelectedProcedure] = useState(null);
	const [formData, setFormData] = useState({
		code: "",
		display: "",
		definition: "",
		category: "",
		price: "",
	});
	const { showNotification } = useNotification();
	const columns = [
		{
			field: "code",
			headerName: "Code",
			render: (procedure) =>
				procedure.code?.coding?.[0]?.code || procedure.code?.text || "N/A",
		},
		{
			field: "display",
			headerName: "Name",
			render: (procedure) =>
				procedure.code?.coding?.[0]?.display || procedure.code?.text || "N/A",
		},
		{ field: "description", headerName: "Description" },
		{
			field: "category",
			headerName: "Category",
			render: (procedure) => procedure.category?.coding?.[0]?.display || "N/A",
		},
		{
			field: "price",
			headerName: "Price",
			render: (procedure) =>
				procedure.cost?.estimated ? `$${procedure.cost.estimated}` : "N/A",
		},
		{ field: "createdAt", headerName: "Created", type: "date" },
	];
	const fetchProcedures = useCallback(async () => {
		try {
			setLoading(true);
			const response = await procedureService.getProcedureCatalog();
			setProcedures(response.procedures || response.data || response || []);
		} catch (error) {
			console.error("Error fetching procedures:", error);
			showNotification("Error fetching procedures", "error");
		} finally {
			setLoading(false);
		}
	}, [showNotification]);

	useEffect(() => {
		fetchProcedures();
	}, [fetchProcedures]);
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
				category: formData.category
					? {
							coding: [
								{
									system: "http://snomed.info/sct",
									code: formData.category,
									display: formData.category,
								},
							],
					  }
					: undefined,
				description: formData.definition,
				status: "active",
				cost: formData.price
					? {
							estimated: parseFloat(formData.price),
							currency: "EUR",
					  }
					: undefined,
			};

			Object.keys(submitData).forEach(
				(key) => submitData[key] === undefined && delete submitData[key]
			);

			if (selectedProcedure) {
				await procedureService.updateProcedure(
					selectedProcedure._id,
					submitData
				);
				showNotification("Procedure updated successfully", "success");
			} else {
				await procedureService.createProcedure(submitData);
				showNotification("Procedure created successfully", "success");
			}
			await fetchProcedures();
			handleCloseDialog();
		} catch (error) {
			console.error("Error saving procedure:", error);
			showNotification(
				error.response?.data?.message || "Error saving procedure",
				"error"
			);
		}
	};
	const handleEdit = (procedure) => {
		setSelectedProcedure(procedure);
		setFormData({
			code: procedure.code?.coding?.[0]?.code || "",
			display:
				procedure.code?.coding?.[0]?.display || procedure.code?.text || "",
			definition: procedure.description || "",
			category: procedure.category?.coding?.[0]?.display || "",
			price: procedure.cost?.estimated
				? procedure.cost.estimated.toString()
				: "",
		});
		setOpenDialog(true);
	};

	const handleDelete = (procedure) => {
		setSelectedProcedure(procedure);
		setOpenConfirmDelete(true);
	};

	const confirmDelete = async () => {
		try {
			await procedureService.deleteProcedure(selectedProcedure._id);
			showNotification("Procedure deleted successfully", "success");
			await fetchProcedures();
			setOpenConfirmDelete(false);
			setSelectedProcedure(null);
		} catch (error) {
			console.error("Error deleting procedure:", error);
			showNotification(
				error.response?.data?.message || "Error deleting procedure",
				"error"
			);
		}
	};

	const handleCloseDialog = () => {
		setOpenDialog(false);
		setSelectedProcedure(null);
		setFormData({
			code: "",
			display: "",
			definition: "",
			category: "",
			price: "",
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
						Procedures Catalog
					</Typography>
					<Typography variant="body1" color="text.secondary">
						Manage medical procedures and treatments
					</Typography>
				</div>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={() => setOpenDialog(true)}
				>
					Add Procedure
				</Button>
			</Box>

			<DataTable
				data={procedures}
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
					{selectedProcedure ? "Edit Procedure" : "Add New Procedure"}
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
								helperText="ADA code or internal procedure code"
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								label="Category"
								name="category"
								value={formData.category}
								onChange={handleInputChange}
								helperText="e.g., Preventive, Restorative, Surgery"
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Procedure Name"
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
								helperText="Detailed description of the procedure"
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								label="Price ($)"
								name="price"
								type="number"
								value={formData.price}
								onChange={handleInputChange}
								inputProps={{ min: 0, step: 0.01 }}
								helperText="Optional pricing information"
							/>
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
						{selectedProcedure ? "Update" : "Create"}
					</Button>
				</DialogActions>
			</Dialog>

			<ConfirmDialog
				open={openConfirmDelete}
				onClose={() => setOpenConfirmDelete(false)}
				onConfirm={confirmDelete}
				title="Delete Procedure"
				message={`Are you sure you want to delete the procedure "${selectedProcedure?.display}"? This action cannot be undone.`}
			/>
		</Box>
	);
};

export default ProceduresManagement;
