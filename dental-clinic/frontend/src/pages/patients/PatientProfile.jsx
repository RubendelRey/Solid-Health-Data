import {
	CalendarOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	DeleteOutlined,
	EditOutlined,
	ExclamationCircleOutlined,
	HistoryOutlined,
	MailOutlined,
	PhoneOutlined,
	PlusOutlined,
	UserOutlined,
} from "@ant-design/icons";
import {
	Avatar,
	Badge,
	Button,
	Card,
	Col,
	Descriptions,
	Divider,
	Empty,
	List,
	Modal,
	Popconfirm,
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
import interventionService from "../../api/interventionService";
import patientService from "../../api/patientService";
import EditPatientAllergyForm from "../../components/patient/EditPatientAllergyForm";

import doctorService from "../../api/doctorService";
import interventionTypeService from "../../api/interventionTypeService";

const { Title, Text } = Typography;

const PatientProfile = () => {
	moment.locale("en-gb");

	const { id } = useParams();
	const navigate = useNavigate();
	const [patient, setPatient] = useState(null);
	const [pastInterventions, setPastInterventions] = useState([]);
	const [upcomingAppointments, setUpcomingAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [allergyModalVisible, setAllergyModalVisible] = useState(false);
	const [editingAllergy, setEditingAllergy] = useState(null);
	useEffect(() => {
		const fetchPatientData = async () => {
			try {
				setLoading(true);

				const patientData = await patientService.getPatientById(id);

				const allergiesResponse = await patientService.getPatientAllergies(id);
				if (allergiesResponse && allergiesResponse.allergies) {
					patientData.allergies = allergiesResponse.allergies;
				}

				setPatient(patientData);

				const interventions = await interventionService.getPatientAppointments(
					id
				);

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

						processedAppointments.push(processedAppointment);
					}

					return processedAppointments;
				};

				const pastInterventions = await processAppointments(
					interventions.filter(
						(intervention) =>
							intervention.state === "completed" ||
							intervention.state === "canceled"
					)
				);

				const upcomingAppointments = await processAppointments(
					interventions.filter(
						(intervention) => intervention.state === "scheduled"
					)
				);

				setPastInterventions(pastInterventions);
				setUpcomingAppointments(upcomingAppointments);
			} catch (error) {
				console.error("Error fetching patient data:", error);
				message.error("Failed to load patient data");
			} finally {
				setLoading(false);
			}
		};

		fetchPatientData();
	}, [id]);

	const refreshAllergies = async () => {
		try {
			const allergiesResponse = await patientService.getPatientAllergies(id);
			if (allergiesResponse && allergiesResponse.allergies) {
				setPatient((prevPatient) => ({
					...prevPatient,
					allergies: allergiesResponse.allergies,
				}));
			}
		} catch (error) {
			console.error("Error refreshing allergies:", error);
			message.error("Failed to refresh allergies data");
		}
	};

	const handleAddAllergy = () => {
		setEditingAllergy(null);
		setAllergyModalVisible(true);
	};

	const handleEditAllergy = (allergy) => {
		setEditingAllergy(allergy);
		setAllergyModalVisible(true);
	};

	const handleDeleteAllergy = async (allergyId) => {
		try {
			await patientService.removeAllergyFromPatient(id, allergyId);
			message.success("Allergy removed successfully");
			await refreshAllergies();
		} catch (error) {
			console.error("Error removing allergy:", error);
			message.error("Failed to remove allergy");
		}
	};

	const handleFormSuccess = async () => {
		setAllergyModalVisible(false);
		message.success(
			`Allergy ${editingAllergy ? "updated" : "added"} successfully`
		);
		await refreshAllergies();
	};

	const pastInterventionsColumns = [
		{
			title: "Date & Time",
			dataIndex: "date",
			key: "date",
			sorter: (a, b) => new Date(a.date) - new Date(b.date),
			render: (date) => moment(date).format("MMMM D, YYYY - HH:mm"),
		},
		{
			title: "Intervention Type",
			dataIndex: "interventionType",
			key: "interventionType",
			render: (interventionType) => interventionType.name,
		},
		{
			title: "Doctor",
			dataIndex: "doctor",
			key: "doctor",
			render: (doctor) => doctor.name,
		},
		{
			title: "Status",
			dataIndex: "state",
			key: "state",
			render: (state) => {
				let color = "default";
				let icon = null;

				if (state === "completed") {
					color = "success";
					icon = <CheckCircleOutlined />;
				} else if (state === "canceled") {
					color = "error";
					icon = <CloseCircleOutlined />;
				}

				return (
					<Tag color={color} icon={icon}>
						{state}
					</Tag>
				);
			},
		},
	];

	const upcomingAppointmentsColumns = [
		{
			title: "Date & Time",
			dataIndex: "date",
			key: "date",
			sorter: (a, b) => new Date(a.date) - new Date(b.date),
			render: (date) => moment(date).format("MMMM D, YYYY - HH:mm"),
		},
		{
			title: "Intervention Type",
			dataIndex: "interventionType",
			key: "interventionType",
			render: (interventionType) => interventionType.name,
		},
		{
			title: "Doctor",
			dataIndex: "doctor",
			key: "doctor",
			render: (doctor) => doctor.name,
		},
		{
			title: "Duration",
			dataIndex: "interventionType",
			key: "duration",
			render: (interventionType) => `${interventionType.duration} min`,
		},
	];

	if (loading) {
		return (
			<div style={{ textAlign: "center", padding: "50px" }}>
				<Spin size="large" />
				<p>Loading patient data...</p>
			</div>
		);
	}

	if (!patient) {
		return (
			<div style={{ textAlign: "center", padding: "50px" }}>
				<Text type="danger">Patient not found</Text>
				<Button type="primary" onClick={() => navigate("/patients")}>
					Back to Patients List
				</Button>
			</div>
		);
	}

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
								{patient.name}
							</Title>
							<Space>
								<Tag color="blue">{patient.gender}</Tag>
								{patient.dateOfBirth && (
									<Tag color="green">
										{moment().diff(moment(patient.dateOfBirth), "years")} years
									</Tag>
								)}
							</Space>
							<Divider />
							<Space
								direction="vertical"
								size="middle"
								style={{ width: "100%" }}
							>
								<div>
									<MailOutlined /> <Text copyable>{patient.email}</Text>
								</div>
								<div>
									{patient.phoneNumbers && patient.phoneNumbers.length > 0 ? (
										patient.phoneNumbers.map((number, index) => (
											<span key={index}>
												<PhoneOutlined /> <Text copyable>{number}</Text>
												{index < patient.phoneNumbers.length - 1 && ", "}
											</span>
										))
									) : (
										<Text type="secondary">No phone numbers recorded</Text>
									)}
								</div>
								{patient.address && (
									<div>
										<Text type="secondary">{patient.address}</Text>
									</div>
								)}
							</Space>
						</div>
					</Col>
					<Col xs={24} md={16}>
						<Tabs
							defaultActiveKey="1"
							items={[
								{
									key: "1",
									label: (
										<span>
											<UserOutlined /> Medical Information
										</span>
									),
									children: (
										<Descriptions
											column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
										>
											<Descriptions.Item label="Allergies" span={2}>
												<Space size={[0, 8]} wrap>
													{patient.allergies && patient.allergies.length > 0 ? (
														<>
															<Badge
																count={patient.allergies.length}
																style={{ backgroundColor: "#ff4d4f" }}
															/>
															<Text>See Allergies tab for details</Text>
														</>
													) : (
														<Text type="secondary">No allergies recorded</Text>
													)}
												</Space>
											</Descriptions.Item>
											<Descriptions.Item label="Birth Date" span={2}>
												{patient.dateOfBirth
													? moment(patient.dateOfBirth).format("MMMM D, YYYY")
													: "Not recorded"}
											</Descriptions.Item>
											<Descriptions.Item label="Medical Notes" span={2}>
												{patient.medicalHistory || "No medical notes recorded"}
											</Descriptions.Item>
										</Descriptions>
									),
								},
								{
									key: "4",
									label: (
										<span>
											<ExclamationCircleOutlined />
											Allergies
											{patient.allergies && patient.allergies.length > 0 && (
												<Badge
													count={patient.allergies.length}
													offset={[5, -5]}
													style={{ backgroundColor: "#ff4d4f" }}
												/>
											)}
										</span>
									),
									children: (
										<>
											<div
												style={{
													display: "flex",
													justifyContent: "flex-end",
													marginBottom: "16px",
												}}
											>
												<Button
													type="primary"
													icon={<PlusOutlined />}
													onClick={handleAddAllergy}
												>
													Add Allergy
												</Button>
											</div>
											{patient.allergies && patient.allergies.length > 0 ? (
												<List
													grid={{ gutter: 16, column: 2 }}
													itemLayout="horizontal"
													dataSource={patient.allergies}
													renderItem={(allergy) => (
														<List.Item>
															<Card
																style={{
																	width: "100%",
																	display: "flex",
																	alignItems: "center",
																}}
															>
																<Space>
																	<Button
																		type="primary"
																		icon={<EditOutlined />}
																		onClick={() => handleEditAllergy(allergy)}
																	/>
																	<Popconfirm
																		title="Remove this allergy"
																		description="Are you sure you want to remove this allergy from the patient record?"
																		onConfirm={() =>
																			handleDeleteAllergy(allergy._id)
																		}
																		okText="Yes"
																		cancelText="No"
																		placement="left"
																	>
																		<Button danger icon={<DeleteOutlined />} />
																	</Popconfirm>
																</Space>
																<div
																	style={{
																		display: "flex",
																		justifyContent: "space-between",
																		alignItems: "flex-start",
																	}}
																>
																	<div
																		style={{
																			width: "100%",
																			display: "flex",
																			flexDirection: "column",
																			alignItems: "center",
																		}}
																	>
																		<Title level={4}>{allergy.name}</Title>
																		<div style={{ marginBottom: "10px" }}>
																			<Tag
																				color={
																					allergy.type === "Medication"
																						? "blue"
																						: allergy.type === "Material"
																						? "purple"
																						: allergy.type === "Food"
																						? "green"
																						: "orange"
																				}
																			>
																				{allergy.type || "Unknown Type"}
																			</Tag>{" "}
																			{allergy.severity && (
																				<Tag
																					color={
																						allergy.severity === "high"
																							? "red"
																							: allergy.severity === "low"
																							? "green"
																							: "blue"
																					}
																				>
																					{allergy.severity === "high"
																						? "⚠️ "
																						: ""}
																					{allergy.severity
																						.charAt(0)
																						.toUpperCase() +
																						allergy.severity.slice(1)}{" "}
																					Severity
																				</Tag>
																			)}
																		</div>
																		{allergy.description && (
																			<Text>{allergy.description}</Text>
																		)}
																	</div>
																</div>
																{(allergy.notes ||
																	allergy.reactions ||
																	allergy.detectionDate) && (
																	<div style={{ marginTop: "16px" }}>
																		{allergy.detectionDate && (
																			<div style={{ marginBottom: "8px" }}>
																				<Text type="secondary" strong>
																					Detected:
																				</Text>
																				<Text>
																					{" "}
																					{moment(allergy.detectionDate).format(
																						"MMMM D, YYYY"
																					)}
																				</Text>
																			</div>
																		)}
																		{allergy.notes && (
																			<div style={{ marginBottom: "8px" }}>
																				<Text type="secondary" strong>
																					Medical Notes:
																				</Text>
																				<Text> {allergy.notes}</Text>
																			</div>
																		)}
																		{allergy.reactions && (
																			<div>
																				<Text type="secondary" strong>
																					Reactions:
																				</Text>
																				<Text> {allergy.reactions}</Text>
																			</div>
																		)}
																	</div>
																)}
															</Card>
														</List.Item>
													)}
												/>
											) : (
												<Empty description="No allergies recorded for this patient" />
											)}
										</>
									),
								},
								{
									key: "2",
									label: (
										<span>
											<CalendarOutlined /> Upcoming Appointments (
											{upcomingAppointments.length})
										</span>
									),
									children: (
										<Table
											columns={upcomingAppointmentsColumns}
											dataSource={upcomingAppointments}
											rowKey="_id"
											pagination={{ pageSize: 5 }}
											locale={{ emptyText: "No upcoming appointments" }}
										/>
									),
								},
								{
									key: "3",
									label: (
										<span>
											<HistoryOutlined /> Past Interventions (
											{pastInterventions.length})
										</span>
									),
									children: (
										<Table
											columns={pastInterventionsColumns}
											dataSource={pastInterventions}
											rowKey="_id"
											pagination={{ pageSize: 5 }}
											locale={{ emptyText: "No past interventions" }}
											expandable={{
												expandedRowRender: (record) => (
													<div>
														<p>
															<strong>Notes:</strong>{" "}
															{record.notes || "No notes recorded"}
														</p>
														{record.medications &&
															record.medications.length > 0 && (
																<div>
																	<p>
																		<strong>Medications:</strong>
																	</p>
																	<ul>
																		{record.medications.map(
																			(medication, index) => (
																				<li key={index}>{medication}</li>
																			)
																		)}
																	</ul>
																</div>
															)}
													</div>
												),
											}}
										/>
									),
								},
							]}
						/>
					</Col>{" "}
				</Row>
			</Card>

			<Modal
				title={editingAllergy ? "Edit Allergy" : "Add New Allergy"}
				open={allergyModalVisible}
				onCancel={() => setAllergyModalVisible(false)}
				footer={null}
				maskClosable={false}
				destroyOnClose={true}
				width={700}
			>
				<EditPatientAllergyForm
					isEditing={!!editingAllergy}
					currentAllergy={editingAllergy}
					patientId={id}
					onSuccess={handleFormSuccess}
					onCancel={() => setAllergyModalVisible(false)}
				/>
			</Modal>
		</div>
	);
};

export default PatientProfile;
