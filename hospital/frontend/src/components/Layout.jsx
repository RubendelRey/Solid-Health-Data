import {
	AccountCircle,
	Assessment,
	CloudDownload,
	CloudUpload,
	Dashboard,
	Event,
	FileDownload,
	Healing,
	LocalHospital,
	Logout,
	MedicalServices,
	Menu as MenuIcon,
	People,
	Storage,
} from "@mui/icons-material";
import {
	AppBar,
	Avatar,
	Box,
	CssBaseline,
	Divider,
	Drawer,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Toolbar,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";

const drawerWidth = 280;

const Layout = ({ children }) => {
	const [mobileOpen, setMobileOpen] = useState(false);
	const [anchorEl, setAnchorEl] = useState(null);
	const navigate = useNavigate();
	const location = useLocation();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const { user, logout } = useAuth();
	const { showSuccess } = useNotification();

	const handleDrawerToggle = () => {
		setMobileOpen(!mobileOpen);
	};

	const handleProfileMenuOpen = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleProfileMenuClose = () => {
		setAnchorEl(null);
	};

	const handleLogout = () => {
		logout();
		showSuccess("Logged out successfully");
		navigate("/login");
		handleProfileMenuClose();
	};

	const getNavigationItems = () => {
		const baseItems = [
			{ text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
		];
		switch (user?.role) {
			case "administrator":
				return [
					...baseItems,
					{ text: "Users", icon: <AccountCircle />, path: "/admin/users" },
					{ text: "Patients", icon: <People />, path: "/admin/patients" },
					{ text: "Doctors", icon: <LocalHospital />, path: "/admin/doctors" },
					{
						text: "Appointments",
						icon: <Event />,
						path: "/admin/appointments",
					},
					{
						text: "Procedures",
						icon: <MedicalServices />,
						path: "/admin/procedures",
					},
					{ text: "Allergies", icon: <Healing />, path: "/admin/allergies" },
					{
						text: "Bulk Export",
						icon: <FileDownload />,
						path: "/admin/bulk-export",
					},
					{
						text: "Load Test Results",
						icon: <Assessment />,
						path: "/admin/load-test-results",
					},
				];

			case "doctor":
				return [
					...baseItems,
					{ text: "My Patients", icon: <People />, path: "/doctor/patients" },
					{
						text: "My Schedule",
						icon: <Event />,
						path: "/doctor/schedule",
					},
					{
						text: "Procedures",
						icon: <MedicalServices />,
						path: "/doctor/procedures",
					}
				];
			case "patient":
				return [
					...baseItems,
					{
						text: "Medical Records",
						icon: <LocalHospital />,
						path: "/patient/medical-records",
					},
					{
						text: "My Appointments",
						icon: <Event />,
						path: "/patient/appointments",
					},
					{
						text: "Export Data",
						icon: <CloudUpload />,
						path: "/patient/data-export",
					},
					{
						text: "Import Data",
						icon: <CloudDownload />,
						path: "/patient/data-import",
					},
				];

			default:
				return baseItems;
		}
	};

	const navigationItems = getNavigationItems();

	const drawer = (
		<div>
			<Toolbar>
				<Typography
					variant="h6"
					noWrap
					component="div"
					sx={{ fontWeight: "bold" }}
				>
					MediCare Hospital
				</Typography>
			</Toolbar>
			<Divider />
			<List>
				{navigationItems.map((item) => (
					<ListItem key={item.text} disablePadding>
						<ListItemButton
							selected={location.pathname === item.path}
							onClick={() => {
								navigate(item.path);
								if (isMobile) {
									setMobileOpen(false);
								}
							}}
							sx={{
								"&.Mui-selected": {
									backgroundColor: theme.palette.primary.main + "20",
									"&:hover": {
										backgroundColor: theme.palette.primary.main + "30",
									},
								},
							}}
						>
							<ListItemIcon
								sx={{
									color:
										location.pathname === item.path
											? theme.palette.primary.main
											: "inherit",
								}}
							>
								{item.icon}
							</ListItemIcon>
							<ListItemText
								primary={item.text}
								sx={{
									color:
										location.pathname === item.path
											? theme.palette.primary.main
											: "inherit",
								}}
							/>
						</ListItemButton>
					</ListItem>
				))}
			</List>
		</div>
	);

	return (
		<Box sx={{ display: "flex" }}>
			<CssBaseline />
			<AppBar
				position="fixed"
				sx={{
					width: { md: `calc(100% - ${drawerWidth}px)` },
					ml: { md: `${drawerWidth}px` },
				}}
			>
				<Toolbar>
					<IconButton
						color="inherit"
						aria-label="open drawer"
						edge="start"
						onClick={handleDrawerToggle}
						sx={{ mr: 2, display: { md: "none" } }}
					>
						<MenuIcon />
					</IconButton>

					<Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
						{user?.role.charAt(0).toUpperCase() + user?.role.slice(1)} Dashboard
					</Typography>

					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						<Typography variant="body2">
							Welcome, {user?.profile.firstName}
						</Typography>
						<IconButton
							size="large"
							edge="end"
							aria-label="account of current user"
							aria-controls="primary-search-account-menu"
							aria-haspopup="true"
							onClick={handleProfileMenuOpen}
							color="inherit"
						>
							<Avatar
								sx={{ width: 32, height: 32 }}
								src={user?.avatar}
								alt={user?.name}
							>
								{user?.name?.charAt(0)}
							</Avatar>
						</IconButton>
					</Box>
				</Toolbar>
			</AppBar>

			<Box
				component="nav"
				sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
			>
				<Drawer
					variant="temporary"
					open={mobileOpen}
					onClose={handleDrawerToggle}
					ModalProps={{
						keepMounted: true,
					}}
					sx={{
						display: { xs: "block", md: "none" },
						"& .MuiDrawer-paper": {
							boxSizing: "border-box",
							width: drawerWidth,
						},
					}}
				>
					{drawer}
				</Drawer>
				<Drawer
					variant="permanent"
					sx={{
						display: { xs: "none", md: "block" },
						"& .MuiDrawer-paper": {
							boxSizing: "border-box",
							width: drawerWidth,
						},
					}}
					open
				>
					{drawer}
				</Drawer>
			</Box>

			<Box
				component="main"
				sx={{
					flexGrow: 1,
					p: 3,
					width: { md: `calc(100% - ${drawerWidth}px)` },
				}}
			>
				<Toolbar />
				{children}
			</Box>

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleProfileMenuClose}
				onClick={handleProfileMenuClose}
			>
				<MenuItem onClick={handleLogout}>
					<ListItemIcon>
						<Logout fontSize="small" />
					</ListItemIcon>
					Logout
				</MenuItem>
			</Menu>
		</Box>
	);
};

export default Layout;
