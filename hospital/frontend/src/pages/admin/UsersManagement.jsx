import { Add as AddIcon } from "@mui/icons-material";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	MenuItem,
	TextField,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as userService from "../../api/services";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useNotification } from "../../contexts/NotificationContext";

const UsersManagement = () => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [openDialog, setOpenDialog] = useState(false);
	const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		role: "patient",
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
			field: "username",
			headerName: "Name",
			render: (user) => {
				return `${user.profile?.firstName} ${user.profile?.lastName}`;
			},
		},
		{ field: "email", headerName: "Email" },
		{
			field: "role",
			headerName: "Role",
			type: "status",
			statusColors: {
				administrator: "error",
				doctor: "warning",
				patient: "success",
			},
		},
		{ field: "createdAt", headerName: "Created", type: "date" },
	];
	const fetchUsers = useCallback(async () => {
		try {
			setLoading(true);
			const response = await userService.getUsers();
			setUsers(response.users || []);
		} catch (error) {
			console.error("Error fetching users:", error);
			showNotification("Error fetching users", "error");
		} finally {
			setLoading(false);
		}
	}, [showNotification]);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const handleSubmit = async () => {
		try {
			if (selectedUser) {
				await userService.updateUser(selectedUser._id, formData);
				showNotification("User updated successfully", "success");
			} else {
				await userService.createUser(formData);
				showNotification("User created successfully", "success");
			}
			setOpenDialog(false);
			fetchUsers();
		} catch (error) {
			showNotification(
				error.response?.data?.message || "Error saving user",
				"error"
			);
		}
	};

	const handleEdit = (user) => {
		setSelectedUser(user);
		setFormData({
			email: user.email,
			role: user.role,
			password: "",
			firstName: user.profile?.firstName || "",
			lastName: user.profile?.lastName || "",
		});
		setOpenDialog(true);
	};

	const handleDelete = async () => {
		try {
			await userService.deleteUser(selectedUser._id);
			showNotification("User deleted successfully", "success");
			setOpenConfirmDelete(false);
			fetchUsers();
		} catch (error) {
			console.error("Error deleting user:", error);
			showNotification("Error deleting user", "error");
		}
	};

	const handleCreate = () => {
		setSelectedUser(null);
		setFormData({
			username: "",
			email: "",
			password: "",
			role: "patient",
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
		setOpenDialog(true);
	};

	if (loading) {
		return <LoadingSpinner message="Loading users..." />;
	}

	return (
		<Box>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				mb={3}
			>
				<Typography variant="h4">Users Management</Typography>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={handleCreate}
				>
					Create User
				</Button>
			</Box>

			<DataTable
				data={users}
				columns={columns}
				onEdit={handleEdit}
				onDelete={(user) => {
					setSelectedUser(user);
					setOpenConfirmDelete(true);
				}}
				totalCount={users.length}
			/>

			<Dialog
				open={openDialog}
				onClose={() => setOpenDialog(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>{selectedUser ? "Edit User" : "Create User"}</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								label="Email"
								type="email"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								label="Password"
								type="password"
								value={formData.password}
								onChange={(e) =>
									setFormData({ ...formData, password: e.target.value })
								}
								helperText={
									selectedUser ? "Leave empty to keep current password" : ""
								}
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								select
								label="Role"
								value={formData.role}
								onChange={(e) =>
									setFormData({ ...formData, role: e.target.value })
								}
							>
								<MenuItem value="administrator">Administrator</MenuItem>
								<MenuItem value="doctor">Doctor</MenuItem>
								<MenuItem value="patient">Patient</MenuItem>
							</TextField>
						</Grid>

						{(formData.role === "patient" || formData.role === "doctor") && (
							<>
								<Grid item xs={12} sm={6}>
									<TextField
										fullWidth
										label="First Name"
										value={formData.firstName}
										onChange={(e) =>
											setFormData({ ...formData, firstName: e.target.value })
										}
									/>
								</Grid>
								<Grid item xs={12} sm={6}>
									<TextField
										fullWidth
										label="Last Name"
										value={formData.lastName}
										onChange={(e) =>
											setFormData({ ...formData, lastName: e.target.value })
										}
									/>
								</Grid>
								<Grid item xs={12} sm={6}>
									<TextField
										fullWidth
										label="Date of Birth"
										type="date"
										InputLabelProps={{ shrink: true }}
										value={formData.dateOfBirth}
										onChange={(e) =>
											setFormData({ ...formData, dateOfBirth: e.target.value })
										}
									/>
								</Grid>
								<Grid item xs={12} sm={6}>
									<TextField
										fullWidth
										select
										label="Gender"
										value={formData.gender}
										onChange={(e) =>
											setFormData({ ...formData, gender: e.target.value })
										}
									>
										<MenuItem value="male">Male</MenuItem>
										<MenuItem value="female">Female</MenuItem>
										<MenuItem value="other">Other</MenuItem>
									</TextField>
								</Grid>
								<Grid item xs={12} sm={6}>
									<TextField
										fullWidth
										label="Phone"
										value={formData.phone}
										onChange={(e) =>
											setFormData({ ...formData, phone: e.target.value })
										}
									/>
								</Grid>
								<Grid item xs={12} sm={6}>
									<TextField
										fullWidth
										label="Address"
										value={formData.address}
										onChange={(e) =>
											setFormData({ ...formData, address: e.target.value })
										}
									/>
								</Grid>
							</>
						)}

						{formData.role === "doctor" && (
							<>
								<Grid item xs={12} sm={6}>
									<TextField
										fullWidth
										label="Specialization"
										value={formData.specialization}
										onChange={(e) =>
											setFormData({
												...formData,
												specialization: e.target.value,
											})
										}
									/>
								</Grid>
								<Grid item xs={12} sm={6}>
									<TextField
										fullWidth
										label="License Number"
										value={formData.licenseNumber}
										onChange={(e) =>
											setFormData({
												...formData,
												licenseNumber: e.target.value,
											})
										}
									/>
								</Grid>
							</>
						)}
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenDialog(false)}>Cancel</Button>
					<Button onClick={handleSubmit} variant="contained">
						{selectedUser ? "Update" : "Create"}
					</Button>
				</DialogActions>
			</Dialog>

			<ConfirmDialog
				open={openConfirmDelete}
				title="Delete User"
				message={`Are you sure you want to delete user "${selectedUser?.username}"?`}
				onConfirm={handleDelete}
				onCancel={() => setOpenConfirmDelete(false)}
				confirmText="Delete"
				confirmColor="error"
			/>
		</Box>
	);
};

export default UsersManagement;
