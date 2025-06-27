import {
	BarChartOutlined,
	DownloadOutlined,
	ReloadOutlined,
	TableOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Col,
	Row,
	Space,
	Spin,
	Statistic,
	Table,
	Tabs,
	Typography,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import loadTestResultsService from "../../api/loadTestResultsService";

const { Title, Text } = Typography;

const LoadTestResults = () => {
	const [results, setResults] = useState([]);
	const [allResults, setAllResults] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
	});

	const [activeTab, setActiveTab] = useState("table");

	const loadData = useCallback(async (page = 1, pageSize = 10) => {
		try {
			setLoading(true);
			const params = {
				page: page,
				limit: pageSize,
			};

			const response = await loadTestResultsService.getAllResults(params);

			if (response.success) {
				setResults(response.data?.results || response.data || []);
				setPagination((prev) => ({
					...prev,
					total: response.data?.totalCount || response.data?.length || 0,
					current: page,
					pageSize: pageSize,
				}));
			} else {
				setResults(response.results || response || []);
				setPagination((prev) => ({
					...prev,
					total: response.totalCount || response.length || 0,
					current: page,
					pageSize: pageSize,
				}));
			}

			setError(null);
		} catch (err) {
			setError("Error loading load test results");
			console.error("Error loading results:", err);
			setResults([]);
			setPagination((prev) => ({
				...prev,
				total: 0,
			}));
		} finally {
			setLoading(false);
		}
	}, []);

	const loadAllData = useCallback(async () => {
		try {
			const response = await loadTestResultsService.getAllResults({
				limit: 10000,
			});

			if (response.success) {
				setAllResults(response.data?.results || response.data || []);
			} else {
				setAllResults(response.results || response || []);
			}
		} catch (err) {
			console.error("Error loading all results for chart:", err);
			setAllResults([]);
		}
	}, []);

	const loadStats = useCallback(async () => {
		try {
			const response = await loadTestResultsService.getStats();

			if (response.success) {
				setStats(response.data || {});
			} else {
				setStats(response || {});
			}
		} catch (err) {
			console.error("Error loading stats:", err);
		}
	}, []);

	useEffect(() => {
		loadData(1, 10);
		loadAllData();
		loadStats();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleTableChange = (paginationData) => {
		setPagination(paginationData);
		loadData(paginationData.current, paginationData.pageSize);
	};

	const exportResults = async () => {
		try {
			const blob = await loadTestResultsService.exportToCsv();

			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `load_test_results_${
				new Date().toISOString().split("T")[0]
			}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err) {
			console.error("Error exporting results:", err);
			setError("Error exporting results");
		}
	};

	const formatDuration = (milliseconds) => {
		if (!milliseconds || milliseconds === 0) return "0ms";

		const seconds = Math.floor(milliseconds / 1000);
		const ms = milliseconds % 1000;

		if (seconds > 0) {
			return `${seconds}.${ms.toString().padStart(3, "0")}s`;
		}
		return `${ms}ms`;
	};

	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		try {
			return new Date(dateString).toLocaleString();
		} catch {
			return dateString;
		}
	};

	const formatNumber = (num) => {
		if (!num) return "0";
		return num.toLocaleString();
	};

	const renderChart = () => {
		if (!allResults || allResults.length === 0) {
			return (
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						minHeight: "200px",
					}}
				>
					<Text type="secondary" style={{ fontSize: "18px" }}>
						No data available for chart
					</Text>
				</div>
			);
		}

		const sortedResults = [...allResults].sort(
			(a, b) => (a.triplesCount || 0) - (b.triplesCount || 0)
		);

		const maxTriplets = Math.max(
			...sortedResults.map((r) => r.triplesCount || 0)
		);
		const minTriplets = Math.min(
			...sortedResults.map((r) => r.triplesCount || 0)
		);
		const maxDuration = Math.max(...sortedResults.map((r) => r.duration || 0));
		const minDuration = Math.min(...sortedResults.map((r) => r.duration || 0));

		const chartWidth = 600;
		const chartHeight = 400;
		const margin = { top: 20, right: 50, bottom: 60, left: 80 };
		const plotWidth = chartWidth - margin.left - margin.right;
		const plotHeight = chartHeight - margin.top - margin.bottom;

		const getXPosition = (triplets) => {
			const normalizedValue =
				(triplets - minTriplets) / (maxTriplets - minTriplets || 1);
			return normalizedValue * plotWidth;
		};

		const getYPosition = (duration) => {
			const normalizedValue =
				(duration - minDuration) / (maxDuration - minDuration || 1);
			return plotHeight - normalizedValue * plotHeight;
		};

		const yTicks = [];
		const tickCount = 5;
		for (let i = 0; i <= tickCount; i++) {
			const value = minDuration + (maxDuration - minDuration) * (i / tickCount);
			yTicks.push({
				value: Math.round(value),
				label: formatDuration(Math.round(value)),
				y: plotHeight - (i / tickCount) * plotHeight,
			});
		}

		const xTicks = [];
		const xTickCount = 5;
		for (let i = 0; i <= xTickCount; i++) {
			const value =
				minTriplets + (maxTriplets - minTriplets) * (i / xTickCount);
			xTicks.push({
				value: Math.round(value),
				label: formatNumber(Math.round(value)),
				x: (i / xTickCount) * plotWidth,
			});
		}

		return (
			<div style={{ padding: "24px" }}>
				<Title level={4} style={{ marginBottom: "16px" }}>
					Number of Triplets vs Duration
				</Title>
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						marginBottom: "16px",
					}}
				>
					<svg
						width={chartWidth}
						height={chartHeight}
						style={{ border: "1px solid #e0e0e0" }}
					>
						<rect
							x={margin.left}
							y={margin.top}
							width={plotWidth}
							height={plotHeight}
							fill="#fafafa"
							stroke="#e0e0e0"
						/>

						{yTicks.map((tick, index) => (
							<g key={`y-grid-${index}`}>
								<line
									x1={margin.left}
									y1={margin.top + tick.y}
									x2={margin.left + plotWidth}
									y2={margin.top + tick.y}
									stroke="#e0e0e0"
									strokeDasharray="2,2"
								/>
							</g>
						))}

						{xTicks.map((tick, index) => (
							<g key={`x-grid-${index}`}>
								<line
									x1={margin.left + tick.x}
									y1={margin.top}
									x2={margin.left + tick.x}
									y2={margin.top + plotHeight}
									stroke="#e0e0e0"
									strokeDasharray="2,2"
								/>
							</g>
						))}

						<line
							x1={margin.left}
							y1={margin.top}
							x2={margin.left}
							y2={margin.top + plotHeight}
							stroke="#333"
							strokeWidth={2}
						/>

						<line
							x1={margin.left}
							y1={margin.top + plotHeight}
							x2={margin.left + plotWidth}
							y2={margin.top + plotHeight}
							stroke="#333"
							strokeWidth={2}
						/>

						{yTicks.map((tick, index) => (
							<g key={`y-label-${index}`}>
								<text
									x={margin.left - 10}
									y={margin.top + tick.y + 4}
									textAnchor="end"
									fontSize="12"
									fill="#666"
								>
									{tick.label}
								</text>
							</g>
						))}

						{xTicks.map((tick, index) => (
							<g key={`x-label-${index}`}>
								<text
									x={margin.left + tick.x}
									y={margin.top + plotHeight + 20}
									textAnchor="middle"
									fontSize="10"
									fill="#666"
								>
									{tick.label}
								</text>
							</g>
						))}

						{sortedResults.map((result, index) => {
							const x = margin.left + getXPosition(result.triplesCount || 0);
							const y = margin.top + getYPosition(result.duration || 0);

							return (
								<g key={result._id || index}>
									<circle
										cx={x}
										cy={y}
										r="5"
										fill="#1976d2"
										stroke="#fff"
										strokeWidth="2"
									/>
									<title>
										{`Triplets: ${formatNumber(
											result.triplesCount
										)}\nDuration: ${formatDuration(
											result.duration
										)}\nDate: ${formatDate(result.testDate)}`}
									</title>
								</g>
							);
						})}

						<text
							x={margin.left + plotWidth / 2}
							y={chartHeight - 10}
							textAnchor="middle"
							fontSize="14"
							fontWeight="bold"
							fill="#333"
						>
							Number of Triplets
						</text>

						<text
							x={15}
							y={margin.top + plotHeight / 2}
							textAnchor="middle"
							fontSize="14"
							fontWeight="bold"
							fill="#333"
							transform={`rotate(-90, 15, ${margin.top + plotHeight / 2})`}
						>
							Duration (seconds)
						</text>
					</svg>
				</div>
				<div style={{ marginTop: "16px", fontSize: "12px", color: "#999" }}>
					<Text type="secondary">
						• Each point represents a load test execution
					</Text>
					<br />
					<Text type="secondary">• Hover over points to see details</Text>
				</div>
			</div>
		);
	};

	const handleTabChange = (activeKey) => {
		setActiveTab(activeKey);
	};

	if (loading && results.length === 0) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "400px",
				}}
			>
				<Spin size="large" />
			</div>
		);
	}

	return (
		<div style={{ padding: "24px" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "24px",
				}}
			>
				<Title level={2}>Load Test Results</Title>
				<Space>
					<Button
						icon={<ReloadOutlined />}
						onClick={() => {
							loadData(pagination.current, pagination.pageSize);
							loadAllData();
							loadStats();
						}}
						loading={loading}
					>
						Refresh
					</Button>
					<Button
						type="primary"
						icon={<DownloadOutlined />}
						onClick={exportResults}
					>
						Export
					</Button>
				</Space>
			</div>

			{error && (
				<Alert
					message={error}
					type="error"
					showIcon
					style={{ marginBottom: "24px" }}
				/>
			)}

			<Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
				<Col xs={24} md={6}>
					<Card>
						<Statistic title="Total Tests" value={stats?.totalTests || 0} />
					</Card>
				</Col>
				<Col xs={24} md={6}>
					<Card>
						<Statistic
							title="Average Duration"
							value={formatDuration(stats?.averageDuration || 0)}
						/>
					</Card>
				</Col>
				<Col xs={24} md={6}>
					<Card>
						<Statistic
							title="Average Triples"
							value={formatNumber(stats?.averageTriples || 0)}
						/>
					</Card>
				</Col>
				<Col xs={24} md={6}>
					<Card>
						<Statistic
							title="Unique Servers"
							value={stats?.uniqueServers || 0}
						/>
					</Card>
				</Col>
			</Row>

			{loading ? (
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						margin: "32px 0",
					}}
				>
					<Spin size="large" />
				</div>
			) : (
				<Card style={{ marginTop: "24px" }}>
					<Tabs
						activeKey={activeTab}
						onChange={handleTabChange}
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
										dataSource={results}
										pagination={{
											...pagination,
											showSizeChanger: true,
											showQuickJumper: true,
											showTotal: (total, range) =>
												`${range[0]}-${range[1]} of ${total} items`,
										}}
										onChange={handleTableChange}
										rowKey={(record) => record._id || Math.random()}
										columns={[
											{
												title: "Test Date",
												dataIndex: "testDate",
												key: "testDate",
												render: (text) => formatDate(text),
											},
											{
												title: "Duration",
												dataIndex: "duration",
												key: "duration",
												render: (text) => formatDuration(text),
											},
											{
												title: "Solid Server",
												dataIndex: "solidServer",
												key: "solidServer",
												render: (text) => text || "N/A",
											},
											{
												title: "Triples Count",
												dataIndex: "triplesCount",
												key: "triplesCount",
												render: (text) => formatNumber(text),
											},
										]}
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

			{!loading && results.length === 0 && (
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						minHeight: "200px",
					}}
				>
					<Text type="secondary" style={{ fontSize: "18px" }}>
						No load test results found
					</Text>
				</div>
			)}
		</div>
	);
};

export default LoadTestResults;
