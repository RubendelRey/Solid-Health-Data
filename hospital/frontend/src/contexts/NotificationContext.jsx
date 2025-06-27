import { Alert, AlertTitle, Snackbar } from "@mui/material";
import { createContext, useCallback, useContext, useState } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
	const [notifications, setNotifications] = useState([]);

	const showNotification = useCallback(
		(message, severity = "info", title = null, duration = 6000) => {
			const id = Date.now() + Math.random();
			const notification = {
				id,
				message,
				severity,
				title,
				duration,
				open: true,
			};

			setNotifications((prev) => [...prev, notification]);

			if (duration > 0) {
				setTimeout(() => {
					removeNotification(id);
				}, duration);
			}

			return id;
		},
		[]
	);

	const removeNotification = useCallback((id) => {
		setNotifications((prev) =>
			prev.map((notification) =>
				notification.id === id ? { ...notification, open: false } : notification
			)
		);

		setTimeout(() => {
			setNotifications((prev) =>
				prev.filter((notification) => notification.id !== id)
			);
		}, 300);
	}, []);

	const showSuccess = useCallback(
		(message, title = "Success") => {
			return showNotification(message, "success", title);
		},
		[showNotification]
	);

	const showError = useCallback(
		(message, title = "Error") => {
			return showNotification(message, "error", title, 8000);
		},
		[showNotification]
	);

	const showWarning = useCallback(
		(message, title = "Warning") => {
			return showNotification(message, "warning", title);
		},
		[showNotification]
	);

	const showInfo = useCallback(
		(message, title = "Information") => {
			return showNotification(message, "info", title);
		},
		[showNotification]
	);

	const clearAll = useCallback(() => {
		setNotifications([]);
	}, []);

	const value = {
		showNotification,
		showSuccess,
		showError,
		showWarning,
		showInfo,
		removeNotification,
		clearAll,
	};

	return (
		<NotificationContext.Provider value={value}>
			{children}

			{notifications.map((notification) => (
				<Snackbar
					key={notification.id}
					open={notification.open}
					autoHideDuration={notification.duration}
					onClose={() => removeNotification(notification.id)}
					anchorOrigin={{ vertical: "top", horizontal: "right" }}
					sx={{
						mt: notification.title ? 8 : 6,
						"& .MuiSnackbar-root": {
							position: "relative",
						},
					}}
				>
					<Alert
						onClose={() => removeNotification(notification.id)}
						severity={notification.severity}
						variant="filled"
						sx={{ width: "100%", minWidth: 300 }}
					>
						{notification.title && (
							<AlertTitle>{notification.title}</AlertTitle>
						)}
						{notification.message}
					</Alert>
				</Snackbar>
			))}
		</NotificationContext.Provider>
	);
};

export const useNotification = () => {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error(
			"useNotification must be used within a NotificationProvider"
		);
	}
	return context;
};

export default NotificationContext;
