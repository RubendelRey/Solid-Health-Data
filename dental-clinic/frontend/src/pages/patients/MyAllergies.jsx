import { ExclamationCircleOutlined } from "@ant-design/icons";
import {
	Alert,
	Card,
	Col,
	Empty,
	List,
	Row,
	Spin,
	Tag,
	Typography,
} from "antd";
import { useEffect, useState } from "react";
import patientService from "../../api/patientService";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text } = Typography;

const MyAllergies = () => {
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [allergies, setAllergies] = useState([]);
	useEffect(() => {
		const fetchPatientAllergies = async () => {
			if (!user?.patientId) return;

			try {
				setLoading(true);
				setError(null);

				const response = await patientService.getPatientAllergies(
					user.patientId
				);

				if (response && response.allergies) {
					const sortedAllergies = [...response.allergies].sort((a, b) => {
						const severityOrder = { high: 0, low: 1 };
						const severityA = a.severity || "low";
						const severityB = b.severity || "low";
						return severityOrder[severityA] - severityOrder[severityB];
					});
					setAllergies(sortedAllergies);
				} else {
					setAllergies([]);
				}
			} catch (err) {
				console.error("Error fetching allergies:", err);
				setError("Failed to load your allergies. Please try again later.");
			} finally {
				setLoading(false);
			}
		};

		fetchPatientAllergies();
	}, [user]);

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

	const getTypeColor = (type) => {
		switch (type?.toLowerCase()) {
			case "medication":
				return "blue";
			case "food":
				return "green";
			case "material":
				return "purple";
			default:
				return "orange";
		}
	};

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
			<Row gutter={[24, 24]}>
				<Col span={24}>
					<Title level={2}>
						<ExclamationCircleOutlined /> My Allergies
					</Title>
				</Col>
			</Row>

			{allergies.length === 0 ? (
				<Card>
					<Empty
						description="No allergies recorded"
						image={Empty.PRESENTED_IMAGE_SIMPLE}
					/>
				</Card>
			) : (
				<List
					grid={{ gutter: 16, column: 4 }}
					dataSource={allergies}
					renderItem={(allergy) => (
						<List.Item>
							<Card>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "flex-start",
									}}
								>
									<div>
										<Title level={4}>{allergy.name}</Title>
										<div style={{ marginBottom: "10px" }}>
											<Tag color={getTypeColor(allergy.type)}>
												{allergy.type || "Unknown Type"}
											</Tag>{" "}
											{allergy.severity && (
												<Tag color={getSeverityColor(allergy.severity)}>
													{allergy.severity.charAt(0).toUpperCase() +
														allergy.severity.slice(1)}{" "}
													Severity
												</Tag>
											)}
										</div>
										{allergy.description && <Text>{allergy.description}</Text>}
									</div>
								</div>

								{(allergy.notes ||
									allergy.reactions ||
									allergy.detectionDate) && (
									<div style={{ marginTop: "16px" }}>
										{allergy.detectionDate && (
											<div style={{ marginBottom: "8px" }}>
												<Text type="secondary" strong>
													Detected:
												</Text>
												<Text>
													{" "}
													{new Date(allergy.detectionDate).toLocaleDateString()}
												</Text>
											</div>
										)}
										{allergy.notes && (
											<div style={{ marginBottom: "8px" }}>
												<Text type="secondary" strong>
													Medical Notes:
												</Text>
												<Text> {allergy.notes}</Text>
											</div>
										)}
										{allergy.reactions && (
											<div>
												<Text type="secondary" strong>
													Reactions:
												</Text>
												<Text> {allergy.reactions}</Text>
											</div>
										)}
									</div>
								)}
							</Card>
						</List.Item>
					)}
				/>
			)}

			<div style={{ marginTop: "20px" }}>
				<Alert
					type="info"
					message="Important Information"
					description="This list shows allergies recorded in your medical profile. Please notify your doctor if you notice any missing or incorrect information."
					showIcon
				/>
			</div>
		</div>
	);
};

export default MyAllergies;
