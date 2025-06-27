import { Spin } from "antd";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const MyInfo = () => {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100%",
				}}
			>
				<Spin size="large" />
			</div>
		);
	}

	if (user?.patientId) {
		return <Navigate to={`/patients/${user.patientId}`} replace />;
	}

	return <Navigate to="/" replace />;
};

export default MyInfo;
