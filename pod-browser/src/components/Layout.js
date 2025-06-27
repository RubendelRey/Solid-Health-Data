import {
	Box,
	Button,
	Container,
	Flex,
	Heading,
	HStack,
	Icon,
	useColorModeValue,
} from "@chakra-ui/react";
import { FiFileText, FiHome, FiLogIn, FiUser } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";

const Layout = ({ children }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const bgColor = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "gray.700");

	const isActive = (path) => location.pathname === path;

	const navItems = [
		{ path: "/", label: "Home", icon: FiHome },
		{ path: "/medical-records", label: "Medical Records", icon: FiFileText },
		{ path: "/login", label: "Login", icon: FiLogIn },
	];

	return (
		<Flex
			direction="column"
			minH="100vh"
			bg={useColorModeValue("gray.50", "gray.900")}
		>
						<Box
				bg={bgColor}
				borderBottom="1px"
				borderColor={borderColor}
				shadow="sm"
				position="sticky"
				top="0"
				zIndex="1000"
			>
				<Container maxW="container.xl">
					<Flex h="16" alignItems="center" justifyContent="space-between">
						<Heading
							size="md"
							color="medical.600"
							cursor="pointer"
							onClick={() => navigate("/")}
						>
							<Icon as={FiUser} mr={2} />
							SOLID Medical Records
						</Heading>

						<HStack spacing={4}>
							{navItems.map((item) => (
								<Button
									key={item.path}
									variant={isActive(item.path) ? "solid" : "ghost"}
									colorScheme={isActive(item.path) ? "medical" : "gray"}
									size="sm"
									leftIcon={<Icon as={item.icon} />}
									onClick={() => navigate(item.path)}
								>
									{item.label}
								</Button>
							))}
						</HStack>
					</Flex>
				</Container>
			</Box>

						<Flex flex="1">
				<Container maxW="container.xl" py={6}>
					{children}
				</Container>
			</Flex>

						<Box
				bg={bgColor}
				borderTop="1px"
				borderColor={borderColor}
				py={4}
				mt="auto"
			>
				<Container maxW="container.xl">
					<Flex justify="center" align="center">
						<Box textAlign="center" color="gray.600" fontSize="sm">
							© 2025 SOLID Medical Records Viewer
						</Box>
					</Flex>
				</Container>
			</Box>
		</Flex>
	);
};

export default Layout;
