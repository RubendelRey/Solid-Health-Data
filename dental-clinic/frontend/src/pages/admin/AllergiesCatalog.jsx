import {
	DeleteOutlined,
	EditOutlined,
	ExclamationCircleOutlined,
	PlusCircleOutlined,
} from "@ant-design/icons";
import {
	Button,
	Card,
	Form,
	Input,
	message,
	Modal,
	Popconfirm,
	Select,
	Space,
	Table,
	Tag,
	Tooltip,
	Typography,
} from "antd";
import { useEffect, useState } from "react";
import allergyService from "../../api/allergyService";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text } = Typography;
const { TextArea } = Input;

const AllergiesCatalog = () => {
	const [allergies, setAllergies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [modalVisible, setModalVisible] = useState(false);
	const [editingAllergy, setEditingAllergy] = useState(null);
	const [form] = Form.useForm();
	const { isAdmin } = useAuth();

	useEffect(() => {
		fetchAllergies();
	}, []);

	const fetchAllergies = async () => {
		try {
			setLoading(true);
			const response = await allergyService.getAllAllergies();
			setAllergies(response);
		} catch (error) {
			console.error("Error fetching allergies:", error);
			message.error("Failed to load allergies catalog");
		} finally {
			setLoading(false);
		}
	};

	const handleFormSubmit = async (values) => {
		try {
			if (editingAllergy) {
				await allergyService.updateAllergy(editingAllergy.id, values);
				message.success("Allergy updated successfully");
			} else {
				await allergyService.createAllergy(values);
				message.success("Allergy created successfully");
			}

			fetchAllergies();
			setModalVisible(false);
			form.resetFields();
		} catch (error) {
			console.error("Error saving allergy:", error);
			message.error("Failed to save allergy");
		}
	};

	const handleDeleteAllergy = async (id) => {
		try {
			await allergyService.deleteAllergy(id);
			message.success("Allergy deleted successfully");
			fetchAllergies();
		} catch (error) {
			console.error("Error deleting allergy:", error);
			message.error("Failed to delete allergy");
		}
	};

	const showAllergyModal = (allergy = null) => {
		setEditingAllergy(allergy);

		if (allergy) {
			form.setFieldsValue({
				...allergy,
			});
		} else {
			form.resetFields();
		}

		setModalVisible(true);
	};
	const columns = [
		{
			title: "Code",
			dataIndex: "code",
			key: "code",
			width: 120,
		},
		{
			title: "Name",
			dataIndex: "name",
			key: "name",
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (text) => <Text strong>{text}</Text>,
		},
		{
			title: "Type",
			dataIndex: "type",
			key: "type",
			filters: [
				{ text: "Medication", value: "Medication" },
				{ text: "Material", value: "Material" },
				{ text: "Food", value: "Food" },
				{ text: "Environmental", value: "Environmental" },
			],
			onFilter: (value, record) => record.type === value,
			render: (type) => (
				<Tag
					color={
						type === "Medication"
							? "blue"
							: type === "Material"
							? "purple"
							: type === "Food"
							? "green"
							: type === "Environmental"
							? "orange"
							: "default"
					}
				>
					{type || "Not specified"}
				</Tag>
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
							onClick={() => showAllergyModal(record)}
						/>
					</Tooltip>
					<Tooltip title="Delete">
						<Popconfirm
							title="Are you sure you want to delete this allergy?"
							description="This may affect existing patient records."
							okText="Yes"
							cancelText="No"
							icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
							onConfirm={() => handleDeleteAllergy(record.id)}
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
					Allergies Catalog Management
				</Title>
				<Button
					type="primary"
					icon={<PlusCircleOutlined />}
					onClick={() => showAllergyModal()}
				>
					Add New Allergy
				</Button>
			</div>
			<Card>
				<Table
					columns={columns}
					dataSource={allergies}
					rowKey="_id"
					loading={loading}
					pagination={{ pageSize: 10 }}
				/>
			</Card>

			<Modal
				title={editingAllergy ? "Edit Allergy" : "Add New Allergy"}
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
				footer={null}
			>
				<Form form={form} layout="vertical" onFinish={handleFormSubmit}>
					{" "}
					<Form.Item
						name="code"
						label="Code"
						rules={[
							{ required: true, message: "Please enter the allergy code" },
						]}
					>
						<Input placeholder="Enter unique code (e.g., ALLRG-XXX)" />
					</Form.Item>
					<Form.Item
						name="name"
						label="Name"
						rules={[
							{ required: true, message: "Please enter the allergy name" },
						]}
					>
						<Input placeholder="Enter allergy name" />
					</Form.Item>
					<Form.Item
						name="type"
						label="Type"
						rules={[
							{ required: true, message: "Please select the allergy type" },
						]}
					>
						<Select
							style={{ width: "100%" }}
							placeholder="Select allergy type"
							options={[
								{ value: "Medication", label: "Medication" },
								{ value: "Material", label: "Material" },
								{ value: "Food", label: "Food" },
								{ value: "Environmental", label: "Environmental" },
							]}
						/>
					</Form.Item>
					<Form.Item
						name="description"
						label="Description"
						rules={[{ required: false }]}
					>
						<TextArea
							rows={4}
							placeholder="Enter description, symptoms, or important notes about this allergy"
						/>
					</Form.Item>
					<div style={{ textAlign: "right", marginTop: 24 }}>
						<Space>
							<Button onClick={() => setModalVisible(false)}>Cancel</Button>
							<Button type="primary" htmlType="submit">
								{editingAllergy ? "Update" : "Add"}
							</Button>
						</Space>
					</div>
				</Form>
			</Modal>
		</div>
	);
};

export default AllergiesCatalog;
