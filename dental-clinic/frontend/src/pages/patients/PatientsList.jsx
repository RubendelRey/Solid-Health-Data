import {
	DeleteOutlined,
	EditOutlined,
	ExclamationCircleOutlined,
	MailOutlined,
	PhoneOutlined,
	UserAddOutlined,
} from "@ant-design/icons";
import {
	Button,
	Card,
	DatePicker,
	Form,
	Input,
	message,
	Modal,
	Popconfirm,
	Select,
	Space,
	Table,
	Tabs,
	Tag,
	Tooltip,
	Typography,
} from "antd";
import moment from "moment";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import allergyService from "../../api/allergyService";
import patientService from "../../api/patientService";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const PatientsList = () => {
	const [patients, setPatients] = useState([]);
	const [allergies, setAllergies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [modalVisible, setModalVisible] = useState(false);
	const [editingPatient, setEditingPatient] = useState(null);
	const [form] = Form.useForm();
	const { isAdmin, isDoctor, user } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				let patientData;

				if (isAdmin) {
					patientData = await patientService.getAllPatients();
				} else if (isDoctor) {
					patientData = await patientService.getPatientsByDoctor(user.doctorId);
				} else {
					patientData = [];
				}

				const allergyData = await allergyService.getAllAllergies();

				for (let i = 0; i < patientData.length; i++) {
					if (patientData[i].allergies) {
						for (let j = 0; j < patientData[i].allergies.length; j++) {
							const allergy = allergyData.find(
								(a) => a._id === patientData[i].allergies[j].allergyId
							);
							if (allergy) {
								patientData[i].allergies[j] = {
									...patientData[i].allergies[j],
									...allergy,
								};
							}
						}
					}
				}
				setPatients(patientData);
				setAllergies(allergyData);
			} catch (error) {
				console.error("Error fetching data:", error);
				message.error("Failed to load patients data");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [isAdmin, isDoctor, user]);

	const handleFormSubmit = async (values) => {
		try {
			const formattedValues = {
				...values,
				birthDate: values.birthDate
					? values.birthDate.format("YYYY-MM-DD")
					: null,
			};

			const allergyIds = formattedValues.allergies || [];
			delete formattedValues.allergies;

			let patientId;
			if (editingPatient) {
				await patientService.updatePatient(editingPatient._id, formattedValues);
				patientId = editingPatient._id;
				message.success("Patient updated successfully");
			} else {
				const newPatient = await patientService.createPatient(formattedValues);
				patientId = newPatient._id;
				message.success("Patient created successfully");
			}

			if (allergyIds.length > 0 && patientId) {
				const addAllergies = async () => {
					for (const allergyId of allergyIds) {
						try {
							await patientService.addAllergyToPatient(patientId, {
								allergyId: allergyId,
								severity: "low",
								detectionDate: new Date().toISOString(),
								status: "active",
							});
						} catch (err) {
							console.error("Error adding allergy:", err);
						}
					}
				};

				addAllergies();
			}

			const updatedPatients = isAdmin
				? await patientService.getAllPatients()
				: await patientService.getPatientsByDoctor(user._id);

			setPatients(updatedPatients);
			setModalVisible(false);
			form.resetFields();
		} catch (error) {
			console.error("Error saving patient:", error);
			message.error("Failed to save patient");
		}
	};

	const handleDeletePatient = async (id) => {
		try {
			await patientService.deletePatient(id);
			message.success("Patient deleted successfully");

			const updatedPatients = isAdmin
				? await patientService.getAllPatients()
				: await patientService.getPatientsByDoctor(user._id);

			setPatients(updatedPatients);
		} catch (error) {
			console.error("Error deleting patient:", error);
			message.error("Failed to delete patient");
		}
	};

	const showPatientModal = (patient = null) => {
		setEditingPatient(patient);

		if (patient) {
			form.setFieldsValue({
				...patient,
				birthDate: patient.birthDate ? moment(patient.birthDate) : null,
				allergies: patient.allergies ? patient.allergies.map((a) => a._id) : [],
			});
		} else {
			form.resetFields();

			if (isDoctor) {
				form.setFieldsValue({ doctorId: user._id });
			}
		}

		setModalVisible(true);
	};
	const columns = [
		{
			title: "Name",
			dataIndex: "name",
			key: "name",
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (text, record) => (
				<div>
					<Text strong>{text}</Text>
					<div>
						<Tag color="blue">{record.gender}</Tag>
						{record.birthDate && (
							<Tag color="green">
								{moment().diff(moment(record.birthDate), "years")} years
							</Tag>
						)}
					</div>
				</div>
			),
		},
		{
			title: "Contact Information",
			dataIndex: "email",
			key: "contact",
			render: (email, record) => (
				<Space direction="vertical">
					<span>
						<MailOutlined /> {email}
					</span>
					<span>
						<PhoneOutlined /> {record.phone}
					</span>
				</Space>
			),
		},
		{
			title: "Allergies",
			dataIndex: "allergies",
			key: "allergies",
			render: (allergiesList) => (
				<Space size={[0, 8]} wrap>
					{allergiesList && allergiesList.length > 0 ? (
						allergiesList.map((allergy) => (
							<Tooltip
								key={allergy._id || allergy.allergyId}
								title={
									<>
										<div>
											<strong>Type:</strong> {allergy.type}
										</div>{" "}
										{allergy.description && (
											<div>
												<strong>Description:</strong> {allergy.description}
											</div>
										)}
										{allergy.notes && (
											<div>
												<strong>Notes:</strong> {allergy.notes}
											</div>
										)}
										{allergy.severity && (
											<div>
												<strong>Severity:</strong> {allergy.severity}
											</div>
										)}
										{allergy.detectionDate && (
											<div>
												<strong>Detected:</strong>{" "}
												{new Date(allergy.detectionDate).toLocaleDateString()}
											</div>
										)}
									</>
								}
							>
								{" "}
								<Tag
									color={
										allergy.severity === "high"
											? "red"
											: allergy.severity === "low"
											? "orange"
											: allergy.severity === "low"
											? "green"
											: "blue"
									}
								>
									{allergy.name}
									{allergy.severity === "high" && " ⚠️"}
								</Tag>
							</Tooltip>
						))
					) : (
						<Text type="secondary">No allergies</Text>
					)}
				</Space>
			),
		},
		{
			title: "Medical Notes",
			dataIndex: "medicalNotes",
			key: "medicalNotes",
			ellipsis: true,
			render: (notes) => notes || <Text type="secondary">No notes</Text>,
		},
		{
			title: "Actions",
			key: "actions",
			render: (_, record) => (
				<Space size="small" onClick={(e) => e.stopPropagation()}>
					<Button
						type="primary"
						icon={<EditOutlined />}
						onClick={() => showPatientModal(record)}
					>
						Edit
					</Button>
					{isAdmin && (
						<Popconfirm
							title="Are you sure you want to delete this patient?"
							okText="Yes"
							cancelText="No"
							icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
							onConfirm={() => handleDeletePatient(record._id)}
						>
							<Button type="danger" icon={<DeleteOutlined />}>
								Delete
							</Button>
						</Popconfirm>
					)}
				</Space>
			),
		},
	];

	return (
		<div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: 16,
				}}
			>
				<Title level={2} style={{ color: "#1890ff" }}>
					Patients Management
				</Title>
				<Button
					type="primary"
					icon={<UserAddOutlined />}
					onClick={() => showPatientModal()}
				>
					Add New Patient
				</Button>
			</div>{" "}
			<Card>
				{" "}
				<Table
					columns={columns}
					dataSource={patients}
					rowKey="_id"
					loading={loading}
					pagination={{ pageSize: 10 }}
					onRow={(record) => ({
						onClick: (e) => {
							if (
								e.target.closest(".ant-table-row-expand-icon") ||
								e.target.closest(".ant-btn")
							) {
								return;
							}
							navigate(`/patients/${record._id}`);
						},
						style: { cursor: "pointer" },
						className: "clickable-row",
					})}
					expandable={{
						expandedRowRender: (record) => (
							<Tabs defaultActiveKey="1">
								<TabPane tab="Personal Details" key="1">
									<p>
										<strong>Address:</strong> {record.address || "Not provided"}
									</p>
									<p>
										<strong>Birth Date:</strong>{" "}
										{record.birthDate
											? moment(record.birthDate).format("MMMM D, YYYY")
											: "Not provided"}
									</p>
									<p>
										<strong>Gender:</strong> {record.gender}
									</p>
								</TabPane>
								<TabPane tab="Medical History" key="2">
									<p>
										<strong>Medical Notes:</strong>{" "}
										{record.medicalNotes || "No medical notes"}
									</p>
									<p>
										<strong>Allergies:</strong>{" "}
										{record.allergies && record.allergies.length > 0
											? record.allergies.map((a) => a.name).join(", ")
											: "No allergies recorded"}
									</p>
								</TabPane>
							</Tabs>
						),
					}}
				/>
			</Card>
			<Modal
				title={editingPatient ? "Edit Patient" : "Add New Patient"}
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
				footer={null}
				width={700}
			>
				<Form
					form={form}
					layout="vertical"
					onFinish={handleFormSubmit}
					initialValues={{ gender: "Male" }}
				>
					<Tabs defaultActiveKey="1">
						<TabPane tab="Personal Information" key="1">
							<Form.Item
								name="name"
								label="Full Name"
								rules={[
									{ required: true, message: "Please enter the patient name" },
								]}
							>
								<Input placeholder="Enter full name" />
							</Form.Item>

							<Form.Item
								name="email"
								label="Email"
								rules={[
									{ required: true, message: "Please enter email" },
									{ type: "email", message: "Please enter a valid email" },
								]}
							>
								<Input placeholder="Enter email address" />
							</Form.Item>

							<Form.Item
								name="phone"
								label="Phone Number"
								rules={[
									{ required: true, message: "Please enter phone number" },
								]}
							>
								<Input placeholder="Enter phone number" />
							</Form.Item>

							<Form.Item
								name="gender"
								label="Gender"
								rules={[{ required: true, message: "Please select gender" }]}
							>
								<Select placeholder="Select gender">
									<Option value="Male">Male</Option>
									<Option value="Female">Female</Option>
									<Option value="Other">Other</Option>
								</Select>
							</Form.Item>

							<Form.Item name="birthDate" label="Birth Date">
								<DatePicker style={{ width: "100%" }} />
							</Form.Item>

							<Form.Item name="address" label="Address">
								<TextArea rows={2} placeholder="Enter address" />
							</Form.Item>
						</TabPane>

						<TabPane tab="Medical Information" key="2">
							{" "}
							<Form.Item name="allergies" label="Allergies">
								<Select
									mode="multiple"
									placeholder="Select allergies"
									style={{ width: "100%" }}
									optionLabelProp="label"
								>
									{" "}
									{allergies.map((allergy) => (
										<Option
											key={allergy._id}
											value={allergy._id}
											label={allergy.name}
										>
											<div>
												<strong>{allergy.name}</strong>
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
													style={{ marginLeft: 8 }}
												>
													{allergy.type}
												</Tag>
											</div>
											<div style={{ fontSize: "0.8em", color: "#999" }}>
												{allergy.description}
											</div>
										</Option>
									))}
								</Select>
							</Form.Item>
							<Form.Item name="medicalNotes" label="Medical Notes">
								<TextArea
									rows={4}
									placeholder="Enter any medical notes or history"
								/>
							</Form.Item>
							{isAdmin && (
								<Form.Item
									name="doctorId"
									label="Assigned Doctor"
									rules={[
										{ required: true, message: "Please assign a doctor" },
									]}
								>
									<Select placeholder="Select a doctor">
										<Option value={1}>Dr. Smith</Option>
										<Option value={2}>Dr. Johnson</Option>
									</Select>
								</Form.Item>
							)}
							{isDoctor && (
								<Form.Item name="doctorId" hidden={true}>
									<Input />
								</Form.Item>
							)}
						</TabPane>
					</Tabs>

					<div style={{ textAlign: "right", marginTop: 24 }}>
						<Space>
							<Button onClick={() => setModalVisible(false)}>Cancel</Button>
							<Button type="primary" htmlType="submit">
								{editingPatient ? "Update Patient" : "Add Patient"}
							</Button>
						</Space>
					</div>
				</Form>
			</Modal>
		</div>
	);
};

export default PatientsList;
