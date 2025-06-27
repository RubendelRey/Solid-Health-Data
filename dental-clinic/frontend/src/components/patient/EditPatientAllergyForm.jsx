import {
	Alert,
	Button,
	Col,
	DatePicker,
	Form,
	Input,
	message,
	Row,
	Select,
	Spin,
} from "antd";
import moment from "moment";
import { useEffect, useState } from "react";
import allergyService from "../../api/allergyService";
import patientService from "../../api/patientService";

const { Option } = Select;
const { TextArea } = Input;

const EditPatientAllergyForm = ({
	isEditing,
	currentAllergy,
	patientId,
	onSuccess,
	onCancel,
}) => {
	const [form] = Form.useForm();
	const [allergies, setAllergies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchAllergyCatalogue = async () => {
			try {
				setLoading(true);
				const response = await allergyService.getAllAllergies();
				setAllergies(response);
				setError(null);
			} catch (err) {
				console.error("Error loading allergy catalogue:", err);
				setError("Failed to load allergies. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		fetchAllergyCatalogue();
	}, []);

	useEffect(() => {
		if (isEditing && currentAllergy) {
			form.setFieldsValue({
				allergyId: currentAllergy.allergyId,
				severity: currentAllergy.severity || "low",
				status: currentAllergy.status || "active",
				detectionDate: currentAllergy.detectionDate
					? moment(currentAllergy.detectionDate)
					: null,
				notes: currentAllergy.notes || "",
				reactions: currentAllergy.reactions || "",
			});
		}
	}, [isEditing, currentAllergy, form]);

	const handleSubmit = async (values) => {
		try {
			setSubmitting(true);
			setError(null);

			const formattedValues = {
				...values,
				detectionDate: values.detectionDate
					? values.detectionDate.format("YYYY-MM-DD")
					: null,
			};

			if (isEditing && currentAllergy) {
				await patientService.updatePatientAllergy(
					patientId,
					currentAllergy._id,
					formattedValues
				);
				message.success("Allergy updated successfully");
			} else {
				await patientService.addAllergyToPatient(patientId, formattedValues);
				message.success("Allergy added successfully");
			}

			onSuccess();

			form.resetFields();
		} catch (err) {
			console.error("Error saving patient allergy:", err);
			setError(err.message || "Failed to save allergy information");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return <Spin tip="Loading allergies..." />;
	}

	return (
		<div>
			{error && (
				<Alert
					message="Error"
					description={error}
					type="error"
					style={{ marginBottom: 16 }}
					closable
				/>
			)}

			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				initialValues={{
					severity: "low",
					status: "active",
					detectionDate: moment(),
					notes: "",
					reactions: "",
				}}
			>
				<Form.Item
					name="allergyId"
					label="Allergy"
					rules={[{ required: true, message: "Please select an allergy" }]}
				>
					<Select
						showSearch
						placeholder="Select allergy from catalogue"
						optionFilterProp="children"
						disabled={isEditing}
					>
						{allergies.map((allergy) => (
							<Option key={allergy._id} value={allergy._id}>
								{allergy.name} ({allergy.type})
							</Option>
						))}
					</Select>
				</Form.Item>

				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							name="severity"
							label="Severity"
							rules={[{ required: true, message: "Please select severity" }]}
						>
							<Select>
								<Option value="low">Low</Option>
								<Option value="high">High</Option>
							</Select>
						</Form.Item>
					</Col>

					<Col span={12}>
						<Form.Item
							name="status"
							label="Status"
							rules={[{ required: true, message: "Please select status" }]}
						>
							<Select>
								<Option value="active">Active</Option>
								<Option value="inactive">Inactive</Option>
							</Select>
						</Form.Item>
					</Col>
				</Row>

				<Form.Item
					name="detectionDate"
					label="Detection Date"
					rules={[{ required: true, message: "Please select detection date" }]}
				>
					<DatePicker style={{ width: "100%" }} />
				</Form.Item>

				<Form.Item name="reactions" label="Reactions">
					<Input placeholder="e.g., Skin rash, difficulty breathing" />
				</Form.Item>

				<Form.Item name="notes" label="Medical Notes">
					<TextArea
						rows={4}
						placeholder="Additional medical notes about this allergy"
					/>
				</Form.Item>

				<Form.Item>
					<div
						style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
					>
						<Button onClick={onCancel}>Cancel</Button>
						<Button type="primary" htmlType="submit" loading={submitting}>
							{isEditing ? "Update" : "Add"} Allergy
						</Button>
					</div>
				</Form.Item>
			</Form>
		</div>
	);
};

export default EditPatientAllergyForm;
