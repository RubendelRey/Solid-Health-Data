import {
	ArrowLeftOutlined,
	ExclamationCircleOutlined,
	FilterOutlined,
	PrinterOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	DatePicker,
	Empty,
	Select,
	Space,
	Spin,
	Table,
	Tag,
	Typography,
} from "antd";
import moment from "moment";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import patientService from "../../api/patientService";

const { Title, Text } = Typography;
const { Option } = Select;

const AllergyPatientsReport = () => {
	const { allergyId } = useParams();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [allergy, setAllergy] = useState(null);
	const [patients, setPatients] = useState([]);
	const [filteredPatients, setFilteredPatients] = useState([]);
	const [filters, setFilters] = useState({
		severityFilter: null,
		dateFilter: null,
	});

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await patientService.getPatientsByAllergy(allergyId);

				if (response && response.patients) {
					setAllergy(response.allergy);
					setPatients(response.patients);
					setFilteredPatients(response.patients);
				} else {
					setPatients([]);
					setFilteredPatients([]);
				}
			} catch (err) {
				console.error("Error fetching allergy patients:", err);
				setError(
					"Failed to load patient data for this allergy. Please try again later."
				);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [allergyId]);

	useEffect(() => {
		if (patients.length === 0) return;

		let filtered = [...patients];

		if (filters.severityFilter) {
			filtered = filtered.filter(
				(patient) => patient.allergyDetails.severity === filters.severityFilter
			);
		}

		if (filters.dateFilter) {
			const filterDate = filters.dateFilter.startOf("day");
			filtered = filtered.filter((patient) => {
				if (!patient.allergyDetails.detectionDate) return false;
				const detectionDate = moment(patient.allergyDetails.detectionDate);
				return detectionDate.isAfter(filterDate);
			});
		}

		setFilteredPatients(filtered);
	}, [filters, patients]);

	const generateReport = () => {
		alert("Report generation feature coming soon!");
	};

	const getSeverityColor = (severity) => {
		switch (severity?.toLowerCase()) {
			case "high":
				return "red";
			case "low":
				return "yellow";
			default:
				return "blue";
		}
	};

	const columns = [
		{
			title: "Patient",
			dataIndex: "name",
			key: "name",
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (text, record) => (
				<div>
					<Text strong>
						{text} {record.surname}
					</Text>
					<div>
						<Text type="secondary">ID: {record._id}</Text>
					</div>
				</div>
			),
		},
		{
			title: "Severity",
			dataIndex: ["allergyDetails", "severity"],
			key: "severity",
			sorter: (a, b) => {
				const severityOrder = { high: 0, low: 1 };
				const severityA = a.allergyDetails.severity || "low";
				const severityB = b.allergyDetails.severity || "low";
				return severityOrder[severityA] - severityOrder[severityB];
			},
			render: (severity) => (
				<Tag color={getSeverityColor(severity)}>
					{severity === "high" && "⚠️ "}
					{severity?.charAt(0).toUpperCase() + severity?.slice(1) || "Unknown"}
				</Tag>
			),
		},
		{
			title: "Detected On",
			dataIndex: ["allergyDetails", "detectionDate"],
			key: "detectionDate",
			sorter: (a, b) => {
				const dateA = a.allergyDetails.detectionDate
					? new Date(a.allergyDetails.detectionDate)
					: new Date(0);
				const dateB = b.allergyDetails.detectionDate
					? new Date(b.allergyDetails.detectionDate)
					: new Date(0);
				return dateA - dateB;
			},
			render: (date) =>
				date ? moment(date).format("MMMM D, YYYY") : "Unknown",
		},
		{
			title: "Status",
			dataIndex: ["allergyDetails", "status"],
			key: "status",
			render: (status) => (
				<Tag color={status === "active" ? "green" : "gray"}>
					{status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown"}
				</Tag>
			),
		},
		{
			title: "Notes",
			dataIndex: ["allergyDetails", "notes"],
			key: "notes",
			render: (notes) => notes || "No notes",
		},
		{
			title: "Actions",
			key: "actions",
			render: (_, record) => (
				<Button
					type="primary"
					onClick={() => navigate(`/patients/${record._id}`)}
				>
					View Patient
				</Button>
			),
		},
	];

	if (loading) {
		return (
			<div
				style={{ display: "flex", justifyContent: "center", padding: "40px" }}
			>
				<Spin size="large" />
			</div>
		);
	}

	if (error) {
		return <Alert type="error" message={error} />;
	}

	return (
		<div>
			<div
				style={{
					marginBottom: "20px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div>
					<Button
						type="link"
						icon={<ArrowLeftOutlined />}
						onClick={() => navigate(-1)}
						style={{ paddingLeft: 0 }}
					>
						Back
					</Button>
					<Title level={2} style={{ margin: "0" }}>
						<ExclamationCircleOutlined /> Patients with {allergy?.name} Allergy
					</Title>
					<Text>{allergy?.description}</Text>
				</div>

				<div>
					<Button
						icon={<PrinterOutlined />}
						onClick={generateReport}
						style={{ marginRight: "10px" }}
					>
						Generate Report
					</Button>
				</div>
			</div>

			<Card>
				<div style={{ marginBottom: "20px" }}>
					<Title level={4}>
						<FilterOutlined /> Filter Patients
					</Title>
					<Space>
						<Select
							placeholder="Filter by Severity"
							allowClear
							style={{ width: 200 }}
							onChange={(value) =>
								setFilters((prev) => ({ ...prev, severityFilter: value }))
							}
						>
							<Option value="high">High</Option>
							<Option value="low">Low</Option>
						</Select>

						<DatePicker
							placeholder="Filter by Detection Date"
							style={{ width: 200 }}
							onChange={(date) =>
								setFilters((prev) => ({ ...prev, dateFilter: date }))
							}
						/>
					</Space>
				</div>

				{filteredPatients.length > 0 ? (
					<Table
						columns={columns}
						dataSource={filteredPatients}
						rowKey="_id"
						pagination={{ pageSize: 10 }}
					/>
				) : (
					<Empty description="No patients found with this allergy" />
				)}
			</Card>
		</div>
	);
};

export default AllergyPatientsReport;
