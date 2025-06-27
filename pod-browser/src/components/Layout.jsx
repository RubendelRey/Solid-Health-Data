import {
	Box,
	Button,
	Flex,
	Heading,
	HStack,
	Icon,
	useColorModeValue,
} from "@chakra-ui/react";
import { useSession } from "@inrupt/solid-ui-react";
import { FiFileText, FiHome, FiLogIn, FiLogOut } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";

const Layout = ({ children }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { session } = useSession();
	const bgColor = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "gray.700");

	const isActive = (path) => location.pathname === path;

		const handleLogout = async () => {
		try {
			await session.logout();
			navigate("/");
		} catch (error) {
			console.error("Error logging out:", error);
		}
	};

		const getNavItems = () => {
		const commonItems = [{ path: "/", label: "Home", icon: FiHome }];

		if (session?.info?.isLoggedIn) {
			return [
				...commonItems,
				{
					path: "/medical-records",
					label: "Medical Records",
					icon: FiFileText,
				},
			];
		} else {
			return [
				...commonItems,
				{ path: "/login", label: "Login", icon: FiLogIn },
			];
		}
	};

	const navItems = getNavItems();
	return (
		<Flex
			direction="column"
			minH="100vh"
			w="100%"
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
				w="100%"
			>
				<Box maxW="100%" px={{ base: 4, md: 8 }}>
					<Flex h="16" alignItems="center" justifyContent="space-between">
						<Heading
							size="md"
							color="medical.600"
							cursor="pointer"
							onClick={() => navigate("/")}
						>
							<Icon as={FiFileText} mr={2} />
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

														{session?.info?.isLoggedIn && (
								<Button
									variant="ghost"
									colorScheme="red"
									size="sm"
									leftIcon={<Icon as={FiLogOut} />}
									onClick={handleLogout}
								>
									Logout
								</Button>
							)}
						</HStack>
					</Flex>
				</Box>
			</Box>

						<Flex flex="1" w="100%">
				<Box w="100%" px={{ base: 4, md: 8 }} py={6}>
					{children}
				</Box>
			</Flex>

						<Box
				bg={bgColor}
				borderTop="1px"
				borderColor={borderColor}
				py={4}
				mt="auto"
				w="100%"
			>
				<Box maxW="100%" px={{ base: 4, md: 8 }}>
					<Flex justify="center" align="center">
						<Box textAlign="center" color="gray.600" fontSize="sm">
							© 2025 SOLID Medical Records Viewer
						</Box>
					</Flex>
				</Box>
			</Box>
		</Flex>
	);
};

export default Layout;
