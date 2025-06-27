import {
	CheckCircle as CheckCircleIcon,
	CloudDownload as CloudDownloadIcon,
	GetApp as ImportIcon,
	Info as InfoIcon,
	Security as SecurityIcon,
} from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Grid,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Step,
	StepLabel,
	Stepper,
	TextField,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { solidService } from "../../api/services";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useNotification } from "../../contexts/NotificationContext";

const DataImport = () => {
	const [loading, setLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [solidProvider, setSolidProvider] = useState("");
	const [checkingAuth, setCheckingAuth] = useState(true);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [formData, setFormData] = useState({
		dataRoute: "dental-clinic/data.ttl",
		shapeRoute: "dental-clinic/shapes.shex",
		shapeMapRoute: "dental-clinic/shape-map.sm",
	});

	const { showNotification } = useNotification();

	useEffect(() => {
		checkSolidLoginStatus();
	}, []);

	const checkSolidLoginStatus = async () => {
		setCheckingAuth(true);
		try {
			const response = await solidService.isLoggedIn();
			setIsLoggedIn(response.isLoggedIn);
			setCurrentStep(response.isLoggedIn ? 1 : 0);
		} catch (error) {
			console.error("Error checking Solid login status:", error);
			setCurrentStep(0);
			setIsLoggedIn(false);
		} finally {
			setCheckingAuth(false);
		}
	};

	const handleSolidLogin = async (providerUrl = null) => {
		const urlToUse = providerUrl || solidProvider;
		if (!urlToUse) {
			showNotification("Please enter your Solid provider URL", "error");
			return;
		}

		try {
			let finalUrl = urlToUse;
			if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
				finalUrl = `https://${finalUrl}`;
			}

			await solidService.login(finalUrl);
		} catch (error) {
			showNotification(`Connection failed: ${error.message}`, "error");
		}
	};

	const handleDataImport = async () => {
		setLoading(true);
		try {
			await solidService.importUserData({
				routeDataset: formData.dataRoute,
				routeShape: formData.shapeRoute,
				routeShapeMap: formData.shapeMapRoute,
			});

			setCurrentStep(2);
			showNotification(
				"Your data has been successfully imported from your Solid pod",
				"success"
			);
		} catch (error) {
			showNotification(`Import failed: ${error.message}`, "error");
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const steps = ["Connect to Solid Pod", "Configure Import", "Import Complete"];

	if (checkingAuth) {
		return <LoadingSpinner />;
	}

	return (
		<Box sx={{ maxWidth: 1200, margin: "0 auto", padding: 3 }}>
			<Box sx={{ mb: 4 }}>
				<Typography
					variant="h4"
					gutterBottom
					sx={{ display: "flex", alignItems: "center" }}
				>
					<ImportIcon sx={{ mr: 1 }} />
					Import Data from Solid Pod
				</Typography>
				<Typography variant="body1" color="text.secondary" paragraph>
					Securely import your hospital medical data from your personal Solid
					pod. Your data remains under your control while being integrated into
					the hospital management system.
				</Typography>
			</Box>

			<Stepper activeStep={currentStep} sx={{ mb: 4 }}>
				{steps.map((label, index) => (
					<Step key={label}>
						<StepLabel
							StepIconComponent={() =>
								index === 0 && isLoggedIn ? (
									<CheckCircleIcon color="success" />
								) : (
									<Box
										sx={{
											width: 24,
											height: 24,
											borderRadius: "50%",
											backgroundColor:
												index <= currentStep ? "primary.main" : "grey.300",
											color: "white",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: "0.75rem",
										}}
									>
										{index + 1}
									</Box>
								)
							}
						>
							{label}
						</StepLabel>
					</Step>
				))}
			</Stepper>

			{currentStep === 0 && (
				<Card>
					<CardContent>
						<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
							<SecurityIcon sx={{ mr: 1 }} />
							<Typography variant="h6">Connect to Solid Pod</Typography>
						</Box>

						<Alert severity="info" sx={{ mb: 3 }}>
							Connect to your Solid pod to securely import your hospital data.
							Your personal data will be retrieved from your pod and integrated
							into the system.
						</Alert>

						<Grid container spacing={3}>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label="Solid Provider URL"
									placeholder="solidcommunity.net or solidweb.org"
									value={solidProvider}
									onChange={(e) => setSolidProvider(e.target.value)}
									helperText="Or click on a popular provider below to connect directly"
								/>
							</Grid>

							<Grid item xs={12}>
								<Typography variant="subtitle2" gutterBottom>
									Popular SOLID Providers:
								</Typography>
								<Grid container spacing={1}>
									<Grid item xs={6}>
										<Button
											variant="contained"
											fullWidth
											size="small"
											onClick={() =>
												handleSolidLogin("https://solidcommunity.net/")
											}
											disabled={loading}
											sx={{
												backgroundColor: "#1976d2",
												"&:hover": { backgroundColor: "#1565c0" },
												height: "auto",
												py: 1.5,
												textTransform: "none",
											}}
										>
											<Box sx={{ textAlign: "center" }}>
												<Typography
													variant="body2"
													sx={{ fontWeight: "bold", lineHeight: 1.2 }}
												>
													Solid Community
												</Typography>
												<Typography
													variant="caption"
													sx={{ opacity: 0.8, display: "block", mt: 0.25 }}
												>
													solidcommunity.net
												</Typography>
											</Box>
										</Button>
									</Grid>
									<Grid item xs={6}>
										<Button
											variant="contained"
											fullWidth
											size="small"
											onClick={() => handleSolidLogin("https://solidweb.org/")}
											disabled={loading}
											sx={{
												backgroundColor: "#2e7d32",
												"&:hover": { backgroundColor: "#1b5e20" },
												height: "auto",
												py: 1.5,
												textTransform: "none",
											}}
										>
											<Box sx={{ textAlign: "center" }}>
												<Typography
													variant="body2"
													sx={{ fontWeight: "bold", lineHeight: 1.2 }}
												>
													Solid Web
												</Typography>
												<Typography
													variant="caption"
													sx={{ opacity: 0.8, display: "block", mt: 0.25 }}
												>
													solidweb.org
												</Typography>
											</Box>
										</Button>
									</Grid>
								</Grid>
							</Grid>

							<Grid item xs={12}>
								<Button
									variant="contained"
									size="large"
									startIcon={<CloudDownloadIcon />}
									onClick={handleSolidLogin}
									disabled={loading}
									fullWidth
								>
									Connect to Solid Pod
								</Button>
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ mt: 1, textAlign: "center" }}
								>
									You will be redirected to your Solid provider to authenticate
								</Typography>
							</Grid>
						</Grid>
					</CardContent>
				</Card>
			)}

			{currentStep === 1 && (
				<Card>
					<CardContent>
						<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
							<ImportIcon sx={{ mr: 1 }} />
							<Typography variant="h6">Configure Data Import</Typography>
						</Box>

						<Alert severity="info" sx={{ mb: 3 }}>
							Specify the paths in your Solid pod where your exported data,
							shapes, and shape maps are located. The system will retrieve and
							import this data into your current session.
						</Alert>

						<Grid container spacing={3}>
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Data Source Route"
									value={formData.dataRoute}
									onChange={(e) =>
										handleInputChange("dataRoute", e.target.value)
									}
									helperText="Path in your Solid pod where the medical data is stored"
									required
								/>
							</Grid>
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Shape Route"
									value={formData.shapeRoute}
									onChange={(e) =>
										handleInputChange("shapeRoute", e.target.value)
									}
									helperText="Path where the ShEx shape schema is stored for data validation"
									required
								/>
							</Grid>
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Shape Map Route"
									value={formData.shapeMapRoute}
									onChange={(e) =>
										handleInputChange("shapeMapRoute", e.target.value)
									}
									helperText="Path where the shape map is stored to link data with validation rules"
									required
								/>
							</Grid>
							<Grid item xs={12} md={6}>
								<Alert severity="warning" icon={<InfoIcon />}>
									<Typography variant="subtitle2" gutterBottom>
										Import Information
									</Typography>
									<Typography variant="body2" component="div">
										The import process will:
										<List dense>
											<ListItem sx={{ py: 0 }}>
												<ListItemIcon sx={{ minWidth: 20 }}>•</ListItemIcon>
												<ListItemText primary="Retrieve data, shapes, and shape maps from your Solid pod" />
											</ListItem>
											<ListItem sx={{ py: 0 }}>
												<ListItemIcon sx={{ minWidth: 20 }}>•</ListItemIcon>
												<ListItemText primary="Validate the data format and structure using the shapes" />
											</ListItem>
											<ListItem sx={{ py: 0 }}>
												<ListItemIcon sx={{ minWidth: 20 }}>•</ListItemIcon>
												<ListItemText primary="Import compatible data into the current system" />
											</ListItem>
											<ListItem sx={{ py: 0 }}>
												<ListItemIcon sx={{ minWidth: 20 }}>•</ListItemIcon>
												<ListItemText primary="Provide a summary of imported records" />
											</ListItem>
										</List>
									</Typography>
								</Alert>
							</Grid>
							<Grid item xs={12}>
								<Button
									variant="contained"
									size="large"
									startIcon={<ImportIcon />}
									onClick={handleDataImport}
									disabled={loading}
									fullWidth
								>
									{loading ? "Importing..." : "Import Data from Solid Pod"}
								</Button>
							</Grid>
						</Grid>
					</CardContent>
				</Card>
			)}

			{currentStep === 2 && (
				<Card>
					<CardContent>
						<Box sx={{ textAlign: "center", mb: 3 }}>
							<CheckCircleIcon
								sx={{ fontSize: 64, color: "success.main", mb: 2 }}
							/>
							<Typography variant="h5" gutterBottom>
								Data Successfully Imported!
							</Typography>
							<Typography variant="body1" color="text.secondary">
								Your data has been securely imported from your Solid pod and is
								now available in the system.
							</Typography>
						</Box>

						<Box sx={{ mt: 3, textAlign: "center" }}>
							<Button variant="outlined" onClick={() => setCurrentStep(1)}>
								Import More Data
							</Button>
						</Box>
					</CardContent>
				</Card>
			)}
		</Box>
	);
};

export default DataImport;
