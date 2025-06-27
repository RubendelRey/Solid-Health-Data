import {
	CrownOutlined,
	LockOutlined,
	MedicineBoxOutlined,
	TeamOutlined,
	UserOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Col,
	Divider,
	Form,
	Input,
	Row,
	Space,
	Typography,
} from "antd";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const { Title } = Typography;

const Login = () => {
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);
	const { login, isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const [form] = Form.useForm();

	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	const onFinish = async (values) => {
		setError(null);
		setLoading(true);
		try {
			await login(values.email, values.password);
			navigate("/");
		} catch (err) {
			setError(
				err.message || "Failed to login. Please check your credentials."
			);
		} finally {
			setLoading(false);
		}
	};

	const fillCredentials = (userType) => {
		const credentials = {
			admin: {
				email: "admin@dentalclinic.com",
				password: "password",
			},
			doctor: {
				email: "john.smith@dentalclinic.com",
				password: "password",
			},
			patient: {
				email: "carlos@example.com",
				password: "password",
			},
			hospitalPatient1: {
				email: "patient1@hospital.com",
				password: "password",
			},
			hospitalPatient2: {
				email: "patient2@hospital.com",
				password: "password",
			},
		};

		const creds = credentials[userType];
		if (creds) {
			form.setFieldsValue(creds);
		}
	};

	return (
		<Row
			justify="center"
			align="middle"
			style={{ minHeight: "100vh", background: "#f0f2f5" }}
		>
			<Col xs={22} sm={16} md={12} lg={8} xl={6}>
				<div style={{ textAlign: "center", marginBottom: "24px" }}>
					<img
						src="public/logo.svg"
						alt="Dental Clinic Logo"
						style={{ height: "80px", marginBottom: "16px" }}
					/>
					<Title level={2} style={{ color: "#1890ff", margin: 0 }}>
						Dental Clinic
					</Title>
					<Typography.Paragraph type="secondary">
						Welcome back! Please login to your account
					</Typography.Paragraph>
				</div>

				<Card
					style={{
						borderRadius: "8px",
						boxShadow:
							"0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)",
					}}
				>
					{error && (
						<Alert
							message="Login Error"
							description={error}
							type="error"
							showIcon
							style={{ marginBottom: "16px" }}
						/>
					)}

					<Form
						name="login"
						form={form}
						initialValues={{ remember: true }}
						onFinish={onFinish}
						layout="vertical"
					>
						<Form.Item
							name="email"
							rules={[
								{ required: true, message: "Please input your email!" },
								{
									type: "email",
									message: "Please enter a valid email address!",
								},
							]}
						>
							<Input
								prefix={<UserOutlined />}
								placeholder="Email"
								size="large"
							/>
						</Form.Item>
						<Form.Item
							name="password"
							rules={[
								{ required: true, message: "Please input your password!" },
							]}
						>
							<Input.Password
								prefix={<LockOutlined />}
								placeholder="Password"
								size="large"
							/>
						</Form.Item>
						<Form.Item>
							<Button
								type="primary"
								htmlType="submit"
								size="large"
								block
								loading={loading}
								style={{ height: "40px" }}
							>
								Log in
							</Button>
						</Form.Item>

						<Divider plain>Fill Demo Credentials</Divider>

						<Form.Item>
							<Space
								direction="vertical"
								style={{ width: "100%" }}
								size="small"
							>
								<Button
									icon={<TeamOutlined />}
									size="large"
									block
									onClick={() => fillCredentials("admin")}
									style={{
										backgroundColor: "#722ed1",
										borderColor: "#722ed1",
										color: "white",
										height: "40px",
									}}
								>
									Fill Admin Credentials
								</Button>
								<Button
									icon={<MedicineBoxOutlined />}
									size="large"
									block
									onClick={() => fillCredentials("doctor")}
									style={{
										backgroundColor: "#13c2c2",
										borderColor: "#13c2c2",
										color: "white",
										height: "40px",
									}}
								>
									Fill Doctor Credentials
								</Button>
								<Button
									icon={<CrownOutlined />}
									size="large"
									block
									onClick={() => fillCredentials("patient")}
									style={{
										backgroundColor: "#52c41a",
										borderColor: "#52c41a",
										color: "white",
										height: "40px",
									}}
								>
									Fill Patient Credentials
								</Button>
								<Button
									icon={<UserOutlined />}
									size="large"
									block
									onClick={() => fillCredentials("hospitalPatient1")}
									style={{
										backgroundColor: "#1890ff",
										borderColor: "#1890ff",
										color: "white",
										height: "40px",
									}}
								>
									Fill Hospital Patient 1 Credentials
								</Button>
								<Button
									icon={<UserOutlined />}
									size="large"
									block
									onClick={() => fillCredentials("hospitalPatient2")}
									style={{
										backgroundColor: "#597ef7",
										borderColor: "#597ef7",
										color: "white",
										height: "40px",
									}}
								>
									Fill Hospital Patient 2 Credentials
								</Button>
							</Space>
						</Form.Item>
					</Form>
				</Card>
				<div style={{ textAlign: "center", marginTop: "24px" }}>
					<Typography.Text type="secondary">
						Dental Clinic ©{new Date().getFullYear()} - Your smile is our
						priority
					</Typography.Text>
				</div>
			</Col>
		</Row>
	);
};

export default Login;
