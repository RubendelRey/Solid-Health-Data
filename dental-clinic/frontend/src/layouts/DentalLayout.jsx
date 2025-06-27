import {
	BarChartOutlined,
	CalendarOutlined,
	CloudDownloadOutlined,
	CloudUploadOutlined,
	DatabaseOutlined,
	ExclamationCircleOutlined,
	HomeOutlined,
	LogoutOutlined,
	MedicineBoxOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	TeamOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Layout, Menu, Space, Typography } from "antd";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

const DentalLayout = ({ children }) => {
	const [collapsed, setCollapsed] = useState(false);
	const { user, logout, isAdmin, isDoctor, isPatient } = useAuth();
	const location = useLocation();
	const navigate = useNavigate();

	const customColors = {
		primary: "#1890ff",
		secondary: "#52c41a",
		accent: "#13c2c2",
		background: "#f0f2f5",
		header: "#ffffff",
		menuActive: "#e6f7ff",
		text: "#000000d9",
		footerBg: "#f7f7f7",
	};

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	const getMenuItems = () => {
		const items = [
			{
				key: "/",
				icon: <HomeOutlined />,
				label: <Link to="/">Home</Link>,
			},
		];
		if (isAdmin) {
			items.push(
				{
					key: "/patients",
					icon: <TeamOutlined />,
					label: <Link to="/patients">Patients</Link>,
				},
				{
					key: "/doctors",
					icon: <UserOutlined />,
					label: <Link to="/doctors">Doctors</Link>,
				},
				{
					key: "/interventions",
					icon: <MedicineBoxOutlined />,
					label: <Link to="/interventions">Interventions</Link>,
				},
				{
					key: "/admin/intervention-types",
					icon: <MedicineBoxOutlined />,
					label: <Link to="/admin/intervention-types">Intervention Types</Link>,
				},
				{
					key: "/admin/allergies",
					icon: <MedicineBoxOutlined />,
					label: <Link to="/admin/allergies">Allergies Catalog</Link>,
				},
				{
					key: "/admin/users",
					icon: <UserOutlined />,
					label: <Link to="/admin/users">Users</Link>,
				},
				{
					key: "/admin/bulk-export",
					icon: <CloudDownloadOutlined />,
					label: <Link to="/admin/bulk-export">Bulk Export</Link>,
				},
				{
					key: "/admin/load-test-results",
					icon: <BarChartOutlined />,
					label: <Link to="/admin/load-test-results">Load Test Results</Link>,
				}
			);
		}
		if (isDoctor) {
			items.push(
				{
					key: "/doctor/patients",
					icon: <TeamOutlined />,
					label: <Link to="/doctor/patients">My Patients</Link>,
				},
				{
					key: "/doctor/interventions",
					icon: <MedicineBoxOutlined />,
					label: <Link to="/doctor/interventions">Interventions</Link>,
				},
				{
					key: "/doctor/appointments",
					icon: <CalendarOutlined />,
					label: <Link to="/doctor/appointments">Appointments</Link>,
				}
			);
		}
		if (isPatient) {
			items.push(
				{
					key: "/my-info",
					icon: <UserOutlined />,
					label: <Link to="/my-info">My Information</Link>,
				},
				{
					key: "/doctors",
					icon: <TeamOutlined />,
					label: <Link to="/doctors">Our Doctors</Link>,
				},
				{
					key: "/my-allergies",
					icon: <ExclamationCircleOutlined />,
					label: <Link to="/my-allergies">My Allergies</Link>,
				},
				{
					key: "/my-interventions",
					icon: <MedicineBoxOutlined />,
					label: <Link to="/my-interventions">My Treatments</Link>,
				},
				{
					key: "/my-appointments",
					icon: <CalendarOutlined />,
					label: <Link to="/my-appointments">My Appointments</Link>,
				},
				{
					key: "/data-export",
					icon: <CloudUploadOutlined />,
					label: <Link to="/data-export">Export Data</Link>,
				},
				{
					key: "/data-import",
					icon: <CloudDownloadOutlined />,
					label: <Link to="/data-import">Import Data</Link>,
				}
			);
		}

		return items;
	};
	const userMenuItems = {
		items: [
			{
				key: "logout",
				icon: <LogoutOutlined />,
				label: "Logout",
				onClick: handleLogout,
			},
		],
	};

	return (
		<Layout style={{ minHeight: "100vh", width: "100%" }}>
			<Sider
				trigger={null}
				collapsible
				collapsed={collapsed}
				theme="light"
				style={{
					boxShadow: "2px 0 8px 0 rgba(29,35,41,.05)",
					borderRight: "1px solid #f0f0f0",
				}}
			>
				<div style={{ padding: "16px", textAlign: "center" }}>
					<div style={{ margin: "16px 0" }}>
						<img
							src="/public/logo.svg"
							alt="Dental Clinic Logo"
							style={{
								height: collapsed ? "40px" : "64px",
								transition: "height 0.3s",
							}}
						/>
					</div>
					{!collapsed && (
						<Title
							level={4}
							style={{ color: customColors.primary, margin: "12px 0" }}
						>
							DentalCare Clinic
						</Title>
					)}
				</div>
				<Menu
					theme="light"
					mode="inline"
					selectedKeys={[location.pathname]}
					items={getMenuItems()}
					style={{ borderRight: 0 }}
				/>
			</Sider>
			<Layout style={{ width: "100%" }}>
				<Header
					style={{
						padding: "0 24px",
						background: customColors.header,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						boxShadow: "0 1px 4px rgba(0, 21, 41, 0.08)",
						width: "100%",
					}}
				>
					<div>
						{React.createElement(
							collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
							{
								className: "trigger",
								onClick: () => setCollapsed(!collapsed),
								style: { fontSize: "18px", cursor: "pointer" },
							}
						)}
					</div>{" "}
					<Space>
						<Dropdown menu={userMenuItems} trigger={["click"]}>
							<a onClick={(e) => e.preventDefault()}>
								<Space align="center">
									<Avatar
										style={{ backgroundColor: customColors.primary }}
										icon={<UserOutlined />}
									/>
									{!collapsed && <Text strong>{user?.name || "User"}</Text>}
								</Space>
							</a>
						</Dropdown>
					</Space>
				</Header>
				<Content
					style={{
						margin: "24px 16px",
						padding: 24,
						minHeight: 280,
						background: "#fff",
						borderRadius: "8px",
						boxShadow:
							"0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)",
						width: "auto",
					}}
				>
					{children}
				</Content>
				<Footer
					style={{
						textAlign: "center",
						background: customColors.footerBg,
						padding: "12px 50px",
						width: "100%",
					}}
				>
					Dental Clinic ©{new Date().getFullYear()} - Your smile is our priority
				</Footer>
			</Layout>
		</Layout>
	);
};

export default DentalLayout;
