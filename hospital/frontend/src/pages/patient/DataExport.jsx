import {
	CheckCircle as CheckCircleIcon,
	CloudUpload as CloudUploadIcon,
	Download as DownloadIcon,
	Description as FileTextIcon,
	Security as SecurityIcon,
} from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Grid,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Paper,
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

const DataExport = () => {
	const [loading, setLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [exportResult, setExportResult] = useState(null);
	const [solidProvider, setSolidProvider] = useState("");
	const [checkingAuth, setCheckingAuth] = useState(true);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [formData, setFormData] = useState({
		dataRoute: "hospital/data.ttl",
		shapeRoute: "hospital/shapes.shex",
		shapeMapRoute: "hospital/shape-map.sm",
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

	const handleDataExport = async () => {
		setLoading(true);
		try {
			const result = await solidService.exportUserData({
				routeDataset: formData.dataRoute,
				routeShape: formData.shapeRoute,
				routeShapeMap: formData.shapeMapRoute,
			});

			setExportResult(result);
			setCurrentStep(2);
			showNotification(
				"Your data has been successfully exported to your Solid pod",
				"success"
			);
		} catch (error) {
			showNotification(`Export failed: ${error.message}`, "error");
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

	const steps = ["Connect to Solid Pod", "Configure Export", "Export Complete"];

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
					<CloudUploadIcon sx={{ mr: 1 }} />
					Export Data to Solid Pod
				</Typography>
				<Typography variant="body1" color="text.secondary" paragraph>
					Securely export your hospital medical data to your personal Solid pod.
					This includes your medical records, appointment history, and all
					associated metadata in a standardized, interoperable format that you
					control.
				</Typography>
				<Alert severity="info" sx={{ mt: 2 }}>
					<Typography variant="subtitle2" gutterBottom>
						Data Sovereignty
					</Typography>
					By exporting to Solid, you maintain complete control over your
					healthcare data. You can share it with healthcare providers,
					researchers, or applications of your choice.
				</Alert>
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
							Connect to your Solid pod to securely export your hospital data.
							Your data will be stored in your personal data pod under your
							complete control.
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
									startIcon={<CloudUploadIcon />}
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
							<FileTextIcon sx={{ mr: 1 }} />
							<Typography variant="h6">Configure Data Export</Typography>
						</Box>

						<Alert severity="info" sx={{ mb: 3 }}>
							Specify where in your Solid pod you want to store your data,
							shapes, and shape maps. All paths are relative to your pod root.
						</Alert>

						<Grid container spacing={3}>
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Data Storage Route"
									value={formData.dataRoute}
									onChange={(e) =>
										handleInputChange("dataRoute", e.target.value)
									}
									helperText="Path in your Solid pod where the exported medical data will be stored"
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
									helperText="Path where the ShEx shape schema will be stored for data validation"
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
									helperText="Path where the shape map will be stored to link data with validation rules"
									required
								/>
							</Grid>
							<Grid item xs={12}>
								<Button
									variant="contained"
									size="large"
									startIcon={<DownloadIcon />}
									onClick={handleDataExport}
									disabled={loading}
								>
									{loading ? "Exporting..." : "Export Data to Solid Pod"}
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
								Data Export Completed Successfully!
							</Typography>
							<Typography variant="body1" color="text.secondary">
								{exportResult
									? `Your hospital medical data has been securely exported to your Solid pod. ${
											exportResult.filesCreated
									  } file${
											exportResult.filesCreated > 1 ? "s were" : " was"
									  } created.`
									: "Your hospital medical data has been securely exported to your Solid pod."}
							</Typography>
						</Box>

						{exportResult && (
							<Paper sx={{ p: 3, mt: 3 }}>
								<Typography
									variant="h6"
									gutterBottom
									sx={{ display: "flex", alignItems: "center" }}
								>
									<FileTextIcon sx={{ mr: 1 }} />
									Exported Files:
								</Typography>
								<List>
									<ListItem>
										<ListItemIcon>
											<Chip label="RDF" size="small" color="primary" />
										</ListItemIcon>
										<ListItemText
											primary={exportResult.dataFile}
											secondary="Your medical data in RDF format"
										/>
									</ListItem>
									<ListItem>
										<ListItemIcon>
											<Chip label="ShEx" size="small" color="secondary" />
										</ListItemIcon>
										<ListItemText
											primary={exportResult.shapeFile}
											secondary="Data validation schema (ShEx)"
										/>
									</ListItem>
									<ListItem>
										<ListItemIcon>
											<Chip label="SM" size="small" color="success" />
										</ListItemIcon>
										<ListItemText
											primary={exportResult.shapeMapFile}
											secondary="Shape mapping rules"
										/>
									</ListItem>
								</List>
								<Alert severity="success" sx={{ mt: 2 }}>
									Your data is now available in your Solid pod. You can access
									and manage your exported data using any Solid-compatible
									application or pod browser.
								</Alert>
							</Paper>
						)}

						<Box sx={{ mt: 3, textAlign: "center" }}>
							<Button
								variant="outlined"
								onClick={() => {
									setCurrentStep(1);
									setExportResult(null);
								}}
							>
								Export Again
							</Button>
						</Box>
					</CardContent>
				</Card>
			)}
		</Box>
	);
};

export default DataExport;
