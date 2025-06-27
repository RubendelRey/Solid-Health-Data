import {
	BarChart as ChartIcon,
	GetApp as ExportIcon,
	Refresh as RefreshIcon,
	TableChart as TableIcon,
} from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Grid,
	IconButton,
	Paper,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Tabs,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import loadTestResultsService from "../../api/loadTestResultsService";

const LoadTestResults = () => {
	const [results, setResults] = useState([]);
	const [allResults, setAllResults] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [totalCount, setTotalCount] = useState(0);

	const [activeTab, setActiveTab] = useState(0);

	const loadData = useCallback(async () => {
		try {
			setLoading(true);
			const params = {
				page: page + 1,
				limit: rowsPerPage,
			};

			const response = await loadTestResultsService.getAllResults(params);

			if (response.success) {
				setResults(response.data?.results || response.data || []);
				setTotalCount(response.data?.totalCount || response.data?.length || 0);
			} else {
				setResults(response.results || response || []);
				setTotalCount(response.totalCount || response.length || 0);
			}

			setError(null);
		} catch (err) {
			setError("Error loading load test results");
			console.error("Error loading results:", err);
			setResults([]);
			setTotalCount(0);
		} finally {
			setLoading(false);
		}
	}, [page, rowsPerPage]);

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
		loadData();
		loadAllData();
		loadStats();
	}, [loadData, loadAllData, loadStats]);

	const handlePageChange = (event, newPage) => {
		setPage(newPage);
	};

	const handleRowsPerPageChange = (event) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
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
				<Box
					display="flex"
					justifyContent="center"
					alignItems="center"
					minHeight="200px"
				>
					<Typography variant="h6" color="textSecondary">
						No data available for chart
					</Typography>
				</Box>
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
			<Box sx={{ p: 3 }}>
				<Typography variant="h6" gutterBottom>
					Number of Triplets vs Duration
				</Typography>
				<Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
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
				</Box>
				<Box sx={{ mt: 2, fontSize: "12px", color: "text.secondary" }}>
					<Typography variant="caption">
						• Each point represents a load test execution
					</Typography>
					<br />
					<Typography variant="caption">
						• Hover over points to see details
					</Typography>
				</Box>
			</Box>
		);
	};

	const handleTabChange = (event, newValue) => {
		setActiveTab(newValue);
	};

	if (loading && results.length === 0) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				minHeight="400px"
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3 }}>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				sx={{
					mb: 3,
				}}
			>
				<Typography variant="h4" gutterBottom>
					Load Test Results
				</Typography>
				<Box>
					<IconButton
						onClick={() => {
							loadData();
							loadAllData();
							loadStats();
						}}
						disabled={loading}
					>
						<RefreshIcon />
					</IconButton>
					<Button
						variant="outlined"
						startIcon={<ExportIcon />}
						onClick={exportResults}
						sx={{ ml: 1 }}
					>
						Export
					</Button>
				</Box>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{error}
				</Alert>
			)}

			<Grid container spacing={3} sx={{ mb: 3 }}>
				<Grid item xs={12} md={3}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								Total Tests
							</Typography>
							<Typography variant="h4">{stats?.totalTests || 0}</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} md={3}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								Average Duration
							</Typography>
							<Typography variant="h4">
								{formatDuration(stats?.averageDuration || 0)}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} md={3}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								Average Triples
							</Typography>
							<Typography variant="h4">
								{formatNumber(stats?.averageTriples || 0)}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} md={3}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								Unique Servers
							</Typography>
							<Typography variant="h4">{stats?.uniqueServers || 0}</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{loading ? (
				<Box display="flex" justifyContent="center" sx={{ my: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<Paper sx={{ mt: 3 }}>
					<Tabs
						value={activeTab}
						onChange={handleTabChange}
						sx={{ borderBottom: 1, borderColor: "divider" }}
					>
						<Tab
							label={
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<TableIcon />
									Table View
								</Box>
							}
						/>
						<Tab
							label={
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<ChartIcon />
									Chart View
								</Box>
							}
						/>
					</Tabs>

					{activeTab === 0 && (
						<>
							<TableContainer>
								<Table>
									<TableHead>
										<TableRow>
											<TableCell>Test Date</TableCell>
											<TableCell>Duration</TableCell>
											<TableCell>Solid Server</TableCell>
											<TableCell>Triples Count</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{Array.isArray(results) &&
											results.map((result) => (
												<TableRow key={result._id || Math.random()}>
													<TableCell>{formatDate(result.testDate)}</TableCell>
													<TableCell>
														{formatDuration(result.duration)}
													</TableCell>
													<TableCell>{result.solidServer || "N/A"}</TableCell>
													<TableCell>
														{formatNumber(result.triplesCount)}
													</TableCell>
												</TableRow>
											))}
									</TableBody>
								</Table>
							</TableContainer>

							<TablePagination
								rowsPerPageOptions={[5, 10, 25, 50]}
								component="div"
								count={totalCount}
								rowsPerPage={rowsPerPage}
								page={page}
								onPageChange={handlePageChange}
								onRowsPerPageChange={handleRowsPerPageChange}
								labelRowsPerPage="Rows per page:"
								labelDisplayedRows={({ from, to, count }) =>
									`${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
								}
							/>
						</>
					)}

					{activeTab === 1 && renderChart()}
				</Paper>
			)}

			{!loading && results.length === 0 && (
				<Box
					display="flex"
					justifyContent="center"
					alignItems="center"
					minHeight="200px"
				>
					<Typography variant="h6" color="textSecondary">
						No load test results found
					</Typography>
				</Box>
			)}
		</Box>
	);
};

export default LoadTestResults;
