import {
	Alert,
	Button,
	Col,
	Divider,
	Form,
	Input,
	Modal,
	Row,
	Select,
	Space,
	Spin,
	Typography,
} from "antd";
import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import doctorService from "../../api/doctorService";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AppointmentDetailsDialog = ({
	open,
	onClose,
	appointment,
	refreshAppointments,
}) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [status, setStatus] = useState("");
	const [notes, setNotes] = useState("");
	const [patientDetails, setPatientDetails] = useState(null);

	useEffect(() => {
		if (appointment) {
			setStatus(appointment.status || "scheduled");
			setNotes(appointment.clinicalNotes || "");

			if (appointment.patient) {
				setPatientDetails({
					name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
					email: appointment.patient.email,
					phone: appointment.patient.phoneNumber,
				});
			}
		}
	}, [appointment]);

	const handleStatusChange = (value) => {
		setStatus(value);
	};

	const handleNotesChange = (e) => {
		setNotes(e.target.value);
	};

	const handleSave = async () => {
		if (!appointment) return;

		setLoading(true);
		setError(null);
		setSuccess(null);

		try {
			await doctorService.updateAppointmentStatus(appointment._id, {
				status,
				clinicalNotes: notes,
			});

			setSuccess("Appointment updated successfully");

			if (refreshAppointments) {
				refreshAppointments();
			}

			setTimeout(() => {
				onClose();
			}, 1500);
		} catch (err) {
			setError(`Failed to update appointment: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	if (!appointment) {
		return null;
	}

	return (
		<Modal
			title="Appointment Details"
			open={open}
			onCancel={onClose}
			width={700}
			footer={[
				<Button key="cancel" onClick={onClose} disabled={loading}>
					Cancel
				</Button>,
				<Button
					key="save"
					type="primary"
					onClick={handleSave}
					loading={loading}
				>
					Save
				</Button>,
			]}
		>
			{loading && (
				<div style={{ textAlign: "center", margin: "20px 0" }}>
					<Spin />
				</div>
			)}

			{error && (
				<Alert
					message={error}
					type="error"
					showIcon
					style={{ marginBottom: 16 }}
				/>
			)}

			{success && (
				<Alert
					message={success}
					type="success"
					showIcon
					style={{ marginBottom: 16 }}
				/>
			)}

			<Space direction="vertical" size="large" style={{ width: "100%" }}>
				<div>
					<Title level={5}>Patient Information</Title>

					<Row gutter={16}>
						<Col span={12}>
							<Text strong>Name</Text>
							<div>{patientDetails?.name || "Loading..."}</div>
						</Col>

						<Col span={12}>
							<Text strong>Contact</Text>
							<div>
								{patientDetails?.email || "Loading..."}
								<br />
								{patientDetails?.phone || ""}
							</div>
						</Col>
					</Row>
				</div>

				<Divider />

				<div>
					<Title level={5}>Appointment Details</Title>

					<Row gutter={16}>
						<Col span={12}>
							<Text strong>Date & Time</Text>
							<div>
								{appointment.appointmentDate
									? format(parseISO(appointment.appointmentDate), "PPP p")
									: "Not specified"}
							</div>
						</Col>

						<Col span={12}>
							<Text strong>Procedure</Text>
							<div>
								{appointment.interventionType?.name || "General Consultation"}
							</div>
						</Col>

						<Col span={24}>
							<Text strong>Duration</Text>
							<div>
								{appointment.interventionType?.durationMinutes
									? `${appointment.interventionType.durationMinutes} minutes`
									: "Not specified"}
							</div>
						</Col>
					</Row>
				</div>

				<Divider />

				<div>
					<Title level={5}>Update Appointment</Title>

					<Form layout="vertical">
						<Row gutter={16}>
							<Col span={12}>
								<Form.Item label="Status">
									<Select
										value={status}
										onChange={handleStatusChange}
										disabled={loading}
									>
										<Option value="scheduled">Scheduled</Option>
										<Option value="completed">Completed</Option>
										<Option value="no-show">No Show</Option>
										<Option value="canceled">Canceled</Option>
									</Select>
								</Form.Item>
							</Col>
						</Row>

						<Form.Item label="Clinical Notes">
							<TextArea
								rows={4}
								value={notes}
								onChange={handleNotesChange}
								disabled={loading}
							/>
						</Form.Item>
					</Form>
				</div>
			</Space>
		</Modal>
	);
};

export default AppointmentDetailsDialog;
