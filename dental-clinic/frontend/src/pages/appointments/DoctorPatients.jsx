import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Col,
	Input,
	Layout,
	Pagination,
	Row,
	Space,
	Spin,
	Table,
	Tabs,
	Typography,
} from "antd";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import interventionService from "../../api/interventionService";
import AuthContext from "../../contexts/AuthContext";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

const DoctorPatients = () => {
	const { user } = useContext(AuthContext);
	const [activeTabKey, setActiveTabKey] = useState("0");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [patients, setPatients] = useState([]);
	const [totalCount, setTotalCount] = useState(0);
	const [searchPerformed, setSearchPerformed] = useState(false);

	const [searchParams, setSearchParams] = useState({
		name: "",
		email: "",
		phone: "",
	});

	const [page, setPage] = useState(1);
	const [limit] = useState(10);

	const appointmentTypes = ["all", "upcoming", "past"];

	const handleTabChange = (key) => {
		setActiveTabKey(key);
		handleSearch(appointmentTypes[parseInt(key)]);
	};

	const handleSearch = async (
		appointmentType = appointmentTypes[parseInt(activeTabKey)]
	) => {
		try {
			setLoading(true);
			setError(null);

			const result = await interventionService.searchDoctorPatients(
				user.id,
				searchParams,
				appointmentType,
				page - 1,
				limit
			);

			setPatients(result.patients || []);
			setTotalCount(result.count || 0);
			setSearchPerformed(true);
		} catch (err) {
			console.error("Error searching patients:", err);
			setError("Error searching for patients. Please try again.");
			setPatients([]);
			setTotalCount(0);
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setSearchParams((prev) => ({ ...prev, [name]: value }));
	};

	const handlePageChange = (page) => {
		setPage(page);
	};

	useEffect(() => {
		if (user?.id && searchPerformed) {
			handleSearch();
		}
	}, [page, user]);

	useEffect(() => {
		handleSearch();
	}, []);

	const columns = [
		{
			title: "Name",
			dataIndex: "name",
			key: "name",
			render: (_, record) => (
				<Space>
					<UserOutlined />
					<Text>
						{record.name} {record.surname}
					</Text>
				</Space>
			),
		},
		{
			title: "Email",
			dataIndex: "email",
			key: "email",
		},

		{
			title: "Phone",
			dataIndex: "phoneNumbers",
			key: "phoneNumbers",
			render: (phoneNumbers) => (
				<Space>
					{phoneNumbers.map((phone, index) => (
						<Text key={index}>{phone}</Text>
					))}
				</Space>
			),
		},
		{
			title: "Actions",
			key: "actions",
			align: "right",
			render: (_, record) => (
				<Button type="primary" size="small">
					<Link to={`/patients/${record.id || record._id}`}>View Patient</Link>
				</Button>
			),
		},
	];

	const renderPatientsList = () => {
		if (loading) {
			return (
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						margin: "32px 0",
					}}
				>
					<Spin size="large" />
				</div>
			);
		}

		if (patients.length === 0) {
			return (
				<Alert
					message={
						searchPerformed
							? "No patients found with the search criteria"
							: "Perform a search to see results"
					}
					type="info"
					showIcon
					style={{ marginTop: 16 }}
				/>
			);
		}

		return (
			<div style={{ marginTop: 24 }}>
				<Table
					columns={columns}
					dataSource={patients}
					rowKey={(record) => record.id || record._id}
					pagination={false}
				/>

				{totalCount > limit && (
					<div
						style={{ marginTop: 24, display: "flex", justifyContent: "center" }}
					>
						<Pagination
							total={totalCount}
							current={page}
							pageSize={limit}
							onChange={handlePageChange}
							showSizeChanger={false}
						/>
					</div>
				)}
			</div>
		);
	};

	return (
		<Layout.Content style={{ padding: 24 }}>
			<Title level={2}>My Patients</Title>

			{error && (
				<Alert
					message="Error"
					description={error}
					type="error"
					showIcon
					style={{ marginBottom: 24 }}
				/>
			)}

			<Card style={{ marginBottom: 24 }}>
				<Title level={5}>Search Patients</Title>

				<Row gutter={16}>
					<Col xs={24} sm={8}>
						<Input
							name="name"
							placeholder="Name or Last Name"
							value={searchParams.name}
							onChange={handleInputChange}
							prefix={<UserOutlined />}
							style={{ marginBottom: 16 }}
						/>
					</Col>
					<Col xs={24} sm={8}>
						<Input
							name="email"
							placeholder="Email"
							value={searchParams.email}
							onChange={handleInputChange}
							style={{ marginBottom: 16 }}
						/>
					</Col>
					<Col xs={24} sm={8}>
						<Input
							name="phone"
							placeholder="Phone"
							value={searchParams.phone}
							onChange={handleInputChange}
							style={{ marginBottom: 16 }}
						/>
					</Col>
					<Col xs={24} style={{ marginTop: 8, marginBottom: 8 }}>
						<Button
							type="primary"
							onClick={() => handleSearch()}
							icon={<SearchOutlined />}
						>
							Search
						</Button>
					</Col>
				</Row>
			</Card>

			<Card>
				<Tabs activeKey={activeTabKey} onChange={handleTabChange}>
					<TabPane tab="All Patients" key="0" />
					<TabPane tab="Patients with Future Appointments" key="1" />
					<TabPane tab="Patients with Past Appointments" key="2" />
				</Tabs>

				{renderPatientsList()}
			</Card>
		</Layout.Content>
	);
};

export default DoctorPatients;
