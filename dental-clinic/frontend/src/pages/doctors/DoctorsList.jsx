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
	Typography,
} from "antd";
import moment from "moment";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import doctorService from "../../api/doctorService";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const DoctorsList = () => {
	const [doctors, setDoctors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [modalVisible, setModalVisible] = useState(false);
	const [editingDoctor, setEditingDoctor] = useState(null);
	const [form] = Form.useForm();
	const { isAdmin } = useAuth();
	const navigate = useNavigate();

	const daysOfWeek = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday",
	];

	useEffect(() => {
		fetchDoctors();
	}, []);

	const fetchDoctors = async () => {
		try {
			setLoading(true);
			const doctorData = await doctorService.getAllDoctors();
			setDoctors(doctorData);
		} catch (error) {
			console.error("Error fetching data:", error);
			message.error("Failed to load doctors data");
		} finally {
			setLoading(false);
		}
	};

	const handleFormSubmit = async (values) => {
		try {
			const formattedWorkHours = {};
			Object.keys(values.workHours || {}).forEach((day) => {
				if (values.workHours[day] && values.workHours[day].length === 2) {
					formattedWorkHours[day] = {
						start: values.workHours[day][0]?.format("HH:mm"),
						end: values.workHours[day][1]?.format("HH:mm"),
					};
				}
			});

			const doctorData = {
				...values,
				workHours: formattedWorkHours,
			};

			if (editingDoctor) {
				await doctorService.updateDoctor(editingDoctor._id, doctorData);
				message.success("Doctor updated successfully");
			} else {
				await doctorService.createDoctor(doctorData);
				message.success("Doctor created successfully");
			}

			fetchDoctors();
			setModalVisible(false);
			form.resetFields();
		} catch (error) {
			console.error("Error saving doctor:", error);
			message.error("Failed to save doctor");
		}
	};

	const handleDeleteDoctor = async (id) => {
		try {
			await doctorService.deleteDoctor(id);
			message.success("Doctor deleted successfully");
			fetchDoctors();
		} catch (error) {
			console.error("Error deleting doctor:", error);
			message.error("Failed to delete doctor");
		}
	};

	const showDoctorModal = (doctor = null) => {
		setEditingDoctor(doctor);

		if (doctor) {
			const formattedWorkHours = {};

			if (doctor.workHours) {
				Object.keys(doctor.workHours).forEach((day) => {
					if (doctor.workHours[day]?.start && doctor.workHours[day]?.end) {
						formattedWorkHours[day] = [
							moment(doctor.workHours[day].start, "HH:mm"),
							moment(doctor.workHours[day].end, "HH:mm"),
						];
					}
				});
			}

			form.setFieldsValue({
				...doctor,
				workHours: formattedWorkHours,
			});
		} else {
			form.resetFields();
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
						<Tag color="blue">{record.specialization || "General Dentist"}</Tag>
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
			title: "Schedule",
			key: "schedule",
			render: (_, record) => {
				const workingDays = record.workHours
					? Object.keys(record.workHours)
					: [];

				return workingDays.length > 0 ? (
					<Space size={[0, 8]} wrap>
						{workingDays.map((day) => (
							<Tag color="green" key={day}>
								{day.substring(0, 3)}
							</Tag>
						))}
					</Space>
				) : (
					<Text type="secondary">No schedule defined</Text>
				);
			},
		},
		{
			title: "Actions",
			key: "actions",
			render: (_, record) => (
				<Space size="small" onClick={(e) => e.stopPropagation()}>
					<Button
						type="primary"
						icon={<EditOutlined />}
						onClick={() => showDoctorModal(record)}
					>
						Edit
					</Button>
					{isAdmin && (
						<Popconfirm
							title="Are you sure you want to delete this doctor?"
							okText="Yes"
							cancelText="No"
							icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
							onConfirm={() => handleDeleteDoctor(record._id)}
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

	if (!isAdmin) {
		return (
			<div>
				{" "}
				<Title level={2} style={{ color: "#1890ff", marginBottom: 16 }}>
					Dental Clinic Doctors
				</Title>{" "}
				<Card>
					{" "}
					<Table
						columns={columns.filter((col) => col.key !== "actions")}
						dataSource={doctors}
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
								navigate(`/doctors/${record._id}`);
							},
							style: { cursor: "pointer" },
							className: "clickable-row",
						})}
						expandable={{
							expandedRowRender: (record) => (
								<Tabs defaultActiveKey="1">
									<TabPane tab="Professional Details" key="1">
										<p>
											<strong>Specialization:</strong>{" "}
											{record.specialization || "General Dentist"}
										</p>
										<p>
											<strong>Bio:</strong> {record.bio || "No bio provided"}
										</p>
									</TabPane>
									<TabPane tab="Schedule" key="2">
										{record.workHours &&
										Object.keys(record.workHours).length > 0 ? (
											<ul>
												{Object.entries(record.workHours).map(
													([day, hours]) => (
														<li key={day}>
															<strong>{day}:</strong> {hours.start} -{" "}
															{hours.end}
														</li>
													)
												)}
											</ul>
										) : (
											<p>No schedule defined</p>
										)}
									</TabPane>
								</Tabs>
							),
						}}
					/>
				</Card>
			</div>
		);
	}

	return (
		<div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: 16,
				}}
			>
				{" "}
				<Title level={2} style={{ color: "#1890ff" }}>
					Doctors Management
				</Title>
				<Button
					type="primary"
					icon={<UserAddOutlined />}
					onClick={() => showDoctorModal()}
				>
					Add New Doctor
				</Button>
			</div>{" "}
			<Card>
				{" "}
				<Table
					columns={columns}
					dataSource={doctors}
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
							navigate(`/doctors/${record._id}`);
						},
						style: { cursor: "pointer" },
						className: "clickable-row",
					})}
					expandable={{
						expandedRowRender: (record) => (
							<Tabs defaultActiveKey="1">
								<TabPane tab="Professional Details" key="1">
									<p>
										<strong>Specialization:</strong>{" "}
										{record.specialization || "General Dentist"}
									</p>
									<p>
										<strong>Bio:</strong> {record.bio || "No bio provided"}
									</p>
								</TabPane>
								<TabPane tab="Schedule" key="2">
									{record.workHours &&
									Object.keys(record.workHours).length > 0 ? (
										<ul>
											{Object.entries(record.workHours).map(([day, hours]) => (
												<li key={day}>
													<strong>{day}:</strong> {hours.start} - {hours.end}
												</li>
											))}
										</ul>
									) : (
										<p>No schedule defined</p>
									)}
								</TabPane>
							</Tabs>
						),
					}}
				/>
			</Card>
			<Modal
				title={editingDoctor ? "Edit Doctor" : "Add New Doctor"}
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
				footer={null}
				width={800}
			>
				<Form form={form} layout="vertical" onFinish={handleFormSubmit}>
					<Tabs defaultActiveKey="1">
						<TabPane tab="Personal Information" key="1">
							<Form.Item
								name="name"
								label="Full Name"
								rules={[
									{ required: true, message: "Please enter the doctor name" },
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
						</TabPane>

						<TabPane tab="Professional Information" key="2">
							<Form.Item name="specialization" label="Specialization">
								<Input placeholder="Enter specialization (e.g., Orthodontist, Periodontist)" />
							</Form.Item>

							<Form.Item name="bio" label="Professional Bio">
								<TextArea rows={4} placeholder="Enter professional biography" />
							</Form.Item>
						</TabPane>

						<TabPane tab="Schedule" key="3">
							{daysOfWeek.map((day) => (
								<Form.Item key={day} label={day} name={["workHours", day]}>
									{" "}
									<DatePicker.RangePicker
										picker="time"
										format="HH:mm"
										placeholder={["Start time", "End time"]}
										style={{ width: "100%" }}
									/>
								</Form.Item>
							))}
						</TabPane>
					</Tabs>

					<div style={{ textAlign: "right", marginTop: 24 }}>
						<Space>
							<Button onClick={() => setModalVisible(false)}>Cancel</Button>
							<Button type="primary" htmlType="submit">
								{editingDoctor ? "Update Doctor" : "Add Doctor"}
							</Button>
						</Space>
					</div>
				</Form>
			</Modal>
		</div>
	);
};

export default DoctorsList;
