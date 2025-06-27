import {
	EditOutlined,
	HomeOutlined,
	LeftOutlined,
	RightOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Col,
	Form,
	Layout,
	Modal,
	Row,
	Select,
	Space,
	Spin,
	Table,
	Tabs,
	TimePicker,
	Typography,
} from "antd";
import {
	addDays,
	eachDayOfInterval,
	endOfWeek,
	format,
	isToday,
	parseISO,
	startOfWeek,
} from "date-fns";
import { enUS } from "date-fns/locale";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";

import doctorService from "../../api/doctorService";
import AuthContext from "../../contexts/AuthContext";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const DAYS_OF_WEEK = [
	{ value: 0, label: "Sunday" },
	{ value: 1, label: "Monday" },
	{ value: 2, label: "Tuesday" },
	{ value: 3, label: "Wednesday" },
	{ value: 4, label: "Thursday" },
	{ value: 5, label: "Friday" },
	{ value: 6, label: "Saturday" },
];

const DoctorSchedule = () => {
	const { currentUser } = useContext(AuthContext);
	const [activeTabKey, setActiveTabKey] = useState("0");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [weekStart, setWeekStart] = useState(
		startOfWeek(new Date(), { weekStartsOn: 1 })
	);
	const [appointments, setAppointments] = useState([]);
	const [doctorInfo, setDoctorInfo] = useState(null);
	const [workHours, setWorkHours] = useState([]);
	const [editingWorkHours, setEditingWorkHours] = useState(false);

	const [workHoursModal, setWorkHoursModal] = useState({
		open: false,
		dayIndex: null,
		currentHours: null,
	});

	useEffect(() => {
		const fetchDoctorData = async () => {
			if (!currentUser) return;

			try {
				setLoading(true);
				setError(null);

				let doctorData;
				try {
					doctorData = await doctorService.getDoctorByUserId(currentUser._id);
				} catch (err) {
					if (
						err.message?.includes("Doctor not found") &&
						currentUser.role === "doctor"
					) {
						doctorData = await doctorService.createDoctor({
							userId: currentUser._id,
							specialties: ["General Dentistry"],
						});
					} else {
						throw err;
					}
				}

				setDoctorInfo(doctorData);

				if (doctorData?.workHours) {
					setWorkHours(doctorData.workHours);
				}

				const weekEnd = endOfWeek(weekStart);
				const { appointments } = await doctorService.getDoctorAppointments(
					doctorData._id,
					format(weekStart, "yyyy-MM-dd"),
					format(weekEnd, "yyyy-MM-dd")
				);

				setAppointments(appointments || []);
			} catch (err) {
				console.error("Error fetching doctor data:", err);
				setError("Failed to load doctor schedule. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		fetchDoctorData();
	}, [currentUser, weekStart]);

	const handleTabChange = (key) => {
		setActiveTabKey(key);
	};

	const handlePreviousWeek = () => {
		setWeekStart((date) => addDays(date, -7));
	};

	const handleNextWeek = () => {
		setWeekStart((date) => addDays(date, 7));
	};

	const handleToday = () => {
		setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
	};

	const handleOpenWorkHoursModal = (dayIndex) => {
		const currentDay = workHours.find((day) => day.day === dayIndex);

		setWorkHoursModal({
			open: true,
			dayIndex,
			currentHours: currentDay || {
				day: dayIndex,
				morningStart: "09:00",
				morningEnd: "13:00",
				afternoonStart: "16:00",
				afternoonEnd: "20:00",
			},
		});
	};

	const handleSaveWorkHours = async () => {
		if (!workHoursModal.currentHours || !doctorInfo?._id) return;

		try {
			setLoading(true);

			let updatedWorkHours = [...workHours];
			const existingIndex = updatedWorkHours.findIndex(
				(h) => h.day === workHoursModal.dayIndex
			);

			if (existingIndex >= 0) {
				updatedWorkHours[existingIndex] = {
					...updatedWorkHours[existingIndex],
					...workHoursModal.currentHours,
				};
			} else {
				updatedWorkHours.push(workHoursModal.currentHours);
			}

			await doctorService.updateDoctorWorkHours(
				doctorInfo._id,
				updatedWorkHours
			);

			setWorkHours(updatedWorkHours);

			setWorkHoursModal({
				open: false,
				dayIndex: null,
				currentHours: null,
			});
		} catch (err) {
			console.error("Error updating work hours:", err);
			setError("Failed to update work hours. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleWorkHoursChange = (field, value) => {
		setWorkHoursModal((prev) => ({
			...prev,
			currentHours: {
				...prev.currentHours,
				[field]: value,
			},
		}));
	};

	const getDaysOfWeek = () => {
		const weekEnd = endOfWeek(weekStart);
		return eachDayOfInterval({ start: weekStart, end: weekEnd });
	};

	const formatAppointmentTime = (dateString) => {
		if (!dateString) return "";
		return format(parseISO(dateString), "HH:mm");
	};

	const getAppointmentsForDay = (date) => {
		return appointments.filter(
			(app) =>
				format(parseISO(app.appointmentDate), "yyyy-MM-dd") ===
				format(date, "yyyy-MM-dd")
		);
	};
	const renderWeekNavigation = () => {
		const startDateStr = format(weekStart, "MMM d", { locale: enUS });
		const endDateStr = format(endOfWeek(weekStart), "MMM d, yyyy", {
			locale: enUS,
		});

		return (
			<Space>
				<Button icon={<LeftOutlined />} onClick={handlePreviousWeek}>
					Previous
				</Button>
				<Button icon={<HomeOutlined />} onClick={handleToday}>
					Today
				</Button>
				<Button icon={<RightOutlined />} onClick={handleNextWeek}>
					Next
				</Button>
				<Text strong>
					{startDateStr} - {endDateStr}
				</Text>
			</Space>
		);
	};

	const renderScheduleTable = () => {
		const daysOfWeek = getDaysOfWeek();

		const columns = [
			{
				title: "Time",
				dataIndex: "time",
				key: "time",
				width: 100,
			},
			...daysOfWeek.map((day) => ({
				title: (
					<div>
						<div>{format(day, "EEEE", { locale: enUS })}</div>
						<div
							style={{
								fontWeight: isToday(day) ? "bold" : "normal",
								color: isToday(day) ? "#1890ff" : "inherit",
							}}
						>
							{format(day, "MMM d", { locale: enUS })}
						</div>
					</div>
				),
				dataIndex: format(day, "yyyy-MM-dd"),
				key: format(day, "yyyy-MM-dd"),
				render: (text, record) => {
					const dayAppointments = getAppointmentsForDay(day);
					const timeSlotAppointments = dayAppointments.filter((app) => {
						const appTime = formatAppointmentTime(app.appointmentDate);
						return appTime >= record.timeStart && appTime < record.timeEnd;
					});

					return (
						<div>
							{timeSlotAppointments.length > 0 ? (
								timeSlotAppointments.map((app) => (
									<Card
										key={app._id}
										size="small"
										style={{
											marginBottom: 8,
											backgroundColor: "#e6f7ff",
											borderLeft: "3px solid #1890ff",
										}}
									>
										<div>
											<div>
												<strong>
													{formatAppointmentTime(app.appointmentDate)}
												</strong>
											</div>
											<div>
												{app.patient?.firstName} {app.patient?.lastName}
											</div>
											<div>{app.interventionType?.name}</div>
										</div>
									</Card>
								))
							) : (
								<div style={{ height: 40 }}></div>
							)}
						</div>
					);
				},
			})),
		];

		const timeSlots = [];
		for (let hour = 8; hour < 20; hour++) {
			timeSlots.push({
				key: `${hour}:00`,
				time: `${hour}:00`,
				timeStart: `${hour}:00`,
				timeEnd: `${hour + 1}:00`,
			});
		}

		return (
			<Table
				columns={columns}
				dataSource={timeSlots}
				pagination={false}
				size="small"
			/>
		);
	};

	const renderWorkHoursTable = () => {
		const columns = [
			{
				title: "Day",
				dataIndex: "day",
				key: "day",
				render: (dayIndex) =>
					DAYS_OF_WEEK.find((d) => d.value === dayIndex)?.label || "Unknown",
			},
			{
				title: "Morning Hours",
				dataIndex: "morning",
				key: "morning",
				render: (_, record) => (
					<span>
						{record.morningStart} - {record.morningEnd}
					</span>
				),
			},
			{
				title: "Afternoon Hours",
				dataIndex: "afternoon",
				key: "afternoon",
				render: (_, record) => (
					<span>
						{record.afternoonStart} - {record.afternoonEnd}
					</span>
				),
			},
			{
				title: "Actions",
				key: "actions",
				render: (_, record) => (
					<Button
						icon={<EditOutlined />}
						onClick={() => handleOpenWorkHoursModal(record.day)}
					>
						Edit
					</Button>
				),
			},
		];

		return (
			<div>
				<div
					style={{
						marginBottom: 16,
						display: "flex",
						justifyContent: "flex-end",
					}}
				>
					{DAYS_OF_WEEK.filter(
						(day) => !workHours.find((h) => h.day === day.value)
					).length > 0 && (
						<Select
							placeholder="Add Working Hours For Day"
							style={{ width: 200, marginRight: 8 }}
							onChange={handleOpenWorkHoursModal}
						>
							{DAYS_OF_WEEK.filter(
								(day) => !workHours.find((h) => h.day === day.value)
							).map((day) => (
								<Option key={day.value} value={day.value}>
									{day.label}
								</Option>
							))}
						</Select>
					)}
				</div>

				<Table
					columns={columns}
					dataSource={workHours}
					rowKey="day"
					pagination={false}
				/>
			</div>
		);
	};

	return (
		<Layout.Content style={{ padding: 24 }}>
			<Title level={2}>Doctor Schedule</Title>

			{error && (
				<Alert
					message="Error"
					description={error}
					type="error"
					showIcon
					style={{ marginBottom: 24 }}
				/>
			)}

			{loading && !error && (
				<div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
					<Spin size="large" />
				</div>
			)}

			{!loading && doctorInfo && (
				<>
					<Card style={{ marginBottom: 24 }}>
						<Tabs activeKey={activeTabKey} onChange={handleTabChange}>
							<TabPane tab="Weekly Schedule" key="0">
								<div style={{ marginBottom: 16 }}>{renderWeekNavigation()}</div>

								{renderScheduleTable()}
							</TabPane>

							<TabPane tab="Working Hours" key="1">
								{renderWorkHoursTable()}
							</TabPane>
						</Tabs>
					</Card>

					<Modal
						title={`Edit Working Hours for ${
							DAYS_OF_WEEK.find((d) => d.value === workHoursModal.dayIndex)
								?.label
						}`}
						open={workHoursModal.open}
						onCancel={() =>
							setWorkHoursModal({
								open: false,
								dayIndex: null,
								currentHours: null,
							})
						}
						onOk={handleSaveWorkHours}
						confirmLoading={loading}
						okText="Save"
						cancelText="Cancel"
					>
						<Form layout="vertical">
							<Form.Item label="Morning Hours">
								<Row gutter={16}>
									<Col span={12}>
										<TimePicker
											format="HH:mm"
											value={
												workHoursModal.currentHours?.morningStart
													? dayjs(
															workHoursModal.currentHours.morningStart,
															"HH:mm"
													  )
													: dayjs("09:00", "HH:mm")
											}
											onChange={(time) =>
												handleWorkHoursChange(
													"morningStart",
													time ? time.format("HH:mm") : "09:00"
												)
											}
											style={{ width: "100%" }}
										/>
									</Col>
									<Col span={12}>
										<TimePicker
											format="HH:mm"
											value={
												workHoursModal.currentHours?.morningEnd
													? dayjs(
															workHoursModal.currentHours.morningEnd,
															"HH:mm"
													  )
													: dayjs("13:00", "HH:mm")
											}
											onChange={(time) =>
												handleWorkHoursChange(
													"morningEnd",
													time ? time.format("HH:mm") : "13:00"
												)
											}
											style={{ width: "100%" }}
										/>
									</Col>
								</Row>
							</Form.Item>

							<Form.Item label="Afternoon Hours">
								<Row gutter={16}>
									<Col span={12}>
										<TimePicker
											format="HH:mm"
											value={
												workHoursModal.currentHours?.afternoonStart
													? dayjs(
															workHoursModal.currentHours.afternoonStart,
															"HH:mm"
													  )
													: dayjs("16:00", "HH:mm")
											}
											onChange={(time) =>
												handleWorkHoursChange(
													"afternoonStart",
													time ? time.format("HH:mm") : "16:00"
												)
											}
											style={{ width: "100%" }}
										/>
									</Col>
									<Col span={12}>
										<TimePicker
											format="HH:mm"
											value={
												workHoursModal.currentHours?.afternoonEnd
													? dayjs(
															workHoursModal.currentHours.afternoonEnd,
															"HH:mm"
													  )
													: dayjs("20:00", "HH:mm")
											}
											onChange={(time) =>
												handleWorkHoursChange(
													"afternoonEnd",
													time ? time.format("HH:mm") : "20:00"
												)
											}
											style={{ width: "100%" }}
										/>
									</Col>
								</Row>
							</Form.Item>
						</Form>
					</Modal>
				</>
			)}
		</Layout.Content>
	);
};

export default DoctorSchedule;
