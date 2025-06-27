import { CheckCircleOutlined, CloudUploadOutlined } from "@ant-design/icons";
import { Button, Result, Spin } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SolidLoginSuccess = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const timer = setTimeout(() => {
			navigate("/data-export");
		}, 3000);

		return () => clearTimeout(timer);
	}, [navigate]);

	return (
		<div
			style={{
				height: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
			}}
		>
			<Result
				icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
				title="Solid Authentication Successful!"
				subTitle="You have successfully connected to your Solid pod. Redirecting to data export..."
				extra={[
					<Button
						type="primary"
						key="continue"
						icon={<CloudUploadOutlined />}
						onClick={() => navigate("/data-export")}
						size="large"
					>
						Continue to Data Export
					</Button>,
				]}
				style={{
					background: "white",
					borderRadius: "12px",
					boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
					padding: "40px",
					maxWidth: "500px",
				}}
			/>

			<div
				style={{
					position: "absolute",
					bottom: "40px",
					display: "flex",
					alignItems: "center",
					color: "white",
					fontSize: "14px",
				}}
			>
				<Spin size="small" style={{ marginRight: "8px" }} />
				Redirecting in 3 seconds...
			</div>
		</div>
	);
};

export default SolidLoginSuccess;
