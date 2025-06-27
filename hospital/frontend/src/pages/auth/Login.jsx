import {
	Email,
	LocalHospital,
	Lock,
	Visibility,
	VisibilityOff,
} from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Container,
	Divider,
	IconButton,
	InputAdornment,
	Link,
	Paper,
	TextField,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";

const Login = () => {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState({});

	const { login, isAuthenticated, loading, error, clearError } = useAuth();
	const { showError, showSuccess } = useNotification();
	const navigate = useNavigate();
	const location = useLocation();

	const from = location.state?.from?.pathname || "/dashboard";

	useEffect(() => {
		if (isAuthenticated) {
			navigate(from, { replace: true });
		}
	}, [isAuthenticated, navigate, from]);

	useEffect(() => {
		if (error) {
			showError(error);
			clearError();
		}
	}, [error, showError, clearError]);

	const validateForm = () => {
		const newErrors = {};

		if (!formData.email.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Email is invalid";
		}

		if (!formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: "",
			}));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		const result = await login(formData);

		if (result.success) {
			showSuccess(`Welcome back, ${result.user.name}!`);
			navigate(from, { replace: true });
		}
	};

	const handleClickShowPassword = () => {
		setShowPassword(!showPassword);
	};
	const demoCredentials = [
		{
			role: "administrator",
			email: "admin@hospital.com",
			password: "password",
		},
		{ role: "doctor", email: "doctor1@hospital.com", password: "password" },
		{ role: "patient", email: "patient1@hospital.com", password: "password" },
		{
			role: "patient (dental clinic) 1",
			email: "carlos@example.com",
			password: "password",
		},
		{
			role: "patient (dental clinic) 2",
			email: "maria@example.com",
			password: "password",
		},
	];

	const fillDemoCredentials = (credentials) => {
		setFormData({
			email: credentials.email,
			password: credentials.password,
		});
		setErrors({});
	};

	return (
		<Container component="main" maxWidth="sm">
			<Box
				sx={{
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					py: 4,
				}}
			>
				<Paper
					elevation={8}
					sx={{
						p: 4,
						borderRadius: 2,
						background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
						color: "white",
					}}
				>
					<Box sx={{ textAlign: "center", mb: 4 }}>
						<LocalHospital sx={{ fontSize: 60, mb: 2 }} />
						<Typography variant="h4" component="h1" gutterBottom>
							MediCare Hospital
						</Typography>
						<Typography variant="body1" sx={{ opacity: 0.9 }}>
							Comprehensive Healthcare Management System
						</Typography>
					</Box>

					<Card>
						<CardContent sx={{ p: 4 }}>
							<Typography
								variant="h5"
								component="h2"
								gutterBottom
								textAlign="center"
							>
								Sign In
							</Typography>

							<Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
								<TextField
									margin="normal"
									required
									fullWidth
									id="email"
									label="Email Address"
									name="email"
									autoComplete="email"
									autoFocus
									value={formData.email}
									onChange={handleChange}
									error={!!errors.email}
									helperText={errors.email}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<Email />
											</InputAdornment>
										),
									}}
								/>

								<TextField
									margin="normal"
									required
									fullWidth
									name="password"
									label="Password"
									type={showPassword ? "text" : "password"}
									id="password"
									autoComplete="current-password"
									value={formData.password}
									onChange={handleChange}
									error={!!errors.password}
									helperText={errors.password}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<Lock />
											</InputAdornment>
										),
										endAdornment: (
											<InputAdornment position="end">
												<IconButton
													aria-label="toggle password visibility"
													onClick={handleClickShowPassword}
													edge="end"
												>
													{showPassword ? <VisibilityOff /> : <Visibility />}
												</IconButton>
											</InputAdornment>
										),
									}}
								/>

								<Button
									type="submit"
									fullWidth
									variant="contained"
									sx={{ mt: 3, mb: 2, py: 1.5 }}
									disabled={loading}
								>
									{loading ? "Signing In..." : "Sign In"}
								</Button>

								<Box sx={{ textAlign: "center" }}>
									<Link href="#" variant="body2">
										Forgot password?
									</Link>
								</Box>
							</Box>

							<Divider sx={{ my: 3 }}>
								<Typography variant="body2" color="textSecondary">
									Demo Accounts
								</Typography>
							</Divider>

							<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
								{demoCredentials.map((cred) => (
									<Button
										key={cred.role}
										variant="outlined"
										size="small"
										onClick={() => fillDemoCredentials(cred)}
										sx={{ textTransform: "none" }}
									>
										Demo {cred.role} ({cred.email})
									</Button>
								))}
							</Box>

							<Alert severity="info" sx={{ mt: 2 }}>
								<Typography variant="body2">
									<strong>Demo Mode:</strong> Click any demo account button
									above to auto-fill credentials.
								</Typography>
							</Alert>
						</CardContent>
					</Card>
				</Paper>
			</Box>
		</Container>
	);
};

export default Login;
