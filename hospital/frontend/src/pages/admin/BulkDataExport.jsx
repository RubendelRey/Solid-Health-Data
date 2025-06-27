import {
	BarChartOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	DatabaseOutlined,
	DeleteOutlined,
	ExclamationCircleOutlined,
	ExperimentOutlined,
	FolderOutlined,
	LinkOutlined,
	PlusOutlined,
	SyncOutlined,
	TableOutlined,
	UploadOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Col,
	Collapse,
	Divider,
	Form,
	Input,
	InputNumber,
	List,
	Modal,
	Row,
	Space,
	Statistic,
	Table,
	Tabs,
	Typography,
	Upload,
	message,
} from "antd";
import { useEffect, useState } from "react";
import * as bulkExportService from "../../api/bulkExportService";
import { solidService } from "../../api/services";

const { Title, Text } = Typography;

const BulkDataExport = () => {
	const [exporting, setExporting] = useState(false);
	const [exportResults, setExportResults] = useState([]);
	const [exportStats, setExportStats] = useState(null);
	const [routesForm] = Form.useForm();

	const [solidConnected, setSolidConnected] = useState(false);
	const [solidLoading, setSolidLoading] = useState(false);
	const [solidProvider, setSolidProvider] = useState("");
	const [checkingAuth, setCheckingAuth] = useState(true);

	const [testConfigurations, setTestConfigurations] = useState([100]);
	const [pathForm] = Form.useForm();

	const [activeTab, setActiveTab] = useState("table");

	const addTestConfiguration = () => {
		setTestConfigurations([...testConfigurations, 100]);
	};

	const removeTestConfiguration = (index) => {
		if (testConfigurations.length > 1) {
			const newConfigs = testConfigurations.filter((_, i) => i !== index);
			setTestConfigurations(newConfigs);
		}
	};

	const updateTestConfiguration = (index, value) => {
		const newConfigs = [...testConfigurations];
		newConfigs[index] = value || 100;
		setTestConfigurations(newConfigs);
	};

	useEffect(() => {
		checkSolidLoginStatus();
	}, []);

	const checkSolidLoginStatus = async () => {
		setCheckingAuth(true);
		try {
			const response = await solidService.isLoggedIn();
			setSolidConnected(response.isLoggedIn);
		} catch (error) {
			console.error("Error checking Solid login status:", error);
			setSolidConnected(false);
		} finally {
			setCheckingAuth(false);
		}
	};

	const handleSolidLogin = async (providerUrl = null) => {
		const urlToUse = providerUrl || solidProvider;
		if (!urlToUse) {
			message.error("Please enter your Solid provider URL");
			return;
		}

		try {
			setSolidLoading(true);
			let finalUrl = urlToUse;
			if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
				finalUrl = `https://${finalUrl}`;
			}

			await solidService.login(finalUrl);

					setTimeout(async () => {
				await checkSolidLoginStatus();
				if (solidConnected) {
					message.success("Successfully connected to Solid pod!");
				}
			}, 1000);
		} catch (error) {
			console.error("Error during Solid login:", error);
			message.error(`Connection failed: ${error.message}`);
		} finally {
			setSolidLoading(false);
		}
	};

	const handleSolidDisconnect = async () => {
		try {
			setSolidLoading(true);
			await solidService.logout();
			setSolidConnected(false);
			message.success("Disconnected from Solid pod successfully");
		} catch (err) {
			console.error("Error disconnecting:", err);
			message.error("Error disconnecting from Solid pod");
		} finally {
			setSolidLoading(false);
		}
	};

	const handleExportAll = async () => {
		if (!solidConnected) {
			message.error("Please connect to your Solid pod first");
			return;
		}

		try {
					if (testConfigurations.length === 0) {
				message.error("Please add at least one test configuration");
				return;
			}

					for (let i = 0; i < testConfigurations.length; i++) {
				const triplesCount = testConfigurations[i];
				if (!triplesCount || triplesCount < 10) {
					message.error(`Test ${i + 1}: triples count must be at least 10`);
					return;
				}
			}

					const pathValues = await pathForm.validateFields();
			const totalTriples = testConfigurations.reduce(
				(sum, count) => sum + count,
				0
			);

					Modal.confirm({
				title: "Confirm Load Testing",
				content: (
					<div>
						<p>
							Are you sure you want to start load testing with the following
							configuration?
						</p>
						<ul>
							<li>
								<strong>Tests:</strong> {testConfigurations.length}
							</li>
							<li>
								<strong>Configuration:</strong> [{testConfigurations.join(", ")}
								] triples
							</li>
							<li>
								<strong>Total triples:</strong> {totalTriples.toLocaleString()}
							</li>
							<li>
								<strong>Base folder:</strong>{" "}
								{pathValues.baseFolder || "load-tests"}
							</li>
							<li>
								<strong>Subfolder:</strong> {pathValues.subfolder || "hospital"}
							</li>
						</ul>
					</div>
				),
				okText: "Start Load Testing",
				cancelText: "Cancel",
				onOk: async () => {
					setExporting(true);
					setExportResults([]);
					setExportStats(null);

					try {
						const response = await bulkExportService.exportAllPatientsToSolid({
							testsConfiguration: testConfigurations,
							pathConfiguration: {
								baseFolder: pathValues.baseFolder || "load-tests",
								subfolder: pathValues.subfolder || "hospital",
								filePrefix: pathValues.filePrefix || "test",
							},
						});

						setExportStats(response.stats);
						setExportResults(response.results);

						if (response.stats.failed === 0) {
							message.success(
								`Successfully completed all ${response.stats.completed} load tests! Total: ${response.stats.totalTriples} triples exported.`
							);
						} else {
							message.warning(
								`Load testing completed with ${response.stats.completed}/${response.stats.totalTests} tests successful`
							);
						}
					} catch (error) {
						console.error("Error during load testing:", error);
						message.error("Failed to run load tests: " + error.message);
					} finally {
						setExporting(false);
					}
				},
			});
		} catch (error) {
			console.error("Validation failed:", error);
		}
	};

	const resultsColumns = [
		{
			title: "Test",
			dataIndex: "name",
			key: "name",
		},
		{
			title: "Status",
			dataIndex: "status",
			key: "status",
			render: (status) => (
				<Space>
					{status === "success" ? (
						<CheckCircleOutlined style={{ color: "#52c41a" }} />
					) : (
						<CloseCircleOutlined style={{ color: "#f5222d" }} />
					)}
					{status}
				</Space>
			),
		},
		{
			title: "Triples Count",
			dataIndex: "triplesCount",
			key: "triplesCount",
			render: (count) => count?.toLocaleString() || "0",
		},
		{
			title: "Duration (ms)",
			dataIndex: "duration",
			key: "duration",
		},
		{
			title: "Message",
			dataIndex: "message",
			key: "message",
		},
	];

	const renderChart = () => {
		if (exportResults.length === 0) return null;

		const maxDuration = Math.max(...exportResults.map((r) => r.duration || 0));
		const maxTriplets = Math.max(
			...exportResults.map((r) => r.triplesCount || 0)
		);

		return (
			<div style={{ padding: "20px" }}>
				<Title level={4}>Upload Time vs Triplets Count</Title>
				<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
					{exportResults.map((result, index) => (
						<div
							key={index}
							style={{ display: "flex", alignItems: "center", gap: "10px" }}
						>
							<Text style={{ width: "100px", fontSize: "12px" }}>
								Test {result.testNumber}
							</Text>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "5px",
									width: "100%",
								}}
							>
								<Text style={{ width: "80px", fontSize: "12px" }}>
									{(result.triplesCount || 0).toLocaleString()} triplets
								</Text>
								<div
									style={{
										height: "20px",
										backgroundColor:
											result.status === "success" ? "#52c41a" : "#f5222d",
										width: `${((result.duration || 0) / maxDuration) * 300}px`,
										minWidth: "2px",
										borderRadius: "2px",
										position: "relative",
									}}
								>
									<Text
										style={{
											position: "absolute",
											right: "5px",
											top: "2px",
											fontSize: "10px",
											color: "white",
											fontWeight: "bold",
										}}
									>
										{result.duration}ms
									</Text>
								</div>
							</div>
						</div>
					))}
				</div>
				<div style={{ marginTop: "20px", fontSize: "12px", color: "#8c8c8c" }}>
					<Text>• Green bars represent successful uploads</Text>
					<br />
					<Text>• Red bars represent failed uploads</Text>
					<br />
					<Text>• Bar length represents upload duration</Text>
				</div>
			</div>
		);
	};

	return (
		<div style={{ padding: 24 }}>
			<Title level={2}>
				<DatabaseOutlined /> Solid Load Testing
			</Title>
			<Text type="secondary">
				Run RDF triple load tests on your Solid pod. Generate and export
				specified quantities of RDF triples to test Solid performance.
			</Text>

			<Divider />

			<Row gutter={[24, 24]}>
				<Col span={24}>
					<Card
						title={
							<Space>
								<DatabaseOutlined />
								Solid Pod Connection
							</Space>
						}
					>
						{checkingAuth ? (
							<div style={{ textAlign: "center", padding: "20px" }}>
								<SyncOutlined spin /> Checking connection status...
							</div>
						) : !solidConnected ? (
							<>
								<Alert
									message="Connect to Solid Pod"
									description="You need to connect to your Solid pod to export patients' data. Enter your Solid provider URL below."
									type="info"
									showIcon
									style={{ marginBottom: "16px" }}
								/>
								<Row gutter={16}>
									<Col span={16}>
										<Input
											placeholder="e.g., https://solidweb.org/"
											value={solidProvider}
											onChange={(e) => setSolidProvider(e.target.value)}
											prefix={<LinkOutlined />}
											size="large"
										/>
									</Col>
									<Col span={8}>
										<Button
											type="primary"
											size="large"
											block
											loading={solidLoading}
											onClick={() => handleSolidLogin()}
											icon={<DatabaseOutlined />}
										>
											Connect to Solid
										</Button>
									</Col>
								</Row>
								<Divider>Or use quick connect</Divider>
								<Space wrap>
									<Button
										onClick={() =>
											handleSolidLogin("https://solidcommunity.net")
										}
										loading={solidLoading}
									>
										SolidCommunity.net
									</Button>
									<Button
										onClick={() => handleSolidLogin("https://solidweb.org")}
										loading={solidLoading}
									>
										Solid Web
									</Button>
								</Space>
							</>
						) : (
							<>
								<Alert
									message="Successfully Connected"
									description={`Connected to your Solid pod`}
									type="success"
									showIcon
									style={{ marginBottom: "16px" }}
								/>
								<Space>
									<Button
										onClick={handleSolidDisconnect}
										loading={solidLoading}
										icon={<SyncOutlined />}
									>
										Disconnect
									</Button>
									<Button
										onClick={checkSolidLoginStatus}
										loading={solidLoading}
										icon={<CheckCircleOutlined />}
									>
										Check Status
									</Button>
								</Space>
							</>
						)}
					</Card>
				</Col>

				<Col xs={24} lg={12}>
					<Card title="Load Testing Configuration">
						<Alert
							message="Administrator Load Testing"
							description={`Ready to run RDF triple load tests on your administrator Solid pod.`}
							type="info"
							showIcon
							style={{ marginBottom: 16 }}
						/>

						<Button
							type="primary"
							icon={<ExperimentOutlined />}
							onClick={handleExportAll}
							loading={exporting}
							disabled={!solidConnected}
							size="large"
							block
						>
							{exporting ? "Running Load Tests..." : `Start Load Testing`}
						</Button>
					</Card>
				</Col>

				<Col xs={24} lg={12}>
					<Card title="Data Routes Configuration">
						<Form
							form={routesForm}
							layout="vertical"
							initialValues={{
								routeDataset: "health-data/",
							}}
						>
							<Form.Item
								label="Dataset Route"
								name="routeDataset"
								rules={[
									{ required: true, message: "Dataset route is required" },
								]}
							>
								<Input placeholder="health-data/" />
							</Form.Item>

							<Divider>Load Testing Configuration</Divider>

							<div style={{ marginBottom: 16 }}>
								<h4 style={{ marginBottom: 16 }}>Test Configuration</h4>
								<div
									style={{
										marginBottom: 16,
										display: "flex",
										gap: 8,
										flexWrap: "wrap",
									}}
								>
									<Button
										type="dashed"
										onClick={addTestConfiguration}
										icon={<PlusOutlined />}
									>
										Add Test Configuration
									</Button>
									<Upload
										accept=".json"
										showUploadList={false}
										beforeUpload={(file) => {
											const reader = new FileReader();
											reader.onload = (e) => {
												try {
													const jsonData = JSON.parse(e.target.result);
													if (Array.isArray(jsonData)) {
														const validNumbers = jsonData.filter(
															(num) => typeof num === "number" && num >= 10
														);
														if (validNumbers.length > 0) {
															setTestConfigurations(validNumbers);
															message.success(
																`Loaded ${validNumbers.length} test configurations from JSON file`
															);
														} else {
															message.error(
																"No valid numbers found in JSON file (must be >= 10)"
															);
														}
													} else {
														message.error(
															"JSON file must contain an array of numbers"
														);
													}
												} catch {
													message.error("Invalid JSON file format");
												}
											};
											reader.readAsText(file);
											return false;
										}}
									>
										<Button type="dashed" icon={<UploadOutlined />}>
											Load from JSON
										</Button>
									</Upload>
								</div>

								<Alert
									message="JSON Format Help"
									description={
										<div>
											<p>
												Upload a JSON file with an array of numbers representing
												triplet counts for each test.
											</p>
											<p>
												<strong>Example:</strong>{" "}
												<code>[100, 500, 1000, 2500, 5000]</code>
											</p>
											<p>
												<em>Each number must be ≥ 10 triplets</em>
											</p>
										</div>
									}
									type="info"
									showIcon
									style={{ marginBottom: 16, fontSize: "12px" }}
								/>

								<List
									dataSource={testConfigurations}
									renderItem={(triplesCount, index) => (
										<List.Item
											key={index}
											actions={[
												<Button
													type="text"
													danger
													icon={<DeleteOutlined />}
													onClick={() => removeTestConfiguration(index)}
													disabled={testConfigurations.length <= 1}
												>
													Remove
												</Button>,
											]}
										>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: 16,
													width: "100%",
												}}
											>
												<span style={{ minWidth: 80 }}>Test {index + 1}:</span>
												<InputNumber
													min={10}
													value={triplesCount}
													onChange={(value) =>
														updateTestConfiguration(index, value)
													}
													formatter={(value) =>
														`${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
													}
													parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
													addonAfter="triples"
													style={{ width: 200 }}
												/>
											</div>
										</List.Item>
									)}
								/>
							</div>

							<div style={{ marginTop: 16 }}>
								<Collapse ghost>
									<Collapse.Panel
										header={
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: 8,
												}}
											>
												<FolderOutlined />
												<span>Path Configuration (Optional)</span>
											</div>
										}
										key="pathConfig"
									>
										<Form form={pathForm} layout="vertical">
											<Row gutter={16}>
												<Col span={8}>
													<Form.Item
														name="baseFolder"
														label="Base Folder"
														initialValue="load-tests"
													>
														<Input placeholder="load-tests" />
													</Form.Item>
												</Col>
												<Col span={8}>
													<Form.Item
														name="subfolder"
														label="Subfolder"
														initialValue="hospital"
													>
														<Input placeholder="hospital" />
													</Form.Item>
												</Col>
												<Col span={8}>
													<Form.Item
														name="filePrefix"
														label="File Prefix"
														initialValue="test"
													>
														<Input placeholder="test" />
													</Form.Item>
												</Col>
											</Row>
										</Form>
									</Collapse.Panel>
								</Collapse>
							</div>

							<Alert
								message="Load Testing Mode"
								description="This will export simple RDF triples to test Solid performance. No patient data is used - only generated triples for performance testing."
								type="info"
								showIcon
								style={{ marginTop: 16 }}
							/>
						</Form>
					</Card>
				</Col>
			</Row>

			{exporting && (
				<Card title="Export Progress" style={{ marginTop: 24 }}>
					<div style={{ textAlign: "center", marginBottom: 16 }}>
						<SyncOutlined spin style={{ fontSize: 24, color: "#1890ff" }} />
						<Title level={4} style={{ marginTop: 8 }}>
							Exporting patient data...
						</Title>
					</div>
				</Card>
			)}

			{exportStats && (
				<Card title="Export Statistics" style={{ marginTop: 24 }}>
					<Row gutter={16}>
						<Col span={6}>
							<Statistic
								title="Total Patients"
								value={exportStats.total}
								prefix={<DatabaseOutlined />}
							/>
						</Col>
						<Col span={6}>
							<Statistic
								title="Successful"
								value={exportStats.completed}
								prefix={<CheckCircleOutlined />}
								valueStyle={{ color: "#3f8600" }}
							/>
						</Col>
						<Col span={6}>
							<Statistic
								title="Failed"
								value={exportStats.failed}
								prefix={<CloseCircleOutlined />}
								valueStyle={{ color: "#cf1322" }}
							/>
						</Col>
						<Col span={6}>
							<Statistic
								title="Total Duration"
								value={exportStats.totalDuration}
								suffix="ms"
								prefix={<ExclamationCircleOutlined />}
							/>
						</Col>
					</Row>
				</Card>
			)}

			{exportResults.length > 0 && (
				<Card title="Export Results" style={{ marginTop: 24 }}>
					<Tabs
						activeKey={activeTab}
						onChange={setActiveTab}
						items={[
							{
								key: "table",
								label: (
									<span>
										<TableOutlined />
										Table View
									</span>
								),
								children: (
									<Table
										columns={resultsColumns}
										dataSource={exportResults}
										rowKey="testNumber"
										pagination={{
											showSizeChanger: true,
											showQuickJumper: true,
										}}
									/>
								),
							},
							{
								key: "chart",
								label: (
									<span>
										<BarChartOutlined />
										Chart View
									</span>
								),
								children: renderChart(),
							},
						]}
					/>
				</Card>
			)}
		</div>
	);
};

export default BulkDataExport;
