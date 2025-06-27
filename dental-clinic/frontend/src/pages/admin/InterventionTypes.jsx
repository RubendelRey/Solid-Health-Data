import {
	ClockCircleOutlined,
	DeleteOutlined,
	DollarOutlined,
	EditOutlined,
	ExclamationCircleOutlined,
	PlusCircleOutlined,
} from "@ant-design/icons";
import {
	Button,
	Card,
	Form,
	Input,
	InputNumber,
	message,
	Modal,
	Popconfirm,
	Space,
	Table,
	Tooltip,
	Typography,
} from "antd";
import { useEffect, useState } from "react";
import interventionTypeService from "../../api/interventionTypeService";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text } = Typography;
const { TextArea } = Input;

const InterventionTypes = () => {
	const [interventionTypes, setInterventionTypes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [modalVisible, setModalVisible] = useState(false);
	const [editingType, setEditingType] = useState(null);
	const [form] = Form.useForm();
	const { isAdmin } = useAuth();

	useEffect(() => {
		fetchInterventionTypes();
	}, []);

	const fetchInterventionTypes = async () => {
		try {
			setLoading(true);
			const response = await interventionTypeService.getAllInterventionTypes();
			setInterventionTypes(response);
		} catch (error) {
			console.error("Error fetching intervention types:", error);
			message.error("Failed to load intervention types");
		} finally {
			setLoading(false);
		}
	};

	const handleFormSubmit = async (values) => {
		try {
			if (editingType) {
				await interventionTypeService.updateInterventionType(
					editingType.id,
					values
				);
				message.success("Intervention type updated successfully");
			} else {
				await interventionTypeService.createInterventionType(values);
				message.success("Intervention type created successfully");
			}

			fetchInterventionTypes();
			setModalVisible(false);
			form.resetFields();
		} catch (error) {
			console.error("Error saving intervention type:", error);
			message.error("Failed to save intervention type");
		}
	};

	const handleDeleteInterventionType = async (id) => {
		try {
			await interventionTypeService.deleteInterventionType(id);
			message.success("Intervention type deleted successfully");
			fetchInterventionTypes();
		} catch (error) {
			console.error("Error deleting intervention type:", error);
			message.error("Failed to delete intervention type");
		}
	};

	const showInterventionTypeModal = (type = null) => {
		setEditingType(type);

		if (type) {
			form.setFieldsValue({
				...type,
			});
		} else {
			form.resetFields();
		}

		setModalVisible(true);
	};

	const columns = [
		{
			title: "Name",
			dataIndex: "name",
			key: "name",
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (text) => <Text strong>{text}</Text>,
		},
		{
			title: "Duration (minutes)",
			dataIndex: "duration",
			key: "duration",
			sorter: (a, b) => a.duration - b.duration,
			render: (duration) => (
				<Space>
					<ClockCircleOutlined />
					<span>{duration} min</span>
				</Space>
			),
		},
		{
			title: "Price (€)",
			dataIndex: "cost",
			key: "price",
			sorter: (a, b) => a.cost - b.cost,
			render: (price) => (
				<Space>
					<DollarOutlined />
					<span>{price ? price.toFixed(2) : "?"} €</span>
				</Space>
			),
		},
		{
			title: "Description",
			dataIndex: "description",
			key: "description",
			ellipsis: true,
			render: (description) =>
				description || <Text type="secondary">No description</Text>,
		},
		{
			title: "Actions",
			key: "actions",
			render: (_, record) => (
				<Space size="small">
					<Tooltip title="Edit">
						<Button
							type="primary"
							icon={<EditOutlined />}
							onClick={() => showInterventionTypeModal(record)}
						/>
					</Tooltip>
					<Tooltip title="Delete">
						<Popconfirm
							title="Are you sure you want to delete this intervention type?"
							description="This may affect existing appointments and records."
							okText="Yes"
							cancelText="No"
							icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
							onConfirm={() => handleDeleteInterventionType(record.id)}
						>
							<Button danger icon={<DeleteOutlined />} />
						</Popconfirm>
					</Tooltip>
				</Space>
			),
		},
	];

	if (!isAdmin) {
		return (
			<div style={{ textAlign: "center", padding: 50 }}>
				<Title level={3}>Not Authorized</Title>
				<Text>You do not have permission to access this page.</Text>
			</div>
		);
	}

	return (
		<div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: 16,
				}}
			>
				<Title level={2} style={{ color: "#1890ff" }}>
					Intervention Types Management
				</Title>
				<Button
					type="primary"
					icon={<PlusCircleOutlined />}
					onClick={() => showInterventionTypeModal()}
				>
					Add New Type
				</Button>
			</div>
			<Card>
				<Table
					columns={columns}
					dataSource={interventionTypes}
					rowKey="_id"
					loading={loading}
					pagination={{ pageSize: 10 }}
				/>
			</Card>

			<Modal
				title={
					editingType ? "Edit Intervention Type" : "Add New Intervention Type"
				}
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
				footer={null}
			>
				<Form form={form} layout="vertical" onFinish={handleFormSubmit}>
					<Form.Item
						name="name"
						label="Name"
						rules={[
							{
								required: true,
								message: "Please enter the intervention type name",
							},
						]}
					>
						<Input placeholder="Enter name" />
					</Form.Item>

					<Form.Item
						name="duration"
						label="Duration (minutes)"
						rules={[{ required: true, message: "Please enter the duration" }]}
					>
						<InputNumber
							min={5}
							step={5}
							placeholder="Duration in minutes"
							style={{ width: "100%" }}
						/>
					</Form.Item>

					<Form.Item
						name="price"
						label="Price (€)"
						rules={[{ required: true, message: "Please enter the price" }]}
					>
						<InputNumber
							min={0}
							step={5}
							precision={2}
							placeholder="Price in euros"
							style={{ width: "100%" }}
						/>
					</Form.Item>

					<Form.Item name="description" label="Description">
						<TextArea
							rows={4}
							placeholder="Enter description of the intervention type"
						/>
					</Form.Item>

					<div style={{ textAlign: "right", marginTop: 24 }}>
						<Space>
							<Button onClick={() => setModalVisible(false)}>Cancel</Button>
							<Button type="primary" htmlType="submit">
								{editingType ? "Update" : "Add"}
							</Button>
						</Space>
					</div>
				</Form>
			</Modal>
		</div>
	);
};

export default InterventionTypes;
