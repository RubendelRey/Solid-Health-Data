import {
	CheckCircleOutlined,
	CloudUploadOutlined,
	DownloadOutlined,
	FileTextOutlined,
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
	Select,
	Space,
	Spin,
	Steps,
	Typography,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import solidService from "../../api/solidService";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Step } = Steps;

const DataExport = () => {
	const [cookie, setCookie] = useCookies(["solidSession"]);
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [exportResult, setExportResult] = useState(null);
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

	const handleDataExport = async (values) => {
		setLoading(true);
		try {
			const result = await solidService.exportUserData({
				routeDataset: values.dataRoute,
				routeShape: values.shapeRoute,
				routeShapeMap: values.shapeMapRoute,
			});

			setExportResult(result);
			setCurrentStep(2);
			notification.success({
				message: "Export Successful",
				description:
					"Your data has been successfully exported to your Solid pod",
			});
		} catch (error) {
			notification.error({
				message: "Export Failed",
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
						message="Secure Data Export"
						description="Connect to your Solid pod to securely export your dental clinic data. Your data will be stored in your personal data pod under your complete control."
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
							icon={<CloudUploadOutlined />}
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
					<FileTextOutlined />
					Configure Data Export
				</Space>
			}
			style={{ marginBottom: 24 }}
		>
			<Form
				form={form}
				layout="vertical"
				onFinish={handleDataExport}
				initialValues={{
					dataRoute: "dental-clinic/data.ttl",
					shapeRoute: "dental-clinic/shapes.shex",
					shapeMapRoute: "dental-clinic/shape-map.sm",
				}}
			>
				<Row gutter={[24, 24]}>
					<Col span={24}>
						<Alert
							message="Export Configuration"
							description="Specify where in your Solid pod you want to store your data, shapes, and shape maps. All paths are relative to your pod root."
							type="info"
							style={{ marginBottom: 24 }}
						/>
					</Col>

					<Col span={12}>
						<Form.Item
							label="Data Storage Route"
							name="dataRoute"
							rules={[{ required: true, message: "Please enter data route" }]}
							tooltip="Path in your Solid pod where the exported clinical data will be stored"
						>
							<Input
								placeholder="dental-clinic/data.ttl"
								prefix={<FileTextOutlined />}
							/>
						</Form.Item>
					</Col>

					<Col span={12}>
						<Form.Item
							label="Shape Route"
							name="shapeRoute"
							rules={[{ required: true, message: "Please enter shape route" }]}
							tooltip="Path where the ShEx shape schema will be stored for data validation"
						>
							<Input
								placeholder="dental-clinic/shapes.shex"
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
							tooltip="Path where the shape map will be stored to link data with validation rules"
						>
							<Input
								placeholder="dental-clinic/shape-map.sm"
								prefix={<FileTextOutlined />}
							/>
						</Form.Item>
					</Col>

					<Col span={24}>
						<Space size="large">
							<Button
								type="primary"
								htmlType="submit"
								icon={<DownloadOutlined />}
								loading={loading}
								size="large"
							>
								Export Data to Solid Pod
							</Button>
						</Space>
					</Col>
				</Row>
			</Form>
		</Card>,
		<Result
			status="success"
			title="Data Export Completed Successfully!"
			subTitle={
				exportResult
					? `Your dental clinic data has been securely exported to your Solid pod. ${
							exportResult.filesCreated
					  } file${exportResult.filesCreated > 1 ? "s were" : " was"} created.`
					: "Your dental clinic data has been securely exported to your Solid pod."
			}
			extra={[
				<Button
					key="new"
					onClick={() => {
						setCurrentStep(1);
						setExportResult(null);
						form.resetFields();
					}}
				>
					Export Again
				</Button>,
			]}
		>
			{exportResult && (
				<Card size="small" style={{ marginTop: 16, textAlign: "left" }}>
					<Title level={5}>
						<FileTextOutlined style={{ marginRight: 8 }} />
						Exported Files:
					</Title>
					<ul style={{ marginTop: 16 }}>
						<li style={{ marginBottom: 8 }}>
							<Text code>{exportResult.dataFile}</Text>
							<Text type="secondary"> - Your clinical data in RDF format</Text>
						</li>
						<li style={{ marginBottom: 8 }}>
							<Text code>{exportResult.shapeFile}</Text>
							<Text type="secondary"> - Data validation schema (ShEx)</Text>
						</li>
						<li style={{ marginBottom: 8 }}>
							<Text code>{exportResult.shapeMapFile}</Text>
							<Text type="secondary"> - Shape mapping rules</Text>
						</li>
					</ul>
					<Alert
						message="Your data is now available in your Solid pod"
						description="You can access and manage your exported data using any Solid-compatible application or pod browser."
						type="success"
						style={{ marginTop: 16 }}
					/>
				</Card>
			)}
		</Result>,
	];

	if (checkingAuth) {
		return (
			<div
				style={{
					maxWidth: 1200,
					margin: "0 auto",
					textAlign: "center",
					padding: "80px 20px",
				}}
			>
				<Spin
					size="large"
					indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
				/>
				<div style={{ marginTop: 24 }}>
					<Title level={4}>Checking Solid authentication status...</Title>
					<Text type="secondary">
						Please wait while we verify your connection
					</Text>
				</div>
			</div>
		);
	}

	return (
		<div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
			<div style={{ marginBottom: 40 }}>
				<Title level={2}>
					<CloudUploadOutlined style={{ marginRight: 12 }} />
					Export Data to Solid Pod
				</Title>
				<Paragraph style={{ fontSize: "16px", color: "#666" }}>
					Securely export your dental clinic data to your personal Solid pod.
					This includes your medical records, treatment history, and all
					associated metadata in a standardized, interoperable format that you
					control.
				</Paragraph>
				<Alert
					message="Data Sovereignty"
					description="By exporting to Solid, you maintain complete control over your healthcare data. You can share it with healthcare providers, researchers, or applications of your choice."
					type="info"
					showIcon
					style={{ marginTop: 16 }}
				/>
			</div>

			<Steps current={currentStep} style={{ marginBottom: 40 }}>
				<Step
					title="Connect Solid Pod"
					description="Authenticate with your Solid provider"
					icon={cookie.solidSession ? <CheckCircleOutlined /> : undefined}
				>
					{stepContent[0]}
				</Step>
				<Step
					title="Configure Export"
					description="Set export routes and options"
				>
					{stepContent[1]}
				</Step>
				<Step
					title="Export Complete"
					description="Data successfully exported"
				/>
			</Steps>

			<Spin spinning={loading} tip="Processing export...">
				{stepContent[currentStep]}
			</Spin>
		</div>
	);
};

export default DataExport;
