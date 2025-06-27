import {
	LockOutlined,
	MailOutlined,
	PhoneOutlined,
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
	Select,
	Typography,
} from "antd";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const { Title } = Typography;
const { Option } = Select;

const Register = () => {
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);
	const { register, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	const onFinish = async (values) => {
		setError(null);
		setLoading(true);

		if (values.password !== values.confirmPassword) {
			setError("Passwords do not match");
			setLoading(false);
			return;
		}

		try {
			const { ...userData } = values;
			await register(userData);
			navigate("/login", { state: { registered: true } });
		} catch (err) {
			setError(err.message || "Failed to register. Please try again.");
		} finally {
			setLoading(false);
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
						src="/logo.png"
						alt="Dental Clinic Logo"
						style={{ height: "80px", marginBottom: "16px" }}
					/>
					<Title level={2} style={{ color: "#1890ff", margin: 0 }}>
						Dental Clinic
					</Title>
					<Typography.Paragraph type="secondary">
						Create a new account to access our services
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
							message="Registration Error"
							description={error}
							type="error"
							showIcon
							style={{ marginBottom: "16px" }}
						/>
					)}

					<Form name="register" onFinish={onFinish} layout="vertical">
						<Form.Item
							name="name"
							rules={[
								{ required: true, message: "Please enter your full name!" },
							]}
						>
							<Input
								prefix={<UserOutlined />}
								placeholder="Full Name"
								size="large"
							/>
						</Form.Item>

						<Form.Item
							name="email"
							rules={[
								{ required: true, message: "Please enter your email!" },
								{
									type: "email",
									message: "Please enter a valid email address!",
								},
							]}
						>
							<Input
								prefix={<MailOutlined />}
								placeholder="Email"
								size="large"
							/>
						</Form.Item>

						<Form.Item
							name="phone"
							rules={[
								{ required: true, message: "Please enter your phone number!" },
								{
									pattern: /^\d{9,15}$/,
									message: "Please enter a valid phone number!",
								},
							]}
						>
							<Input
								prefix={<PhoneOutlined />}
								placeholder="Phone Number"
								size="large"
							/>
						</Form.Item>

						<Form.Item
							name="role"
							rules={[{ required: true, message: "Please select your role!" }]}
						>
							<Select placeholder="Select your role" size="large">
								<Option value="patient">Patient</Option>
								<Option value="doctor">Doctor</Option>
							</Select>
						</Form.Item>

						<Form.Item
							name="password"
							rules={[
								{ required: true, message: "Please enter your password!" },
								{
									min: 6,
									message: "Password must be at least 6 characters long!",
								},
							]}
						>
							<Input.Password
								prefix={<LockOutlined />}
								placeholder="Password"
								size="large"
							/>
						</Form.Item>

						<Form.Item
							name="confirmPassword"
							rules={[
								{ required: true, message: "Please confirm your password!" },
								{
									min: 6,
									message: "Password must be at least 6 characters long!",
								},
							]}
						>
							<Input.Password
								prefix={<LockOutlined />}
								placeholder="Confirm Password"
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
								Register
							</Button>
						</Form.Item>
					</Form>

					<Divider plain>Already have an account?</Divider>

					<Button
						type="default"
						block
						onClick={() => navigate("/login")}
						style={{ height: "40px" }}
					>
						Log In Now
					</Button>
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

export default Register;
