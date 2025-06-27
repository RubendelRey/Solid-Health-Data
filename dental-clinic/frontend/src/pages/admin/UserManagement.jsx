import {
	DeleteOutlined,
	IdcardOutlined,
	LockOutlined,
	MailOutlined,
	MedicineBoxOutlined,
	UserAddOutlined,
	UserOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Col,
	Form,
	Input,
	message,
	Modal,
	Popconfirm,
	Row,
	Select,
	Space,
	Table,
	Tag,
	Typography,
} from "antd";
import { useEffect, useState } from "react";
import userService from "../../api/userService";

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
	const [visible, setVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	const [users, setUsers] = useState([]);
	const [selectedRole, setSelectedRole] = useState("");
	const [step, setStep] = useState(1);
	const [form] = Form.useForm();

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const data = await userService.getAllUsers();
			setUsers(data);
		} catch (error) {
			message.error(error.message || "Failed to fetch users");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	const handleDelete = async (userId) => {
		try {
			await userService.deleteUser(userId);
			message.success("User deleted successfully");
			fetchUsers();
		} catch (error) {
			message.error(error.message || "Failed to delete user");
		}
	};

	const showModal = () => {
		setVisible(true);
	};
	const handleCancel = () => {
		setVisible(false);
		setSelectedRole("");
		setStep(1);
		form.resetFields();
	};

	const handleRoleSelect = (role) => {
		setSelectedRole(role);
		setStep(2);
	};

	const handleBack = () => {
		setStep(1);
		setSelectedRole("");
	};

	const handleSubmit = async (values) => {
		setLoading(true);
		try {
			let userData = {
				...values,
				role: selectedRole,
			};

			if (selectedRole === "patient") {
				userData.patientData = {
					...values.patientData,
					name: values.name,
					surname: values.surname,
					phoneNumbers: values.patientData.phoneNumbers
						? [values.patientData.phoneNumbers]
						: [],
				};
			} else if (selectedRole === "doctor") {
				userData.doctorData = {
					...values.doctorData,
				};
			}

			await userService.createUser(userData);
			message.success("User created successfully");
			handleCancel();
			fetchUsers();
		} catch (error) {
			message.error(error.message || "Failed to create user");
		} finally {
			setLoading(false);
		}
	};
	const roleFields = {
		patient: [
			<Form.Item
				key="nif"
				name={["patientData", "nif"]}
				label="NIF/DNI"
				rules={[{ required: true, message: "Please input NIF/DNI!" }]}
			>
				<Input prefix={<IdcardOutlined />} />
			</Form.Item>,
			<Form.Item
				key="dateOfBirth"
				name={["patientData", "dateOfBirth"]}
				label="Date of Birth"
				rules={[{ required: true, message: "Please input date of birth!" }]}
			>
				<Input type="date" />
			</Form.Item>,
			<Form.Item
				key="gender"
				name={["patientData", "gender"]}
				label="Gender"
				rules={[{ required: true, message: "Please select gender!" }]}
			>
				<Select>
					<Option value="male">Male</Option>
					<Option value="female">Female</Option>
					<Option value="other">Other</Option>
				</Select>
			</Form.Item>,
			<Form.Item
				key="phone"
				name={["patientData", "phoneNumbers"]}
				label="Phone Number"
				rules={[{ required: true, message: "Please input phone number!" }]}
			>
				<Input />
			</Form.Item>,
			<Form.Item
				key="address"
				name={["patientData", "address"]}
				label="Address"
			>
				<Input.TextArea />
			</Form.Item>,
		],
		doctor: [
			<Form.Item
				key="specialization"
				name={["doctorData", "specialization"]}
				label="Specialization"
				rules={[{ required: true, message: "Please input specialization!" }]}
			>
				<Input prefix={<MedicineBoxOutlined />} />
			</Form.Item>,
			<Form.Item
				key="collegiateNumber"
				name={["doctorData", "collegiateNumber"]}
				label="Collegiate Number"
				rules={[{ required: true, message: "Please input collegiate number!" }]}
			>
				<Input prefix={<IdcardOutlined />} />
			</Form.Item>,
			<Form.Item
				key="license"
				name={["doctorData", "license"]}
				label="Medical License"
				rules={[{ required: true, message: "Please input medical license!" }]}
			>
				<Input prefix={<IdcardOutlined />} />
			</Form.Item>,
			<Form.Item
				key="specialties"
				name={["doctorData", "specialties"]}
				label="Specialties"
			>
				<Select mode="tags" placeholder="Add specialties">
					<Option value="general">General Dentistry</Option>
					<Option value="orthodontics">Orthodontics</Option>
					<Option value="periodontics">Periodontics</Option>
					<Option value="endodontics">Endodontics</Option>
					<Option value="surgery">Oral Surgery</Option>
				</Select>
			</Form.Item>,
			<Form.Item
				key="biography"
				name={["doctorData", "biography"]}
				label="Professional Biography"
			>
				<Input.TextArea />
			</Form.Item>,
		],
	};
	const columns = [
		{
			title: "Name",
			dataIndex: "fullName",
			key: "fullName",
			render: (text, record) => (
				<Space>
					<UserOutlined />
					{text || `${record.name || ""} ${record.surname || ""}`.trim()}
				</Space>
			),
		},
		{
			title: "Email",
			dataIndex: "email",
			key: "email",
		},
		{
			title: "Role",
			dataIndex: "role",
			key: "role",
			render: (role) => {
				const color =
					role === "admin"
						? "red"
						: role === "doctor"
						? "blue"
						: role === "patient"
						? "green"
						: "default";

				return <Tag color={color}>{role.toUpperCase()}</Tag>;
			},
		},
		{
			title: "Actions",
			key: "actions",
			render: (_, record) => (
				<Space>
					<Popconfirm
						title="Delete user"
						description="Are you sure you want to delete this user?"
						onConfirm={() => handleDelete(record._id)}
						okText="Yes"
						cancelText="No"
					>
						<Button type="link" danger icon={<DeleteOutlined />} />
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<>
			<Row gutter={[16, 16]}>
				<Col span={24}>
					<Card>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: 16,
							}}
						>
							<Title level={2} style={{ margin: 0 }}>
								User Management
							</Title>
							<Button
								type="primary"
								onClick={showModal}
								icon={<UserAddOutlined />}
							>
								Create New User
							</Button>
						</div>
						<Table
							columns={columns}
							dataSource={users}
							rowKey="_id"
							loading={loading}
							pagination={{
								pageSize: 10,
								showSizeChanger: true,
								showTotal: (total) => `Total ${total} users`,
							}}
						/>
					</Card>
				</Col>
			</Row>{" "}
			<Modal
				title={
					step === 1
						? "Select User Type"
						: `Create New ${
								selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)
						  }`
				}
				open={visible}
				onCancel={handleCancel}
				footer={null}
				destroyOnClose
			>
				{step === 1 ? (
					<div style={{ padding: "20px 0" }}>
						<Row gutter={[16, 16]}>
							<Col span={24}>
								<Alert
									message="Choose the type of user you want to create"
									type="info"
									showIcon
									style={{ marginBottom: 24 }}
								/>
							</Col>
							<Col span={8}>
								<Card
									hoverable
									style={{ textAlign: "center", cursor: "pointer" }}
									onClick={() => handleRoleSelect("admin")}
								>
									<UserOutlined
										style={{ fontSize: "48px", color: "#ff4d4f" }}
									/>
									<Title level={4} style={{ marginTop: 16 }}>
										Admin
									</Title>
									<p>System administrator with full access</p>
								</Card>
							</Col>
							<Col span={8}>
								<Card
									hoverable
									style={{ textAlign: "center", cursor: "pointer" }}
									onClick={() => handleRoleSelect("doctor")}
								>
									<MedicineBoxOutlined
										style={{ fontSize: "48px", color: "#1890ff" }}
									/>
									<Title level={4} style={{ marginTop: 16 }}>
										Doctor
									</Title>
									<p>Medical professional with clinical access</p>
								</Card>
							</Col>
							<Col span={8}>
								<Card
									hoverable
									style={{ textAlign: "center", cursor: "pointer" }}
									onClick={() => handleRoleSelect("patient")}
								>
									<UserOutlined
										style={{ fontSize: "48px", color: "#52c41a" }}
									/>
									<Title level={4} style={{ marginTop: 16 }}>
										Patient
									</Title>
									<p>Patient with appointment and record access</p>
								</Card>
							</Col>
						</Row>
					</div>
				) : (
					<Form form={form} layout="vertical" onFinish={handleSubmit}>
						<Row gutter={16}>
							<Col span={12}>
								<Form.Item
									name="name"
									label="Name"
									rules={[{ required: true, message: "Please input name!" }]}
								>
									<Input prefix={<UserOutlined />} />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									name="surname"
									label="Surname"
									rules={[{ required: true, message: "Please input surname!" }]}
								>
									<Input prefix={<UserOutlined />} />
								</Form.Item>
							</Col>
						</Row>

						<Form.Item
							name="email"
							label="Email"
							rules={[
								{ required: true, message: "Please input email!" },
								{ type: "email", message: "Please enter a valid email!" },
							]}
						>
							<Input prefix={<MailOutlined />} />
						</Form.Item>

						<Form.Item
							name="password"
							label="Password"
							rules={[{ required: true, message: "Please input password!" }]}
						>
							<Input.Password prefix={<LockOutlined />} />
						</Form.Item>

						{selectedRole !== "admin" && (
							<>
								<Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
									{selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}{" "}
									Information
								</Title>
								{roleFields[selectedRole]}
							</>
						)}

						<Form.Item style={{ marginTop: 24 }}>
							<Space style={{ width: "100%", justifyContent: "space-between" }}>
								<Button onClick={handleBack}>Back</Button>
								<Space>
									<Button onClick={handleCancel}>Cancel</Button>
									<Button type="primary" htmlType="submit" loading={loading}>
										Create{" "}
										{selectedRole.charAt(0).toUpperCase() +
											selectedRole.slice(1)}
									</Button>
								</Space>
							</Space>
						</Form.Item>
					</Form>
				)}
			</Modal>
		</>
	);
};

export default UserManagement;
