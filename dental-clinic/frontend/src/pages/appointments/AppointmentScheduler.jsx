import {
	Alert,
	Button,
	Card,
	Col,
	DatePicker,
	Form,
	Row,
	Select,
	Space,
	Steps,
	Typography,
} from "antd";
import locale from "antd/es/date-picker/locale/en_US";
import { addDays, format, isAfter, isBefore, isWeekend } from "date-fns";
import { enUS } from "date-fns/locale";
import { useContext, useEffect, useState } from "react";

import doctorService from "../../api/doctorService";
import interventionService from "../../api/interventionService";
import interventionTypeService from "../../api/interventionTypeService";
import AuthContext from "../../contexts/AuthContext";

const AppointmentScheduler = () => {
	const { currentUser } = useContext(AuthContext);
	const [activeStep, setActiveStep] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const [selectedInterventionType, setSelectedInterventionType] = useState("");
	const [selectedDoctor, setSelectedDoctor] = useState("");
	const [selectedDate, setSelectedDate] = useState(null);
	const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

	const [interventionTypes, setInterventionTypes] = useState([]);
	const [doctors, setDoctors] = useState([]);
	const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

	useEffect(() => {
		const loadInterventionTypes = async () => {
			try {
				const data = await interventionTypeService.getAllInterventionTypes();
				setInterventionTypes(Array.isArray(data) ? data : []);
			} catch (error) {
				setError("Error loading intervention types: " + error.message);
			}
		};

		loadInterventionTypes();
	}, []);

	useEffect(() => {
		if (!selectedInterventionType) return;

		const loadDoctors = async () => {
			try {
				setLoading(true);
				setError(null);

				const { doctors } = await doctorService.getAllDoctors();
				setDoctors(doctors || []);
			} catch (error) {
				setError("Error loading doctors: " + error.message);
			} finally {
				setLoading(false);
			}
		};

		loadDoctors();
	}, [selectedInterventionType]);

	useEffect(() => {
		if (!selectedDoctor || !selectedDate || !selectedInterventionType) return;

		const loadAvailableTimeSlots = async () => {
			try {
				setLoading(true);
				setError(null);

				const formattedDate = format(selectedDate, "yyyy-MM-dd");
				const { availableSlots } =
					await interventionService.getAvailableAppointmentSlots(
						selectedDoctor,
						formattedDate,
						selectedInterventionType
					);

				setAvailableTimeSlots(availableSlots || []);
			} catch (error) {
				setError("Error loading available time slots: " + error.message);
			} finally {
				setLoading(false);
			}
		};

		loadAvailableTimeSlots();
	}, [selectedDoctor, selectedDate, selectedInterventionType]);

	const handleNext = () => {
		setActiveStep((prevStep) => prevStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	const handleSubmit = async () => {
		if (
			!selectedInterventionType ||
			!selectedDoctor ||
			!selectedDate ||
			!selectedTimeSlot
		) {
			setError("Please complete all fields before submitting");
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const appointmentDate = `${format(
				selectedDate,
				"yyyy-MM-dd"
			)}T${selectedTimeSlot}:00.000Z`;

			await interventionService.scheduleAppointment({
				patient: currentUser.patientId,
				doctor: selectedDoctor,
				interventionType: selectedInterventionType,
				appointmentDate,
				state: "scheduled",
				notes: "",
			});

			setActiveStep(3);
		} catch (error) {
			setError("Failed to schedule appointment: " + error.message);
		} finally {
			setLoading(false);
		}
	};

	const getStepContent = (step) => {
		switch (step) {
			case 0:
				return (
					<Form.Item label="Procedure Type">
						<Select
							value={selectedInterventionType}
							onChange={(value) => setSelectedInterventionType(value)}
						>
							{interventionTypes.map((type) => (
								<Select.Option key={type._id} value={type._id}>
									{type.name} ({type.duration} min, €{type.cost})
								</Select.Option>
							))}
						</Select>
						<Form.Item>
							<Button
								type="primary"
								onClick={handleNext}
								disabled={!selectedInterventionType}
							>
								Next
							</Button>
						</Form.Item>
					</Form.Item>
				);

			case 1:
				return (
					<>
						<Form.Item label="Doctor">
							<Select
								value={selectedDoctor}
								onChange={(value) => setSelectedDoctor(value)}
							>
								{doctors.map((doctor) => (
									<Select.Option key={doctor._id} value={doctor.userId}>
										Dr. {doctor.name || "Unknown"}
									</Select.Option>
								))}
							</Select>
						</Form.Item>

						{selectedDoctor && (
							<Form.Item label="Appointment Date">
								<DatePicker
									value={selectedDate}
									onChange={setSelectedDate}
									locale={locale}
									disabledDate={(date) => {
										return (
											isWeekend(date) ||
											isBefore(date, new Date()) ||
											isAfter(date, addDays(new Date(), 30))
										);
									}}
								/>
							</Form.Item>
						)}

						<Space>
							<Button onClick={handleBack}>Back</Button>
							<Button
								type="primary"
								onClick={handleNext}
								disabled={!selectedDoctor || !selectedDate}
							>
								Next
							</Button>
						</Space>
					</>
				);

			case 2:
				return (
					<>
						<Typography.Title level={4}>Select Time Slot</Typography.Title>

						<Row gutter={[16, 16]}>
							{availableTimeSlots.length > 0 ? (
								availableTimeSlots.map((slot) => (
									<Col key={slot} span={6}>
										<Button
											type={selectedTimeSlot === slot ? "primary" : "default"}
											onClick={() => setSelectedTimeSlot(slot)}
										>
											{slot}
										</Button>
									</Col>
								))
							) : (
								<Col span={24}>
									<Alert
										message="No available time slots for the selected date. Please select a different date."
										type="info"
									/>
								</Col>
							)}
						</Row>

						{selectedTimeSlot && (
							<Card>
								<Typography.Title level={4}>
									Appointment Summary
								</Typography.Title>

								<Row>
									<Col span={12}>
										<Typography.Text type="secondary">
											Procedure:
										</Typography.Text>
									</Col>
									<Col span={12}>
										<Typography.Text>
											{
												interventionTypes.find(
													(t) => t._id === selectedInterventionType
												)?.name
											}
										</Typography.Text>
									</Col>
									<Col span={12}>
										<Typography.Text type="secondary">Doctor:</Typography.Text>
									</Col>
									<Col span={12}>
										<Typography.Text>
											Dr.{" "}
											{doctors.find((d) => d.userId === selectedDoctor)?.name ||
												"Unknown"}
										</Typography.Text>
									</Col>
									<Col span={12}>
										<Typography.Text type="secondary">Date:</Typography.Text>
									</Col>{" "}
									<Col span={12}>
										<Typography.Text>
											{selectedDate &&
												format(selectedDate, "EEEE, MMMM d, yyyy", {
													locale: enUS,
												})}
										</Typography.Text>
									</Col>
									<Col span={12}>
										<Typography.Text type="secondary">Time:</Typography.Text>
									</Col>
									<Col span={12}>
										<Typography.Text>{selectedTimeSlot}</Typography.Text>
									</Col>
								</Row>
							</Card>
						)}

						<Space>
							<Button onClick={handleBack}>Back</Button>
							<Button
								type="primary"
								onClick={handleSubmit}
								disabled={!selectedTimeSlot || loading}
							>
								Schedule Appointment
							</Button>
						</Space>
					</>
				);

			case 3:
				return (
					<div style={{ textAlign: "center", padding: "32px 0" }}>
						<Typography.Title level={3} style={{ color: "#1890ff" }}>
							Appointment Scheduled Successfully!
						</Typography.Title>

						<Typography.Paragraph>
							Your appointment has been confirmed for:
						</Typography.Paragraph>

						<Typography.Title level={4}>
							{selectedDate &&
								format(selectedDate, "EEEE, MMMM d, yyyy", {
									locale: enUS,
								})}{" "}
							at {selectedTimeSlot}
						</Typography.Title>

						<Typography.Paragraph>
							With Dr.{" "}
							{doctors.find((d) => d.userId === selectedDoctor)?.name ||
								"Unknown"}
						</Typography.Paragraph>

						<Typography.Text type="secondary">
							You will receive a confirmation email shortly.
						</Typography.Text>

						<Button
							type="primary"
							href="/patient/appointments"
							style={{ marginTop: "24px" }}
						>
							View My Appointments
						</Button>
					</div>
				);

			default:
				return "Unknown step";
		}
	};

	const steps = [
		"Select Procedure",
		"Select Doctor & Date",
		"Select Time & Confirm",
	];

	return (
		<Card>
			<Typography.Title level={2}>Schedule New Appointment</Typography.Title>

			<Steps current={activeStep} style={{ marginBottom: "24px" }}>
				{steps.map((label) => (
					<Steps.Step key={label} title={label} />
				))}
			</Steps>

			{error && (
				<Alert message={error} type="error" style={{ marginBottom: "24px" }} />
			)}

			<Card>{getStepContent(activeStep)}</Card>
		</Card>
	);
};

export default AppointmentScheduler;
