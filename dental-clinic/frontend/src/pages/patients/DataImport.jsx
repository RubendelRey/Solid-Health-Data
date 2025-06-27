import {
	CheckCircleOutlined,
	CloudDownloadOutlined,
	FileTextOutlined,
	ImportOutlined,
	InfoCircleOutlined,
	LoadingOutlined,
	SafetyOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Col,
	Form,
	Input,
	notification,
	Result,
	Row,
	Space,
	Spin,
	Steps,
	Typography,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import solidService from "../../api/solidService";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const DataImport = () => {
	const [cookie, setCookie] = useCookies(["solidSession"]);
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [solidProvider, setSolidProvider] = useState("");
	const [checkingAuth, setCheckingAuth] = useState(true);
	const checkSolidLoginStatus = useCallback(async () => {
		setCheckingAuth(true);
		try {
			setCurrentStep(cookie.solidSession === true ? 1 : 0);
		} catch (error) {
			console.error("Error checking Solid login status:", error);
			setCurrentStep(0);
		} finally {
			setCheckingAuth(false);
		}
	}, [cookie.solidSession]);

	useEffect(() => {
		solidService.isLoggedIn().then((response) => {
			setCookie("solidSession", response.isLoggedIn);
			checkSolidLoginStatus();
		});
	}, [cookie.solidSession, setCookie, checkSolidLoginStatus]);

	useEffect(() => {
		solidService.isLoggedIn().then((response) => {
			setCookie("solidSession", response.isLoggedIn);
			checkSolidLoginStatus();
		});
	}, [setCookie, checkSolidLoginStatus]);

	const handleSolidLogin = async (providerUrl = null) => {
		const urlToUse = providerUrl || solidProvider;
		if (!urlToUse) {
			notification.error({
				message: "Provider Required",
				description: "Please enter your Solid provider URL",
			});
			return;
		}

		try {
			let finalUrl = urlToUse;
			if (!urlToUse.startsWith("http://") && !urlToUse.startsWith("https://")) {
				finalUrl = `https://${urlToUse}`;
			}

			await solidService.login(finalUrl);
		} catch (error) {
			notification.error({
				message: "Connection Failed",
				description: error.message,
			});
		}
	};
	const handleDataImport = async (values) => {
		setLoading(true);
		try {
			await solidService.importUserData({
				routeDataset: values.dataRoute,
				routeShape: values.shapeRoute,
				routeShapeMap: values.shapeMapRoute,
			});

			setCurrentStep(2);
			notification.success({
				message: "Import Successful",
				description:
					"Your data has been successfully imported from your Solid pod",
			});
		} catch (error) {
			notification.error({
				message: "Import Failed",
				description: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	const stepContent = [
		<Card
			title={
				<Space>
					<SafetyOutlined />
					Connect to Solid Pod
				</Space>
			}
			style={{ marginBottom: 24 }}
		>
			<Row gutter={[24, 24]}>
				<Col span={24}>
					<Alert
						message="Secure Data Import"
						description="Connect to your Solid pod to securely import your dental clinic data. Your personal data will be retrieved from your pod and integrated into the system."
						type="info"
						icon={<SafetyOutlined />}
						style={{ marginBottom: 24 }}
					/>
				</Col>

				<Col span={24}>
					<Space direction="vertical" style={{ width: "100%" }}>
						<Text strong>Solid Provider URL:</Text>
						<Input
							placeholder="solidcommunity.net or solidweb.org"
							value={solidProvider}
							onChange={(e) => setSolidProvider(e.target.value)}
							size="large"
						/>
						<Text type="secondary">
							Or click on a popular provider below to connect directly:
						</Text>
					</Space>
				</Col>

				<Col span={24}>
					<Space direction="vertical" style={{ width: "100%" }} size="small">
						<Text strong>Popular SOLID Providers:</Text>
						<Row gutter={[8, 8]}>
							<Col span={12}>
								<Button
									block
									onClick={() =>
										handleSolidLogin("https://solidcommunity.net/")
									}
									loading={loading}
									style={{
										backgroundColor: "#1890ff",
										borderColor: "#1890ff",
										color: "white",
										height: "auto",
										padding: "12px",
									}}
								>
									<div style={{ textAlign: "center" }}>
										<div style={{ fontWeight: "bold", fontSize: "14px" }}>
											Solid Community
										</div>
										<div
											style={{
												fontSize: "11px",
												opacity: 0.8,
												marginTop: "2px",
											}}
										>
											solidcommunity.net
										</div>
									</div>
								</Button>
							</Col>
							<Col span={12}>
								<Button
									block
									onClick={() => handleSolidLogin("https://solidweb.org/")}
									loading={loading}
									style={{
										backgroundColor: "#52c41a",
										borderColor: "#52c41a",
										color: "white",
										height: "auto",
										padding: "12px",
									}}
								>
									<div style={{ textAlign: "center" }}>
										<div style={{ fontWeight: "bold", fontSize: "14px" }}>
											Solid Web
										</div>
										<div
											style={{
												fontSize: "11px",
												opacity: 0.8,
												marginTop: "2px",
											}}
										>
											solidweb.org
										</div>
									</div>
								</Button>
							</Col>
						</Row>
					</Space>
				</Col>

				<Col span={24}>
					<Space style={{ width: "100%" }} direction="vertical">
						<Button
							type="primary"
							size="large"
							icon={<CloudDownloadOutlined />}
							onClick={handleSolidLogin}
							loading={loading}
							block
						>
							Connect to Solid Pod
						</Button>
						<Text
							type="secondary"
							style={{ textAlign: "center", display: "block" }}
						>
							You will be redirected to your Solid provider to authenticate
						</Text>
					</Space>
				</Col>
			</Row>
		</Card>,
		<Card
			title={
				<Space>
					<ImportOutlined />
					Configure Data Import
				</Space>
			}
			style={{ marginBottom: 24 }}
		>
			{" "}
			<Form
				form={form}
				layout="vertical"
				onFinish={handleDataImport}
				initialValues={{
					dataRoute: "hospital/data.ttl",
					shapeRoute: "hospital/shapes.shex",
					shapeMapRoute: "hospital/shape-map.sm",
				}}
			>
				<Row gutter={[24, 24]}>
					{" "}
					<Col span={24}>
						<Alert
							message="Import Configuration"
							description="Specify the paths in your Solid pod where your exported data, shapes, and shape maps are located. The system will retrieve and import this data into your current session."
							type="info"
							style={{ marginBottom: 24 }}
						/>
					</Col>
					<Col span={12}>
						<Form.Item
							label="Data Source Route"
							name="dataRoute"
							rules={[{ required: true, message: "Please enter data route" }]}
							tooltip="Path in your Solid pod where the clinical data is stored"
						>
							<Input
								placeholder="hospital/data.ttl"
								prefix={<FileTextOutlined />}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="Shape Route"
							name="shapeRoute"
							rules={[{ required: true, message: "Please enter shape route" }]}
							tooltip="Path where the ShEx shape schema is stored for data validation"
						>
							<Input
								placeholder="hospital/shapes.shex"
								prefix={<FileTextOutlined />}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="Shape Map Route"
							name="shapeMapRoute"
							rules={[
								{ required: true, message: "Please enter shape map route" },
							]}
							tooltip="Path where the shape map is stored to link data with validation rules"
						>
							<Input
								placeholder="hospital/shape-map.sm"
								prefix={<FileTextOutlined />}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Alert
							message="Import Information"
							description={
								<div>
									<p>The import process will:</p>
									<ul>
										<li>
											Retrieve data, shapes, and shape maps from your Solid pod
										</li>
										<li>
											Validate the data format and structure using the shapes
										</li>
										<li>Import compatible data into the current system</li>
										<li>Provide a summary of imported records</li>
									</ul>
								</div>
							}
							type="warning"
							icon={<InfoCircleOutlined />}
							style={{ marginBottom: 24 }}
						/>
					</Col>
					<Col span={24}>
						<Space style={{ width: "100%" }}>
							<Button
								type="primary"
								htmlType="submit"
								size="large"
								icon={<ImportOutlined />}
								loading={loading}
								block
							>
								Import Data from Solid Pod
							</Button>
						</Space>
					</Col>
				</Row>
			</Form>
		</Card>,
		<Card
			title={
				<Space>
					<CheckCircleOutlined style={{ color: "#52c41a" }} />
					Import Complete
				</Space>
			}
			style={{ marginBottom: 24 }}
		>
			<Result
				status="success"
				title="Data Successfully Imported!"
				subTitle="Your data has been securely imported from your Solid pod and is now available in the system."
				extra={[
					<Button key="import-more" onClick={() => setCurrentStep(1)}>
						Import More Data
					</Button>,
				]}
			/>
		</Card>,
	];

	const steps = [
		{
			title: "Connect",
			description: "Authenticate with Solid",
			icon: <SafetyOutlined />,
		},
		{
			title: "Configure",
			description: "Set import parameters",
			icon: <ImportOutlined />,
		},
		{
			title: "Complete",
			description: "Import finished",
			icon: <CheckCircleOutlined />,
		},
	];

	if (checkingAuth) {
		return (
			<div style={{ textAlign: "center", padding: "50px" }}>
				<Spin
					size="large"
					indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
				/>
				<Title level={4} style={{ marginTop: 16 }}>
					Checking Authentication Status...
				</Title>
			</div>
		);
	}

	return (
		<div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
			<Card>
				<div style={{ marginBottom: "32px", textAlign: "center" }}>
					<Title level={2}>
						<ImportOutlined style={{ marginRight: 8 }} />
						Import Data from Solid Pod
					</Title>
					<Paragraph>
						Securely import your dental clinic data from your personal Solid
						pod. Your data remains under your control while being integrated
						into the clinic management system.
					</Paragraph>
				</div>

				<Steps
					current={currentStep}
					items={steps}
					style={{ marginBottom: "32px" }}
				/>

				{stepContent[currentStep]}
			</Card>
		</div>
	);
};

export default DataImport;
