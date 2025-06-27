import {
	CalendarOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	FileTextOutlined,
	LeftOutlined,
	MedicineBoxOutlined,
	RightOutlined,
	UserOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Col,
	DatePicker,
	Divider,
	Form,
	Input,
	Layout,
	List,
	Row,
	Select,
	Space,
	Spin,
	Steps,
	Tag,
	TimePicker,
	Typography,
} from "antd";
import locale from "antd/es/date-picker/locale/en_US";
import { format, isWeekend } from "date-fns";
import { enUS } from "date-fns/locale";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import doctorService from "../../api/doctorService";
import interventionService from "../../api/interventionService";
import interventionTypeService from "../../api/interventionTypeService";
import AuthContext from "../../contexts/AuthContext";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const steps = [
	"Select Procedure",
	"Choose Doctor",
	"Select Date & Time",
	"Confirmation",
];

const NewAppointment = () => {
	const navigate = useNavigate();
	const { user } = useContext(AuthContext);

	const [currentStep, setCurrentStep] = useState(0);

	const [formData, setFormData] = useState({
		patientId: "",
		doctorId: "",
		interventionTypeId: "",
		appointmentDate: null,
		appointmentTime: null,
		notes: "",
	});

	const [interventionTypes, setInterventionTypes] = useState([]);
	const [doctors, setDoctors] = useState([]);
	const [selectedDoctor, setSelectedDoctor] = useState(null);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (user?.patientId) {
			setFormData((prevData) => ({
				...prevData,
				patientId: user.patientId,
			}));
		}
	}, [user]);

	useEffect(() => {
		const fetchInterventionTypes = async () => {
			try {
				setLoading(true);
				const types = await interventionTypeService.getAllInterventionTypes();
				setInterventionTypes(types);
			} catch (err) {
				setError("Failed to load dental procedures: " + err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchInterventionTypes();
	}, []);

	useEffect(() => {
		const fetchDoctors = async () => {
			if (!formData.interventionTypeId) return;

			try {
				setLoading(true);

				const doctorsList = await doctorService.getAllDoctors();

				setDoctors(doctorsList);
			} catch (err) {
				setError("Failed to load doctors: " + err.message);
			} finally {
				setLoading(false);
			}
		};
		if (currentStep === 1) {
			fetchDoctors();
		}
	}, [currentStep, formData.interventionTypeId]);

	useEffect(() => {
		const fetchDoctorDetails = async () => {
			if (!formData.doctorId) return;

			try {
				const doctor = await doctorService.getDoctorById(formData.doctorId);
				setSelectedDoctor(doctor);
			} catch (err) {
				console.error("Error fetching doctor details:", err);
			}
		};

		if (formData.doctorId) {
			fetchDoctorDetails();
		}
	}, [formData.doctorId]);

	const handleChange = (field) => (event) => {
		setFormData({
			...formData,
			[field]: event.target.value,
		});
	};

	const handleDateChange = (newDate) => {
		setFormData({
			...formData,
			appointmentDate: newDate,
			appointmentTime: null,
		});
	};

	const handleTimeChange = (time) => {
		setFormData({
			...formData,
			appointmentTime: time,
		});
	};

	const checkDoctorAvailability = async () => {
		if (
			!formData.doctorId ||
			!formData.appointmentDate ||
			!formData.appointmentTime ||
			!formData.interventionTypeId
		) {
			return false;
		}

		try {
			setLoading(true);

			const appointmentDateTime = new Date(formData.appointmentDate);
			const timeObj = new Date(formData.appointmentTime);
			appointmentDateTime.setHours(timeObj.getHours(), timeObj.getMinutes(), 0);

			const result = await interventionService.checkDoctorAvailability(
				formData.doctorId,
				appointmentDateTime.toISOString(),
				formData.interventionTypeId
			);

			return result.isAvailable;
		} catch (err) {
			setError("Failed to check doctor availability: " + err.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	const handleNext = () => {
		setCurrentStep((prevStep) => prevStep + 1);
	};

	const handleBack = () => {
		setCurrentStep((prevStep) => prevStep - 1);
	};

	const handleSubmit = async () => {
		try {
			setLoading(true);
			setError(null);

			const appointmentDateTime = new Date(formData.appointmentDate);
			const timeObj = new Date(formData.appointmentTime);
			appointmentDateTime.setHours(timeObj.getHours(), timeObj.getMinutes(), 0);

			const isAvailable = await checkDoctorAvailability();

			if (!isAvailable) {
				setError(
					"The selected time conflicts with another appointment or is outside working hours. Please choose another time."
				);
				return;
			}

			const appointmentData = {
				patient: formData.patientId,
				doctor: formData.doctorId,
				interventionType: formData.interventionTypeId,
				date: appointmentDateTime.toISOString(),
				notes: formData.notes,
				state: "scheduled",
			};

			await interventionService.scheduleAppointment(appointmentData);

			handleNext();
		} catch (err) {
			setError("Failed to schedule appointment: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	const getStepContent = (step) => {
		switch (step) {
			case 0:
				return (
					<Space direction="vertical" size="middle" style={{ display: "flex" }}>
						<Title level={4}>Select Dental Procedure</Title>

						<Form.Item
							label="Procedure Type"
							validateStatus={!formData.interventionTypeId ? "error" : ""}
							help={
								!formData.interventionTypeId
									? "Please select a dental procedure"
									: ""
							}
						>
							<Select
								value={formData.interventionTypeId}
								onChange={(value) =>
									handleChange("interventionTypeId")({ target: { value } })
								}
							>
								{interventionTypes.map((type) => (
									<Option key={type._id} value={type._id}>
										{type.name}
									</Option>
								))}
							</Select>
						</Form.Item>

						{formData.interventionTypeId && (
							<Space direction="vertical" size="small">
								<Text>
									<strong>Selected Procedure:</strong>{" "}
									{
										interventionTypes.find(
											(t) => t._id === formData.interventionTypeId
										)?.name
									}
								</Text>
								<Text>
									<strong>Description:</strong>{" "}
									{
										interventionTypes.find(
											(t) => t._id === formData.interventionTypeId
										)?.description
									}
								</Text>
								<Text>
									<strong>Estimated Duration:</strong>{" "}
									{
										interventionTypes.find(
											(t) => t._id === formData.interventionTypeId
										)?.duration
									}{" "}
									minutes
								</Text>
								<Text>
									<strong>Price:</strong>{" "}
									{
										interventionTypes.find(
											(t) => t._id === formData.interventionTypeId
										)?.cost
									}
									€
								</Text>
							</Space>
						)}
					</Space>
				);

			case 1:
				return (
					<Space direction="vertical" size="middle" style={{ display: "flex" }}>
						<Title level={4}>Choose Your Dentist</Title>

						{doctors.length > 0 ? (
							<Row gutter={[16, 16]}>
								{doctors.map((doctor) => (
									<Col xs={24} sm={12} md={8} key={doctor._id}>
										<Card
											hoverable
											onClick={() =>
												setFormData({ ...formData, doctorId: doctor._id })
											}
											style={{
												borderColor:
													formData.doctorId === doctor._id
														? "#1890ff"
														: "#f0f0f0",
												transform:
													formData.doctorId === doctor._id
														? "scale(1.02)"
														: "scale(1)",
												transition: "all 0.3s ease",
											}}
										>
											<Card.Meta
												title={`${doctor.name}`}
												description={
													<Space direction="vertical" size="small">
														{doctor.specialties &&
															doctor.specialties.map((specialty, index) => (
																<Tag color="blue" key={index}>
																	{specialty}
																</Tag>
															))}
														<Text type="secondary">
															{doctor.description ||
																"Experienced dental professional"}
														</Text>
													</Space>
												}
											/>
										</Card>
									</Col>
								))}
							</Row>
						) : (
							<Alert
								message="No doctors available. Please check back later."
								type="info"
							/>
						)}
					</Space>
				);

			case 2:
				return (
					<Space direction="vertical" size="middle" style={{ display: "flex" }}>
						<Title level={4}>Select Date & Time</Title>

						<Row gutter={[16, 16]}>
							<Col xs={24} md={12}>
								<Text>Select Date</Text>
								<DatePicker
									value={formData.appointmentDate}
									onChange={handleDateChange}
									disabledDate={(current) =>
										current && (current < new Date() || isWeekend(current))
									}
									locale={locale}
									style={{ width: "100%" }}
								/>
							</Col>
							<Col xs={24} md={12}>
								<Text>Select Time</Text>

								{formData.appointmentDate ? (
									<TimePicker
										value={formData.appointmentTime}
										onChange={handleTimeChange}
										format="HH:mm"
										minuteStep={15}
										use12Hours={false}
										placeholder="Select appointment time"
										style={{ width: "100%" }}
										disabled={!formData.appointmentDate}
										{...getDisabledTimeConfig(
											selectedDoctor,
											formData.appointmentDate
										)}
									/>
								) : (
									<Alert
										message="Please select a date first to select a time."
										type="info"
									/>
								)}
							</Col>
						</Row>

						<Form.Item label="Additional Notes (Optional)">
							<TextArea
								value={formData.notes}
								onChange={(e) => handleChange("notes")(e)}
								rows={4}
								placeholder="Add any additional information or special requirements for your appointment"
							/>
						</Form.Item>
					</Space>
				);

			case 3:
				return (
					<Space direction="vertical" size="middle" style={{ display: "flex" }}>
						<Title level={4}>Review & Confirm</Title>

						<Card>
							<List
								itemLayout="horizontal"
								dataSource={[
									{
										title: "Procedure",
										description: interventionTypes.find(
											(t) => t._id === formData.interventionTypeId
										)?.name,
										icon: <MedicineBoxOutlined />,
									},
									{
										title: "Doctor",
										description: `Dr. ${selectedDoctor?.name || ""}`,
										icon: <UserOutlined />,
									},
									{
										title: "Date",
										description: formData.appointmentDate
											? format(formData.appointmentDate, "EEEE, MMMM d, yyyy", {
													locale: enUS,
											  })
											: "",
										icon: <CalendarOutlined />,
									},
									{
										title: "Time",
										description: formData.appointmentTime
											? format(formData.appointmentTime, "HH:mm")
											: "",
										icon: <ClockCircleOutlined />,
									},
									formData.notes && {
										title: "Additional Notes",
										description: formData.notes,
										icon: <FileTextOutlined />,
									},
								].filter(Boolean)}
								renderItem={(item) => (
									<List.Item>
										<List.Item.Meta
											avatar={item.icon}
											title={item.title}
											description={item.description}
										/>
									</List.Item>
								)}
							/>

							<Divider />

							<Space direction="vertical" size="small">
								<Text>
									<strong>Estimated Duration:</strong>{" "}
									{
										interventionTypes.find(
											(t) => t._id === formData.interventionTypeId
										)?.duration
									}{" "}
									minutes
								</Text>
								<Text>
									<strong>Price:</strong>{" "}
									{
										interventionTypes.find(
											(t) => t._id === formData.interventionTypeId
										)?.cost
									}
									€
								</Text>
							</Space>
						</Card>
					</Space>
				);

			case 4:
				return (
					<Space
						direction="vertical"
						size="middle"
						style={{ display: "flex", alignItems: "center" }}
					>
						<CheckCircleOutlined style={{ fontSize: 60, color: "#52c41a" }} />

						<Title level={3} style={{ textAlign: "center" }}>
							Appointment Scheduled Successfully!
						</Title>

						<Paragraph style={{ textAlign: "center" }}>
							Your appointment has been confirmed. You will receive a
							confirmation email shortly.
						</Paragraph>

						<Button
							type="primary"
							onClick={() => navigate("/patient/appointments")}
							icon={<CalendarOutlined />}
						>
							View My Appointments
						</Button>
					</Space>
				);

			default:
				return "Unknown step";
		}
	};
	const isStepValid = () => {
		switch (currentStep) {
			case 0:
				return !!formData.interventionTypeId;
			case 1:
				return !!formData.doctorId;
			case 2:
				return !!formData.appointmentDate && !!formData.appointmentTime;
			case 3:
				return true;
			default:
				return false;
		}
	};

	return (
		<Layout.Content style={{ padding: "0 50px" }}>
			<Title level={2}>Schedule New Appointment</Title>

			{error && (
				<Alert
					message={error}
					type="error"
					showIcon
					style={{ marginBottom: 24 }}
				/>
			)}

			<Card>
				{" "}
				<Steps current={currentStep} style={{ marginBottom: 24 }}>
					{steps.map((label) => (
						<Step key={label} title={label} />
					))}
				</Steps>
				{loading ? (
					<Spin
						size="large"
						style={{
							display: "flex",
							justifyContent: "center",
							padding: "48px 0",
						}}
					/>
				) : (
					<>
						{getStepContent(currentStep)}

						{currentStep !== steps.length && (
							<Space
								style={{
									display: "flex",
									justifyContent: "space-between",
									marginTop: 24,
								}}
							>
								<Button
									disabled={currentStep === 0}
									onClick={handleBack}
									icon={<LeftOutlined />}
								>
									Back
								</Button>

								{currentStep === steps.length - 1 ? (
									<Button
										type="primary"
										onClick={handleSubmit}
										disabled={!isStepValid() || loading}
									>
										{loading ? "Scheduling..." : "Schedule Appointment"}
									</Button>
								) : (
									<Button
										type="primary"
										onClick={handleNext}
										disabled={!isStepValid()}
										icon={<RightOutlined />}
									>
										Next
									</Button>
								)}
							</Space>
						)}
					</>
				)}
			</Card>
		</Layout.Content>
	);
};

export default NewAppointment;

const getWorkingHoursForDate = (doctor, date) => {
	if (!doctor?.workHours || !date) return null;
	const dayOfWeek = date.day();
	return doctor.workHours.find((wh) => wh.day === dayOfWeek) || null;
};

const getDisabledTimeConfig = (doctor, date) => {
	const wh = getWorkingHoursForDate(doctor, date);
	if (!wh) return {};

	const [msH, msM] = wh.morningStart.split(":").map(Number);
	const [meH, meM] = wh.morningEnd.split(":").map(Number);
	const [asH, asM] = wh.afternoonStart.split(":").map(Number);
	const [aeH, aeM] = wh.afternoonEnd.split(":").map(Number);

	let allowedHours = [];
	for (let h = msH; h < meH; h++) allowedHours.push(h);
	for (let h = asH; h < aeH; h++) allowedHours.push(h);

	allowedHours = [...new Set(allowedHours)];

	const disabledHours = () =>
		Array.from({ length: 24 }, (_, i) => i).filter(
			(h) => !allowedHours.includes(h)
		);

	const disabledMinutes = (selectedHour) => {
		let minutes = [];
		if (selectedHour === msH) {
			for (let m = 0; m < msM; m += 1) minutes.push(m);
		}
		if (selectedHour === meH - 1) {
			for (let m = meM; m < 60; m += 1) minutes.push(m);
		}
		if (selectedHour === asH) {
			for (let m = 0; m < asM; m += 1) minutes.push(m);
		}
		if (selectedHour === aeH - 1) {
			for (let m = aeM; m < 60; m += 1) minutes.push(m);
		}
		return minutes;
	};

	return { disabledHours, disabledMinutes };
};
