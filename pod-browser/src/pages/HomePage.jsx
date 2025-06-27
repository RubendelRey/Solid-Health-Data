import {
	Alert,
	AlertIcon,
	Badge,
	Box,
	Button,
	Card,
	CardBody,
	CardHeader,
	Heading,
	HStack,
	Progress,
	SimpleGrid,
	Stat,
	StatHelpText,
	StatLabel,
	StatNumber,
	Text,
	useColorModeValue,
	VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { getFhirResourceIcon } from "../utils/fhirUtils";

const HomePage = () => {
	const navigate = useNavigate();
	const cardBg = useColorModeValue("white", "gray.700");
	const borderColor = useColorModeValue("gray.200", "gray.600");

	const isLoggedIn = false;	const isLoading = false;
	const userProfile = null;	const medicalRecords = [];
	const recordStats = {
		total: 12,
		observations: 5,
		conditions: 3,
		procedures: 2,
		medications: 2,
		recent: 4,
	};
	if (!isLoggedIn) {
		return (
			<Box w="100%" maxW="1200px" mx="auto">
				<VStack spacing={8}>
					<Box textAlign="center">
						<Heading size="2xl" mb={4}>
							Welcome to SOLID Medical Viewer 🏥
						</Heading>
						<Text fontSize="xl" color="gray.600" mb={6}>
							Securely access and navigate your medical records stored in SOLID
							pods
						</Text>
					</Box>

					<SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
						<Card bg={cardBg} textAlign="center">
							<CardBody>
								<Text fontSize="3xl" mb={2}>
									🔒
								</Text>
								<Text fontWeight="bold" mb={2}>
									Private & Secure
								</Text>
								<Text fontSize="sm" color="gray.600">
									Your medical data stays in your SOLID pod under your control
								</Text>
							</CardBody>
						</Card>

						<Card bg={cardBg} textAlign="center">
							<CardBody>
								<Text fontSize="3xl" mb={2}>
									🩺
								</Text>
								<Text fontWeight="bold" mb={2}>
									FHIR Compatible
								</Text>
								<Text fontSize="sm" color="gray.600">
									Works with standard FHIR medical record formats
								</Text>
							</CardBody>
						</Card>

						<Card bg={cardBg} textAlign="center">
							<CardBody>
								<Text fontSize="3xl" mb={2}>
									🌐
								</Text>
								<Text fontWeight="bold" mb={2}>
									Decentralized
								</Text>
								<Text fontSize="sm" color="gray.600">
									No central server - your data stays distributed
								</Text>
							</CardBody>
						</Card>
					</SimpleGrid>

					<Button
						size="lg"
						colorScheme="medical"
						onClick={() => navigate("/login")}
					>
						Connect to Your SOLID Pod
					</Button>
				</VStack>
			</Box>
		);
	}
	return (
		<Box w="100%" maxW="1200px" mx="auto">
			<VStack spacing={8} align="stretch">
				<Box>
					<Heading size="xl" mb={2}>
						Welcome back, {userProfile?.name || "User"}! 👋
					</Heading>
					<Text color="gray.600">
						Here's an overview of your medical records from your SOLID pod
					</Text>
				</Box>

				{isLoading && (
					<Card bg={cardBg}>
						<CardBody>
							<VStack spacing={4}>
								<Progress
									size="sm"
									isIndeterminate
									colorScheme="medical"
									w="full"
								/>
								<Text>Loading your medical records from SOLID pod...</Text>
							</VStack>
						</CardBody>
					</Card>
				)}

				{!isLoading && (
					<SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
						<Card bg={cardBg}>
							<CardBody>
								<Stat>
									<StatLabel>Total Records</StatLabel>
									<StatNumber color="medical.600">
										{recordStats.total}
									</StatNumber>
									<StatHelpText>
										{recordStats.recent} added recently
									</StatHelpText>
								</Stat>
							</CardBody>
						</Card>

						<Card bg={cardBg}>
							<CardBody>
								<Stat>
									<StatLabel>📊 Observations</StatLabel>
									<StatNumber color="blue.600">
										{recordStats.observations}
									</StatNumber>
									<StatHelpText>Test results & measurements</StatHelpText>
								</Stat>
							</CardBody>
						</Card>

						<Card bg={cardBg}>
							<CardBody>
								<Stat>
									<StatLabel>🩺 Conditions</StatLabel>
									<StatNumber color="red.600">
										{recordStats.conditions}
									</StatNumber>
									<StatHelpText>Diagnoses & health conditions</StatHelpText>
								</Stat>
							</CardBody>
						</Card>

						<Card bg={cardBg}>
							<CardBody>
								<Stat>
									<StatLabel>⚕️ Procedures</StatLabel>
									<StatNumber color="green.600">
										{recordStats.procedures}
									</StatNumber>
									<StatHelpText>Medical procedures</StatHelpText>
								</Stat>
							</CardBody>
						</Card>
					</SimpleGrid>
				)}

				<Card bg={cardBg}>
					<CardHeader>
						<Heading size="md">Quick Actions</Heading>
					</CardHeader>
					<CardBody>
						<SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
							<Button
								leftIcon={<Text>📋</Text>}
								colorScheme="medical"
								onClick={() => navigate("/medical-records")}
							>
								View All Records
							</Button>
							<Button
								leftIcon={<Text>🔄</Text>}
								variant="outline"
								onClick={() => {}}
								isLoading={isLoading}
							>
								Refresh Records
							</Button>
							<Button
								leftIcon={<Text>➕</Text>}
								variant="outline"
								onClick={() => navigate("/medical-records")}
							>
								Add New Record
							</Button>
						</SimpleGrid>
					</CardBody>
				</Card>

				<Card bg={cardBg}>
					<CardHeader>
						<HStack justify="space-between">
							<Heading size="md">Recent Medical Records</Heading>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => navigate("/medical-records")}
							>
								View All
							</Button>
						</HStack>
					</CardHeader>
					<CardBody>
						{medicalRecords.length > 0 ? (
							<VStack spacing={3} align="stretch">
								{medicalRecords.slice(0, 3).map((record, index) => (
									<Box
										key={record.id || index}
										p={3}
										borderWidth="1px"
										borderRadius="md"
										borderColor={borderColor}
									>
										<HStack>
											<Text fontSize="lg">{getFhirResourceIcon(record)}</Text>
											<Box flex="1">
												<Text fontWeight="medium" noOfLines={1}>
													{record.code?.text ||
														record.medicationCodeableConcept?.text ||
														record.title ||
														"Medical Record"}
												</Text>
												<Text fontSize="sm" color="gray.600">
													{record.effectiveDateTime
														? new Date(
																record.effectiveDateTime
														  ).toLocaleDateString()
														: "No date"}
												</Text>
											</Box>
											<Badge colorScheme="medical" variant="subtle">
												{record.resourceType}
											</Badge>
										</HStack>
									</Box>
								))}
							</VStack>
						) : (
							<Alert status="info">
								<AlertIcon />
								<Box>
									<Text fontWeight="bold">No medical records found</Text>
									<Text fontSize="sm">
										Connect to your SOLID pod to load your medical records.
									</Text>
								</Box>
							</Alert>
						)}
					</CardBody>
				</Card>

				{userProfile && (
					<Card bg={cardBg}>
						<CardHeader>
							<Heading size="md">SOLID Pod Information</Heading>
						</CardHeader>
						<CardBody>
							<VStack align="stretch" spacing={3}>
								<HStack>
									<Text fontWeight="medium" minW="100px">
										WebID:
									</Text>
									<Text
										fontSize="sm"
										fontFamily="mono"
										color="gray.600"
										wordBreak="break-all"
									>
										{userProfile.webId}
									</Text>
								</HStack>
								{userProfile.email && (
									<HStack>
										<Text fontWeight="medium" minW="100px">
											Email:
										</Text>
										<Text>{userProfile.email}</Text>
									</HStack>
								)}
								{userProfile.organization && (
									<HStack>
										<Text fontWeight="medium" minW="100px">
											Organization:
										</Text>
										<Text>{userProfile.organization}</Text>
									</HStack>
								)}
							</VStack>
						</CardBody>
					</Card>
				)}
			</VStack>
		</Box>
	);
};

export default HomePage;
