import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import {
	Badge,
	Button,
	Card,
	Col,
	DatePicker,
	Descriptions,
	Form,
	Input,
	message,
	Modal,
	Row,
	Select,
	Space,
	Table,
	Tag,
	TimePicker,
	Typography,
} from "antd";
import moment from "moment";
import "moment/locale/en-gb";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import interventionService from "../../api/interventionService";
import interventionTypeService from "../../api/interventionTypeService";
import patientService from "../../api/patientService";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const InterventionsList = () => {
	moment.locale("en-gb");

	const [interventions, setInterventions] = useState([]);
	const [patients, setPatients] = useState([]);
	const [interventionTypes, setInterventionTypes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [modalVisible, setModalVisible] = useState(false);
	const [editingIntervention] = useState(null);
	const [form] = Form.useForm();
	const { isAdmin, isDoctor, user } = useAuth();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				let interventionsData;
				let patientsData;

				if (isAdmin) {
					interventionsData = await interventionService.getAllInterventions();
					patientsData = await patientService.getAllPatients();
				} else if (isDoctor) {
					interventionsData =
						await interventionService.getInterventionsByDoctor(user.id);
					patientsData = await patientService.getPatientsByDoctor(user.id);
				} else {
					interventionsData =
						await interventionService.getInterventionsByPatient(user.patientId);
					patientsData = [];
				}

				for (let i = 0; i < interventionsData.length; i++) {
					const intervention = interventionsData[i];

					if (
						intervention.patient &&
						typeof intervention.patient === "string"
					) {
						intervention.patient = await getPatientInfo(intervention.patient);
					}
				}

				const typesData =
					await interventionTypeService.getAllInterventionTypes();

				setInterventions(interventionsData);
				setPatients(patientsData);
				setInterventionTypes(typesData);
			} catch (error) {
				console.error("Error fetching data:", error);
				message.error("Failed to load interventions data");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [isAdmin, isDoctor, user]);

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

	const handleFormSubmit = async (values) => {
		try {
			const formattedValues = {
				...values,
				date: values.date ? values.date.format("YYYY-MM-DD") : null,
				appointmentDate:
					values.appointmentDate && values.appointmentTime
						? `${values.appointmentDate.format(
								"YYYY-MM-DD"
						  )}T${values.appointmentTime.format("HH:mm:ss")}`
						: null,
			};

			delete formattedValues.appointmentTime;

			if (editingIntervention) {
				await interventionService.updateIntervention(
					editingIntervention.id,
					formattedValues
				);
				message.success("Intervention updated successfully");
			} else {
				await interventionService.createIntervention(formattedValues);
				message.success("Intervention created successfully");
			}

			const updatedInterventions = isAdmin
				? await interventionService.getAllInterventions()
				: isDoctor
				? await interventionService.getInterventionsByDoctor(user.id)
				: await interventionService.getInterventionsByPatient(user.id);

			setInterventions(updatedInterventions);
			setModalVisible(false);
			form.resetFields();
		} catch (error) {
			console.error("Error saving intervention:", error);
			message.error("Failed to save intervention");
		}
	};

	const getStatusBadge = (intervention) => {
		if (intervention.state === "completed") {
			return <Badge status="success" text="Completed" />;
		} else if (intervention.state === "canceled") {
			return <Badge status="error" text="Canceled" />;
		} else if (intervention.state === "scheduled") {
			return <Badge status="processing" text="Scheduled" />;
		} else {
			return <Badge status="warning" text="Unknown" />;
		}
	};

	const columns = [
		{
			title: "Patient",
			dataIndex: "patient",
			key: "patient",
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (p) => (
				<Link to={`/patients/${p._id}`}>
					<Text strong>
						{p.name} {p.surname}
					</Text>
				</Link>
			),
		},
		{
			title: "Intervention Type",
			dataIndex: "interventionType",
			key: "interventionType",
			render: (id) => (
				<Tag color="blue">
					{interventionTypes.find((type) => type._id === id)?.name ||
						"Unknown Type"}
				</Tag>
			),
		},
		{
			title: "Status",
			key: "status",
			render: (_, record) => getStatusBadge(record),
		},
		{
			title: "Date",
			key: "date",
			render: (_, record) =>
				record.date ? (
					<Space direction="vertical" size={0}>
						<span>
							<CalendarOutlined /> {moment(record.date).format("MMM D, YYYY")}
						</span>
						<span>
							<ClockCircleOutlined /> {moment(record.date).format("h:mm A")}
						</span>
					</Space>
				) : (
					<Text type="secondary">Not scheduled</Text>
				),
		},
		{
			title: "Teeth",
			dataIndex: "teethAffected",
			render: (teeth) => {
				if (!teeth || teeth.length === 0) {
					return <Text type="secondary">Not specified</Text>;
				}

				const formattedTeeth = teeth.map((tooth) => (
					<Tag key={tooth} color="green">
						{tooth}
					</Tag>
				));

				return <Space>{formattedTeeth}</Space>;
			},
		},
	];

	return (
		<div>
			<Card>
				<Table
					columns={columns}
					dataSource={interventions}
					rowKey="_id"
					loading={loading}
					pagination={{ pageSize: 10 }}
					expandable={{
						expandedRowRender: (record) => (
							<Descriptions title="Intervention Details" column={2}>
								<Descriptions.Item label="Notes" span={2}>
									{record.notes || "No notes provided"}
								</Descriptions.Item>
								<Descriptions.Item label="Cost">
									{record.cost ? `$${record.cost.toFixed(2)}` : "Not specified"}
								</Descriptions.Item>
								<Descriptions.Item label="Created At">
									{record.createdAt
										? moment(record.createdAt).format("MMMM D, YYYY, h:mm A")
										: "Unknown"}
								</Descriptions.Item>
								<Descriptions.Item label="Last Updated">
									{record.updatedAt
										? moment(record.updatedAt).format("MMMM D, YYYY, h:mm A")
										: "Unknown"}
								</Descriptions.Item>
								<Descriptions.Item label="Doctor">
									{record.doctorName || "Not assigned"}
								</Descriptions.Item>
							</Descriptions>
						),
					}}
				/>
			</Card>

			<Modal
				title={
					editingIntervention ? "Edit Intervention" : "Add New Intervention"
				}
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
				footer={null}
				width={700}
			>
				<Form form={form} layout="vertical" onFinish={handleFormSubmit}>
					{(isAdmin || isDoctor) && (
						<Form.Item
							name="patientId"
							label="Patient"
							rules={[{ required: true, message: "Please select a patient" }]}
						>
							<Select
								placeholder="Select patient"
								showSearch
								optionFilterProp="children"
							>
								{patients.map((patient) => (
									<Option key={patient.id} value={patient.id}>
										{patient.name}
									</Option>
								))}
							</Select>
						</Form.Item>
					)}

					<Form.Item
						name="interventionTypeId"
						label="Intervention Type"
						rules={[
							{ required: true, message: "Please select an intervention type" },
						]}
					>
						<Select placeholder="Select intervention type">
							{interventionTypes.map((type) => (
								<Option key={type.id} value={type.id}>
									{type.name}
								</Option>
							))}
						</Select>
					</Form.Item>

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item name="appointmentDate" label="Appointment Date">
								<DatePicker style={{ width: "100%" }} />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item name="appointmentTime" label="Appointment Time">
								<TimePicker
									style={{ width: "100%" }}
									format="HH:mm"
									minuteStep={15}
								/>
							</Form.Item>
						</Col>
					</Row>

					<Form.Item name="date" label="Completion Date">
						<DatePicker style={{ width: "100%" }} />
					</Form.Item>

					<Form.Item name="notes" label="Notes">
						<TextArea
							rows={4}
							placeholder="Enter any notes about the intervention"
						/>
					</Form.Item>

					<Form.Item name="cost" label="Cost ($)">
						<Input type="number" min={0} step={0.01} placeholder="Enter cost" />
					</Form.Item>

					{isDoctor && (
						<Form.Item name="doctorId" hidden={true}>
							<Input />
						</Form.Item>
					)}

					{isAdmin && (
						<Form.Item
							name="doctorId"
							label="Assigned Doctor"
							rules={[{ required: true, message: "Please assign a doctor" }]}
						>
							<Select placeholder="Select a doctor">
								<Option value={1}>Dr. Smith</Option>
								<Option value={2}>Dr. Johnson</Option>
							</Select>
						</Form.Item>
					)}

					<div style={{ textAlign: "right", marginTop: 24 }}>
						<Space>
							<Button onClick={() => setModalVisible(false)}>Cancel</Button>
							<Button type="primary" htmlType="submit">
								{editingIntervention
									? "Update Intervention"
									: "Add Intervention"}
							</Button>
						</Space>
					</div>
				</Form>
			</Modal>
		</div>
	);
};

export default InterventionsList;
