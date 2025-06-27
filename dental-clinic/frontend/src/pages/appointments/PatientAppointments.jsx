import {
	CalendarOutlined,
	ClockCircleOutlined,
	CloseCircleOutlined,
	UserOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Col,
	Layout,
	Modal,
	Row,
	Space,
	Spin,
	Tabs,
	Tag,
	Typography,
} from "antd";
import { format, isPast, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";
import { useContext, useEffect, useState } from "react";

import doctorService from "../../api/doctorService";
import interventionService from "../../api/interventionService";
import interventionTypeService from "../../api/interventionTypeService";
import AuthContext from "../../contexts/AuthContext";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const PatientAppointments = () => {
	const { user } = useContext(AuthContext);
	const [activeTabKey, setActiveTabKey] = useState("1");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [appointments, setAppointments] = useState({
		upcoming: [],
		past: [],
		canceled: [],
	});

	const [cancelModal, setCancelModal] = useState({
		open: false,
		appointmentId: null,
	});

	const fetchAppointments = async () => {
		if (!user?.patientId) return;

		try {
			setLoading(true);
			setError(null);

			const interventionTypes =
				await interventionTypeService.getAllInterventionTypes();

			const interventionTypesMap = {};
			interventionTypes.forEach((type) => {
				interventionTypesMap[type._id || type.id] = type;
			});

			const doctorsMap = {};

			const getDoctorInfo = async (doctorId) => {
				if (!doctorId) return null;

				if (doctorsMap[doctorId]) {
					return doctorsMap[doctorId];
				}

				try {
					const doctorData = await doctorService.getDoctorById(doctorId);
					doctorsMap[doctorId] = doctorData;
					return doctorData;
				} catch (error) {
					console.error(`Error fetching doctor ${doctorId}:`, error);
					return null;
				}
			};

			const processAppointments = async (appointmentList) => {
				const processedAppointments = [];

				for (const appointment of appointmentList) {
					const processedAppointment = {
						...appointment,
						interventionType:
							interventionTypesMap[appointment.interventionType] ||
							appointment.interventionType,
					};

					if (appointment.doctor && typeof appointment.doctor === "string") {
						processedAppointment.doctor = await getDoctorInfo(
							appointment.doctor
						);
					}

					if (appointment.doctor) {
						processedAppointments.push(processedAppointment);
					}
				}

				return processedAppointments;
			};

			const upcomingResult = await interventionService.getPatientAppointments(
				user.patientId,
				"upcoming"
			);

			const upcomingAppointments = await processAppointments(
				upcomingResult.filter((app) => app.state !== "canceled")
			);

			const pastResult = await interventionService.getPatientAppointments(
				user.patientId,
				"past"
			);

			const pastAppointments = await processAppointments(
				pastResult.filter((app) => app.state === "completed")
			);

			const canceledResult = await interventionService.getPatientAppointments(
				user.patientId,
				"canceled"
			);

			const canceledAppointments = await processAppointments(
				canceledResult.filter((app) => app.state === "canceled")
			);

			setAppointments({
				upcoming: upcomingAppointments,
				past: pastAppointments,
				canceled: canceledAppointments,
			});
		} catch (err) {
			console.error("Error fetching appointments:", err);
			setError("Failed to load appointments. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAppointments();
	}, []);

	const handleTabChange = (key) => {
		setActiveTabKey(key);
	};

	const handleCancelAppointment = async () => {
		if (!cancelModal.appointmentId) return;

		try {
			setLoading(true);

			await interventionService.cancelAppointment(cancelModal.appointmentId);

			setCancelModal({ open: false, appointmentId: null });

			fetchAppointments();
		} catch (err) {
			console.error("Error canceling appointment:", err);
			setError("Failed to cancel appointment. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return "No date";

		const date = parseISO(dateString);

		return format(date, "PPpp", { locale: enUS });
	};
	const renderAppointmentStatus = (appointment) => {
		if (appointment.state === "completed") {
			return <Tag color="success">Completed</Tag>;
		} else if (appointment.state === "canceled") {
			return <Tag color="error">Cancelled</Tag>;
		} else if (isPast(new Date(appointment.appointmentDate))) {
			return <Tag color="warning">Overdue</Tag>;
		} else {
			return <Tag color="processing">Scheduled</Tag>;
		}
	};

	const renderAppointmentCard = (appointment) => {
		const isCancelable =
			appointment.state !== "canceled" &&
			appointment.state !== "completed" &&
			!isPast(new Date(appointment.appointmentDate));

		return (
			<Card key={appointment._id} style={{ marginBottom: 16 }}>
				<Row gutter={16} align="middle">
					<Col xs={24} md={18}>
						<Space direction="vertical" size="small" style={{ width: "100%" }}>
							<Space align="center">
								<CalendarOutlined />
								<Text strong>{formatDate(appointment.date)}</Text>
							</Space>
							<Space align="center">
								<UserOutlined />
								<Text>
									Doctor: {appointment.doctor?.name}{" "}
									{appointment.doctor?.surname}
								</Text>
							</Space>

							<Space align="center">
								<ClockCircleOutlined />
								<Text>
									{appointment.interventionType?.name} (
									{appointment.interventionType?.duration} min)
								</Text>
							</Space>

							{appointment.notes && (
								<Paragraph type="secondary" style={{ marginTop: 8 }}>
									{appointment.notes}
								</Paragraph>
							)}
						</Space>
					</Col>

					<Col xs={24} md={6} style={{ textAlign: "right" }}>
						<Space direction="vertical" align="end">
							{renderAppointmentStatus(appointment)}

							{isCancelable && (
								<Button
									danger
									icon={<CloseCircleOutlined />}
									onClick={() =>
										setCancelModal({
											open: true,
											appointmentId: appointment.id || appointment._id,
										})
									}
									style={{ marginTop: 8 }}
								>
									Cancel
								</Button>
							)}
						</Space>
					</Col>
				</Row>
			</Card>
		);
	};

	return (
		<Layout.Content style={{ padding: 24 }}>
			<Title level={2}>My appointments</Title>

			{error && (
				<Alert
					message="Error"
					description={error}
					type="error"
					showIcon
					style={{ marginBottom: 24 }}
				/>
			)}

			<div style={{ marginBottom: 24 }}>
				{" "}
				<Button type="primary" href="/appointments/new">
					Schedule New Appointment
				</Button>
			</div>

			<Card style={{ marginBottom: 24 }}>
				{" "}
				<Tabs activeKey={activeTabKey} onChange={handleTabChange}>
					<TabPane tab={`Upcoming (${appointments.upcoming.length})`} key="1">
						{loading ? (
							<div
								style={{
									display: "flex",
									justifyContent: "center",
									padding: "24px 0",
								}}
							>
								<Spin size="large" />
							</div>
						) : appointments.upcoming.length > 0 ? (
							appointments.upcoming.map((appointment) =>
								renderAppointmentCard(appointment)
							)
						) : (
							<Alert
								message="No upcoming scheduled appointments"
								type="info"
								showIcon
							/>
						)}{" "}
					</TabPane>

					<TabPane tab={`Past (${appointments.past.length})`} key="2">
						{loading ? (
							<div
								style={{
									display: "flex",
									justifyContent: "center",
									padding: "24px 0",
								}}
							>
								<Spin size="large" />
							</div>
						) : appointments.past.length > 0 ? (
							appointments.past.map((appointment) =>
								renderAppointmentCard(appointment)
							)
						) : (
							<Alert message="No past appointments" type="info" showIcon />
						)}{" "}
					</TabPane>

					<TabPane tab={`Cancelled (${appointments.canceled.length})`} key="3">
						{loading ? (
							<div
								style={{
									display: "flex",
									justifyContent: "center",
									padding: "24px 0",
								}}
							>
								<Spin size="large" />
							</div>
						) : appointments.canceled.length > 0 ? (
							appointments.canceled.map((appointment) =>
								renderAppointmentCard(appointment)
							)
						) : (
							<Alert message="No cancelled appointments" type="info" showIcon />
						)}
					</TabPane>
				</Tabs>
			</Card>
			<Modal
				title="Cancel Appointment"
				open={cancelModal.open}
				onCancel={() => setCancelModal({ open: false, appointmentId: null })}
				footer={[
					<Button
						key="back"
						onClick={() => setCancelModal({ open: false, appointmentId: null })}
					>
						Close
					</Button>,
					<Button
						key="submit"
						type="primary"
						danger
						onClick={handleCancelAppointment}
					>
						Confirm Cancellation{" "}
					</Button>,
				]}
			>
				<p>
					Are you sure you want to cancel this appointment? This action cannot
					be undone.
				</p>
			</Modal>
		</Layout.Content>
	);
};

export default PatientAppointments;
