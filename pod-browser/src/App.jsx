import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { SessionProvider } from "@inrupt/solid-ui-react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import MedicalRecords from "./pages/MedicalRecords";

const theme = extendTheme({
	config: {
		initialColorMode: "light",
		useSystemColorMode: false,
	},
	colors: {
		medical: {
			50: "#f0f9ff",
			100: "#e0f2fe",
			200: "#bae6fd",
			300: "#7dd3fc",
			400: "#38bdf8",
			500: "#0ea5e9",
			600: "#0284c7",
			700: "#0369a1",
			800: "#075985",
			900: "#0c4a6e",
		},
		success: {
			50: "#f0fdf4",
			100: "#dcfce7",
			200: "#bbf7d0",
			300: "#86efac",
			400: "#4ade80",
			500: "#22c55e",
			600: "#16a34a",
			700: "#15803d",
			800: "#166534",
			900: "#14532d",
		},
	},
	components: {
		Button: {
			defaultProps: {
				colorScheme: "medical",
			},
		},
	},
});

function App() {
	return (
		<ChakraProvider theme={theme}>
			<SessionProvider>
				<Router>
					<Layout>
						<Routes>
							<Route path="/" element={<HomePage />} />
							<Route path="/login" element={<Login />} />
							<Route path="/medical-records" element={<MedicalRecords />} />
						</Routes>
					</Layout>
				</Router>
			</SessionProvider>
		</ChakraProvider>
	);
}

export default App;
