import {
	CalendarOutlined,
	ClockCircleOutlined,
	UserOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Card,
	Col,
	Layout,
	Row,
	Space,
	Spin,
	Tabs,
	Tag,
	Typography,
} from "antd";
import { format, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";
import { useContext, useEffect, useState } from "react";

import interventionService from "../../api/interventionService";
import interventionTypeService from "../../api/interventionTypeService";
import patientService from "../../api/patientService";
import AuthContext from "../../contexts/AuthContext";

const { Title, Text, Paragraph } = Typography;

const DoctorAppointments = () => {
	const { user } = useContext(AuthContext);
	const [activeTabKey, setActiveTabKey] = useState("1");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [appointments, setAppointments] = useState({
		upcoming: [],
		past: [],
		canceled: [],
	});

	const fetchAppointments = async () => {
		try {
			setLoading(true);
			setError(null);

			const interventionTypes =
				await interventionTypeService.getAllInterventionTypes();

			const interventionTypesMap = {};
			interventionTypes.forEach((type) => {
				interventionTypesMap[type._id || type.id] = type;
			});

			const upcomingResult = await interventionService.getDoctorAppointments(
				user.id,
				"upcoming"
			);

			const patientsMap = {};

			const getPatientInfo = async (patientId) => {
				if (!patientId) return null;

				if (patientsMap[patientId]) {
					return patientsMap[patientId];
				}

				try {
					const patientData = await patientService.getPatientById(patientId);
					patientsMap[patientId] = patientData;
					return patientData;
				} catch (error) {
					console.error(`Error fetching patient ${patientId}:`, error);
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

					if (appointment.patient && typeof appointment.patient === "string") {
						processedAppointment.patient = await getPatientInfo(
							appointment.patient
						);
					}

					processedAppointments.push(processedAppointment);
				}

				return processedAppointments;
			};

			const upcomingAppointments = await processAppointments(
				upcomingResult.appointments.filter((app) => app.state !== "canceled")
			);

			const pastResult = await interventionService.getDoctorAppointments(
				user.id,
				"past"
			);

			const pastAppointments = await processAppointments(
				pastResult.appointments.filter((app) => app.state === "completed")
			);

			const canceledResult = await interventionService.getDoctorAppointments(
				user.id,
				"canceled"
			);

			const canceledAppointments = await processAppointments(
				canceledResult.appointments.filter((app) => app.state === "canceled")
			);

			setAppointments({
				upcoming: upcomingAppointments,
				past: pastAppointments,
				canceled: canceledAppointments,
			});
		} catch (err) {
			console.error("Error fetching appointments:", err);
			setError("Error loading appointments. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (user?.id) {
			fetchAppointments();
		}
	}, [user?.id]);

	const handleTabChange = (key) => {
		setActiveTabKey(key);
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
		} else {
			return <Tag color="processing">Scheduled</Tag>;
		}
	};

	const renderAppointmentCard = (appointment) => {
		return (
			<Card key={appointment.id} style={{ marginBottom: 16 }}>
				<Row gutter={16} align="middle">
					<Col xs={24} md={18}>
						<Space direction="vertical" size="small" style={{ width: "100%" }}>
							{" "}
							<Space align="center">
								<CalendarOutlined />
								<Text strong>{formatDate(appointment.date)}</Text>
							</Space>
							<Space align="center">
								<UserOutlined />
								<Text>
									Patient: {appointment.patient?.name}{" "}
									{appointment.patient?.surname}
								</Text>
							</Space>
							<Space align="center">
								<ClockCircleOutlined />
								<Text>
									{appointment.interventionType?.name}
									<Space />
								</Text>
								<Text>({appointment.interventionType?.duration} min)</Text>
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
						</Space>
					</Col>
				</Row>
			</Card>
		);
	};
	return (
		<Layout.Content style={{ padding: 24 }}>
			<Title level={2}>My Appointments</Title>

			{error && (
				<Alert
					message="Error"
					description={error}
					type="error"
					showIcon
					style={{ marginBottom: 24 }}
				/>
			)}

			<Card style={{ marginBottom: 24 }}>
				{" "}
				<Tabs
					activeKey={activeTabKey}
					onChange={handleTabChange}
					items={[
						{
							key: "1",
							label: `Upcoming (${appointments.upcoming.length})`,
							children: loading ? (
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
							),
						},
						{
							key: "2",
							label: `Past (${appointments.past.length})`,
							children: loading ? (
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
							),
						},
						{
							key: "3",
							label: `Cancelled (${appointments.canceled.length})`,
							children: loading ? (
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
								<Alert
									message="No cancelled appointments"
									type="info"
									showIcon
								/>
							),
						},
					]}
				/>
			</Card>
		</Layout.Content>
	);
};

export default DoctorAppointments;
