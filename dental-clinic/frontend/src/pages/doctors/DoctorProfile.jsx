import {
	CalendarOutlined,
	ClockCircleOutlined,
	EditOutlined,
	HistoryOutlined,
	MailOutlined,
	ScheduleOutlined,
	UserOutlined,
} from "@ant-design/icons";
import {
	Avatar,
	Badge,
	Button,
	Calendar,
	Card,
	Col,
	Descriptions,
	Divider,
	List,
	Modal,
	Row,
	Space,
	Spin,
	Table,
	Tabs,
	Tag,
	Typography,
	message,
} from "antd";
import moment from "moment";
import "moment/locale/en-gb";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import doctorService from "../../api/doctorService";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const DoctorProfile = () => {
	moment.locale("en-gb");

	const { id } = useParams();
	const navigate = useNavigate();
	const [doctor, setDoctor] = useState(null);
	const [futureAppointments, setFutureAppointments] = useState([]);
	const [pastAppointments, setPastAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const { isAdmin, user } = useAuth();

	const isOwnProfile = user && doctor && user.id === doctor.userId;

	useEffect(() => {
		const fetchDoctorData = async () => {
			try {
				setLoading(true);

				const doctorData = await doctorService.getDoctorById(id);
				setDoctor(doctorData);

				const future = await doctorService.getFutureAppointments(id);
				const past = await doctorService.getPastAppointments(id);

				setFutureAppointments(future);
				setPastAppointments(past);
			} catch (error) {
				console.error("Error fetching doctor data:", error);
				message.error("Failed to load doctor data");
			} finally {
				setLoading(false);
			}
		};

		fetchDoctorData();
	}, [id]);

	const getAppointmentsForDate = (date) => {
		const dateString = date.format("YYYY-MM-DD");

		return futureAppointments.filter((appointment) => {
			const appointmentDate = moment(appointment.date).format("YYYY-MM-DD");
			return appointmentDate === dateString;
		});
	};

	const dateCellRender = (date) => {
		const appointments = getAppointmentsForDate(date);

		if (appointments.length === 0) {
			return null;
		}

		return (
			<Badge
				count={appointments.length}
				style={{ backgroundColor: "#52c41a" }}
				overflowCount={9}
			/>
		);
	};

	const appointmentsColumns = [
		{
			title: "Date & Time",
			dataIndex: "date",
			key: "date",
			sorter: (a, b) => new Date(a.date) - new Date(b.date),
			render: (date) => moment(date).format("MMMM D, YYYY - HH:mm"),
		},
		{
			title: "Patient",
			dataIndex: "patient",
			key: "patient",
			render: (patient) => patient.name,
		},
		{
			title: "Intervention Type",
			dataIndex: "interventionType",
			key: "interventionType",
			render: (interventionType) => interventionType.name,
		},
		{
			title: "Duration",
			dataIndex: "interventionType",
			key: "duration",
			render: (interventionType) => `${interventionType.duration} min`,
		},
		{
			title: "Status",
			dataIndex: "state",
			key: "state",
			render: (state) => {
				let color =
					state === "Scheduled"
						? "processing"
						: state === "Completed"
						? "success"
						: state === "Cancelled"
						? "error"
						: "default";

				return <Tag color={color}>{state}</Tag>;
			},
		},
	];

	if (loading) {
		return (
			<div style={{ textAlign: "center", padding: "50px" }}>
				<Spin size="large" />
				<p>Loading doctor data...</p>
			</div>
		);
	}

	if (!doctor) {
		return (
			<div style={{ textAlign: "center", padding: "50px" }}>
				<Text type="danger">Doctor not found</Text>
				<Button type="primary" onClick={() => navigate("/doctors")}>
					Back to Doctors List
				</Button>
			</div>
		);
	}

	const processDay = (day) => {
		switch (day) {
			case 1:
				return "Monday";
			case 2:
				return "Tuesday";
			case 3:
				return "Wednesday";
			case 4:
				return "Thursday";
			case 5:
				return "Friday";
			default:
				return "no day";
		}
	};

	return (
		<div>
			<Card>
				<Row gutter={[24, 24]}>
					<Col xs={24} md={8}>
						<div style={{ textAlign: "center" }}>
							<Avatar
								size={150}
								icon={<UserOutlined />}
								style={{ backgroundColor: "#1890ff" }}
							/>
							<Title level={2} style={{ marginTop: 16, marginBottom: 8 }}>
								{doctor.name}
							</Title>
							<Tag color="blue">
								{doctor.specialization || "General Dentist"}
							</Tag>

							<Divider />

							<Space
								direction="vertical"
								size="middle"
								style={{ width: "100%" }}
							>
								<div>
									<MailOutlined /> <Text copyable>{doctor.email}</Text>
								</div>
							</Space>

							<Divider />

							<div style={{ textAlign: "left" }}>
								<Title level={4}>Weekly Schedule</Title>
								{doctor.workHours &&
								Object.keys(doctor.workHours).length > 0 ? (
									<List
										size="small"
										dataSource={doctor.workHours}
										renderItem={(item) => (
											<List.Item>
												<Text strong>{processDay(item.day)} </Text>{" "}
												<Text>
													{" "}
													Morning: {item.morningStart} - {item.moriningEnd}{" "}
													Afternoon: {item.afternoonStart} - {item.afternoonEnd}
												</Text>
											</List.Item>
										)}
									/>
								) : (
									<Text type="secondary">No schedule defined</Text>
								)}
							</div>
							{(isAdmin || isOwnProfile) && (
								<Space
									direction="vertical"
									style={{ width: "100%", marginTop: 16 }}
								>
									<Button
										type="primary"
										icon={<EditOutlined />}
										onClick={() => navigate(`/doctors/edit/${doctor.id}`)}
										block
									>
										Edit Profile
									</Button>
								</Space>
							)}
						</div>
					</Col>

					<Col xs={24} md={16}>
						<Tabs defaultActiveKey="1">
							<TabPane
								tab={
									<span>
										<UserOutlined /> Professional Information
									</span>
								}
								key="1"
							>
								<Card>
									<Title level={4}>Bio</Title>
									<Paragraph>
										{doctor.biography || "No professional bio available."}
									</Paragraph>
								</Card>
								<Card style={{ marginTop: 16 }}>
									<Title level={4}>Licenses & Qualifications</Title>
									<Descriptions column={1}>
										<Descriptions.Item label="Collegiate Number">
											{doctor.collegiateNumber || "Not provided"}
										</Descriptions.Item>
										<Descriptions.Item label="Specialties">
											{doctor.specialties && doctor.specialties.length > 0
												? doctor.specialties.join(", ")
												: "No specialties defined"}
										</Descriptions.Item>
										<Descriptions.Item label="Qualifications">
											{doctor.qualifications && doctor.qualifications.length > 0
												? doctor.qualifications.map((q) => q.title).join(", ")
												: "No qualifications defined"}
										</Descriptions.Item>
									</Descriptions>
								</Card>
							</TabPane>

							{(isAdmin || isOwnProfile) && (
								<TabPane
									tab={
										<span>
											<CalendarOutlined /> Appointment Schedule
										</span>
									}
									key="2"
								>
									<Calendar
										dateCellRender={dateCellRender}
										onSelect={(date) => {
											const appointments = getAppointmentsForDate(date);
											if (appointments.length > 0) {
												Modal.info({
													title: `Appointments for ${date.format(
														"MMMM D, YYYY"
													)}`,
													content: (
														<List
															dataSource={appointments}
															renderItem={(item) => (
																<List.Item>
																	<List.Item.Meta
																		avatar={<ClockCircleOutlined />}
																		title={`${moment(item.date).format(
																			"HH:mm"
																		)} - ${item.patient.name}`}
																		description={item.interventionType.name}
																	/>
																</List.Item>
															)}
														/>
													),
												});
											}
										}}
									/>
								</TabPane>
							)}

							{(isAdmin || isOwnProfile) && (
								<TabPane
									tab={
										<span>
											<ScheduleOutlined /> Upcoming Appointments (
											{futureAppointments.length})
										</span>
									}
									key="3"
								>
									<Table
										columns={appointmentsColumns}
										dataSource={futureAppointments}
										rowKey="_id"
										pagination={{ pageSize: 5 }}
										locale={{ emptyText: "No upcoming appointments" }}
									/>
								</TabPane>
							)}

							{(isAdmin || isOwnProfile) && (
								<TabPane
									tab={
										<span>
											<HistoryOutlined /> Past Appointments (
											{pastAppointments.length})
										</span>
									}
									key="4"
								>
									<Table
										columns={appointmentsColumns}
										dataSource={pastAppointments}
										rowKey="_id"
										pagination={{ pageSize: 5 }}
										locale={{ emptyText: "No past appointments" }}
										expandable={{
											expandedRowRender: (record) => (
												<div>
													<p>
														<strong>Notes:</strong>{" "}
														{record.notes || "No notes recorded"}
													</p>
												</div>
											),
										}}
									/>
								</TabPane>
							)}
						</Tabs>
					</Col>
				</Row>
			</Card>
		</div>
	);
};

export default DoctorProfile;
