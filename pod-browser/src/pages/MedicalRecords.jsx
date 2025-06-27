import {
	Badge,
	Box,
	Button,
	Card,
	CardBody,
	CardHeader,
	Center,
	FormControl,
	FormLabel,
	Heading,
	HStack,
	Icon,
	IconButton,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Select,
	SimpleGrid,
	Spinner,
	Stat,
	StatHelpText,
	StatLabel,
	StatNumber,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Text,
	useColorModeValue,
	useDisclosure,
	useToast,
	VStack,
} from "@chakra-ui/react";
import { useSession } from "@inrupt/solid-ui-react";
import { useCallback, useEffect, useState } from "react";
import {
	FaAllergies,
	FaEnvelope,
	FaHospital,
	FaPhone,
	FaPlus,
	FaStethoscope,
	FaTooth,
	FaUserMd,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAvailableCodingsFor } from "../codings/codings";
import { convertCoding } from "../codings/convert";
import { addCoding, getPatientData } from "../solid/solid";

const MedicalRecords = () => {
	const navigate = useNavigate();
	const { session } = useSession();
	const [activeTab, setActiveTab] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [medicalData, setMedicalData] = useState(null);
	const { isOpen, onOpen, onClose } = useDisclosure();
	const toast = useToast();
	const [dataRoute, setDataRoute] = useState("hospital/data.ttl");
	const [selectedCoding, setSelectedCoding] = useState(null);
	const [newCoding, setNewCoding] = useState({
		system: "",
		code: "",
		display: "",
	});
	const [codingContext, setCodingContext] = useState(null);
	const [customRoute, setCustomRoute] = useState("hospital/data.ttl");

	const cardBg = useColorModeValue("white", "gray.700");
	const modalCodingBg = useColorModeValue("gray.50", "gray.600");

	const DEFAULT_ROUTES = {
		hospital: "hospital/data.ttl",
		dentalClinic: "dental-clinic/data.ttl",
	};

	useEffect(() => {
		fetchPatientData();
	}, []);

	useEffect(() => {
		if (session.info.isLoggedIn) {
			setIsLoading(true);
			fetchPatientData();
		}
	}, [dataRoute, session.info.isLoggedIn]);

	const fetchPatientData = useCallback(async () => {
		if (session.info.isLoggedIn) {
			getPatientData(session, dataRoute)
				.then((data) => {
					setIsLoading(false);
					setMedicalData(data);
				})
				.catch((error) => {
					console.error("Error fetching patient data:", error);
				});
		} else {
			navigate("/login");
		}
	}, [session, navigate, dataRoute]);

	const handleCustomRouteChange = () => {
		if (customRoute.trim() !== "") {
			setDataRoute(customRoute.trim());
			setIsLoading(true);
			toast({
				title: "Dataset route updated",
				description: `Now looking for data at: ${customRoute.trim()}`,
				status: "info",
				duration: 3000,
				isClosable: true,
			});
		}
	};

	const handleHospitalRoute = () => {
		const route = DEFAULT_ROUTES.hospital;
		setDataRoute(route);
		setCustomRoute(route);
		setIsLoading(true);
		toast({
			title: "Hospital dataset selected",
			description: `Now looking for hospital data at: ${route}`,
			status: "info",
			duration: 3000,
			isClosable: true,
		});
	};

	const handleDentalClinicRoute = () => {
		const route = DEFAULT_ROUTES.dentalClinic;
		setDataRoute(route);
		setCustomRoute(route);
		setIsLoading(true);
		toast({
			title: "Dental clinic dataset selected",
			description: `Now looking for dental clinic data at: ${route}`,
			status: "info",
			duration: 3000,
			isClosable: true,
		});
	};

	const renderCodeDisplay = (codings) => {
		if (!codings || !Array.isArray(codings) || codings.length === 0) {
			return "Unknown";
		}

		return codings.map((coding) => coding.display || coding.code).join(", ");
	};

	const CodingsDisplay = ({ codings, title = "Codings", context }) => {
		const codingCardBg = useColorModeValue("gray.50", "gray.600");

		if (!codings || !Array.isArray(codings) || codings.length === 0) {
			return (
				<Box>
					<Text fontWeight="bold">{title}:</Text>
					<Text color="gray.500">No codings available</Text>
				</Box>
			);
		}

		const isMultiple = codings.length > 1;

		return (
			<Box>
				<HStack justify="space-between" align="center" mb={2}>
					<Text fontWeight="bold">{title}:</Text>
					<Button
						size="xs"
						colorScheme="blue"
						variant="outline"
						leftIcon={<Icon as={FaPlus} />}
						onClick={() => handleAddCoding(codings[0], context)}
					>
						Add Equivalent
					</Button>
				</HStack>
				{isMultiple ? (
					<SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
						{codings.map((coding, index) => (
							<Card key={index} size="sm" bg={codingCardBg} position="relative">
								<CardBody p={3}>
									<VStack align="start" spacing={1}>
										<HStack>
											<Text fontSize="sm" fontWeight="bold" color="blue.600">
												System:
											</Text>
											<Text fontSize="sm" fontFamily="mono" isTruncated>
												{coding.system || "Unknown"}
											</Text>
										</HStack>
										<HStack>
											<Text fontSize="sm" fontWeight="bold" color="green.600">
												Code:
											</Text>
											<Badge colorScheme="green" variant="subtle">
												{coding.code || "Unknown"}
											</Badge>
										</HStack>
										<HStack>
											<Text fontSize="sm" fontWeight="bold" color="purple.600">
												Display:
											</Text>
											<Text fontSize="sm" noOfLines={2}>
												{coding.display || "No display name"}
											</Text>
										</HStack>
									</VStack>
									<IconButton
										position="absolute"
										top={1}
										right={1}
										size="xs"
										colorScheme="blue"
										variant="ghost"
										icon={<Icon as={FaPlus} />}
										aria-label="Add equivalent coding"
										onClick={() => handleAddCoding(coding, context)}
									/>
								</CardBody>
							</Card>
						))}
					</SimpleGrid>
				) : (
					<VStack align="stretch" spacing={2}>
						{codings.map((coding, index) => (
							<Card key={index} size="sm" bg={codingCardBg} position="relative">
								<CardBody p={3}>
									<VStack align="start" spacing={1}>
										<HStack>
											<Text fontSize="sm" fontWeight="bold" color="blue.600">
												System:
											</Text>
											<Text fontSize="sm" fontFamily="mono">
												{coding.system || "Unknown"}
											</Text>
										</HStack>
										<HStack>
											<Text fontSize="sm" fontWeight="bold" color="green.600">
												Code:
											</Text>
											<Badge colorScheme="green" variant="subtle">
												{coding.code || "Unknown"}
											</Badge>
										</HStack>
										<HStack>
											<Text fontSize="sm" fontWeight="bold" color="purple.600">
												Display:
											</Text>
											<Text fontSize="sm">
												{coding.display || "No display name"}
											</Text>
										</HStack>
									</VStack>
								</CardBody>
							</Card>
						))}
					</VStack>
				)}
			</Box>
		);
	};

	const PatientCard = ({ patient }) => (
		<Card bg={cardBg} shadow="md">
			<CardHeader>
				<Heading size="md" color="blue.600">
					<Icon as={FaUserMd} mr={2} />
					Patient Information
				</Heading>
			</CardHeader>
			<CardBody>
				<VStack align="start" spacing={4}>
					<Box>
						<Text fontWeight="bold">Name:</Text>
						<Text>{patient.fullName}</Text>
					</Box>
					<Box>
						<Text fontWeight="bold">Birth Date:</Text>
						<Text>{new Date(patient.birthDate).toLocaleDateString()}</Text>
					</Box>
					<Box>
						<Text fontWeight="bold">Gender:</Text>
						<Text textTransform="capitalize">{patient.gender}</Text>
					</Box>

					<Box w="full" pt={2}>
						<Heading size="sm" color="green.600" mb={3}>
							<Icon as={FaPhone} mr={2} />
							Contact Information
						</Heading>
						<VStack align="start" spacing={3}>
							{patient.telecoms?.map((telecom, index) => (
								<HStack key={index} spacing={3}>
									<Icon
										as={telecom.system === "email" ? FaEnvelope : FaPhone}
										color={telecom.system === "email" ? "red.500" : "green.500"}
									/>
									<Box>
										<Text fontWeight="bold" textTransform="capitalize">
											{telecom.system}:
										</Text>
										<Text>{telecom.value}</Text>
									</Box>
								</HStack>
							))}
						</VStack>
					</Box>
				</VStack>
			</CardBody>
		</Card>
	);

	const TelecomCard = ({ telecoms }) => (
		<Card bg={cardBg} shadow="md">
			<CardHeader>
				<Heading size="md" color="green.600">
					<Icon as={FaPhone} mr={2} />
					Contact Information
				</Heading>
			</CardHeader>
			<CardBody>
				<VStack align="start" spacing={3}>
					{telecoms?.map((telecom, index) => (
						<HStack key={index} spacing={3}>
							<Icon
								as={telecom.system === "email" ? FaEnvelope : FaPhone}
								color={telecom.system === "email" ? "red.500" : "green.500"}
							/>
							<Box>
								<Text fontWeight="bold" textTransform="capitalize">
									{telecom.system}:
								</Text>
								<Text>{telecom.value}</Text>
							</Box>
						</HStack>
					))}
				</VStack>
			</CardBody>
		</Card>
	);

	const ProceduresCard = ({ procedures }) => (
		<Card bg={cardBg} shadow="md">
			<CardHeader>
				<Heading size="md" color="purple.600">
					<Icon as={FaStethoscope} mr={2} />
					Medical Procedures
				</Heading>
			</CardHeader>
			<CardBody>
				<VStack align="start" spacing={4}>
					{procedures?.map((procedure, index) => (
						<Box key={index} p={4} borderWidth={1} borderRadius="md">
							<VStack align="start" spacing={3}>
								<Box>
									<Heading size="md" fontWeight="bold">
										{procedure.code?.text ||
											renderCodeDisplay(procedure.code?.codings)}
									</Heading>
								</Box>
								<CodingsDisplay
									codings={procedure.code?.codings}
									title="Procedure Codings"
									context={{
										type: "procedure",
										id: procedure.id || index,
										field: "code",
									}}
								/>
								<Box>
									<Text fontWeight="bold">Date:</Text>
									<Text>
										{new Date(
											procedure.occurrenceDateTime
										).toLocaleDateString()}
									</Text>
								</Box>
								<Box>
									<Text fontWeight="bold">Status:</Text>
									<Badge
										colorScheme={
											procedure.status === "completed"
												? "green"
												: procedure.status === "in-progress"
												? "blue"
												: "yellow"
										}
									>
										{procedure.status}
									</Badge>
								</Box>
								{procedure.bodySite && procedure.bodySite.length > 0 && (
									<Box>
										{procedure.bodySite.some(
											(site) => site.codings && Array.isArray(site.codings)
										) ? (
											<VStack align="start" spacing={3}>
												{procedure.bodySite.map((site, siteIndex) => (
													<CodingsDisplay
														key={siteIndex}
														codings={site.codings}
														title={`Body Site ${siteIndex + 1} ${
															site.text ? `(${site.text})` : ""
														}`}
														context={{
															type: "procedure",
															id: procedure.id || index,
															field: "bodySite",
															subIndex: siteIndex,
														}}
													/>
												))}
											</VStack>
										) : (
											<Box>
												<Text fontWeight="bold">Body Site:</Text>
												<Text>{procedure.bodySite.join(", ")}</Text>
											</Box>
										)}
									</Box>
								)}
							</VStack>
						</Box>
					))}
				</VStack>
			</CardBody>
		</Card>
	);

	const AllergiesCard = ({ allergies }) => (
		<Card bg={cardBg} shadow="md">
			<CardHeader>
				<Heading size="md" color="red.600">
					<Icon as={FaAllergies} mr={2} />
					Allergies & Intolerances
				</Heading>
			</CardHeader>
			<CardBody>
				<VStack align="start" spacing={4}>
					{allergies?.map((allergy, index) => (
						<Box key={index} p={4} borderWidth={1} borderRadius="md">
							<VStack align="start" spacing={3}>
								<Box>
									<Heading size="md" fontWeight="bold">
										{allergy.code?.text ||
											renderCodeDisplay(allergy.code?.codings)}
									</Heading>
								</Box>
								<CodingsDisplay
									codings={allergy.code?.codings}
									title="Allergen Codings"
									context={{
										type: "allergy",
										id: allergy.id || index,
										field: "code",
									}}
								/>
								<Box>
									<Text fontWeight="bold">Recorded Date:</Text>
									<Text>
										{new Date(allergy.recordedDate).toLocaleDateString()}
									</Text>
								</Box>
								<Box>
									<Text fontWeight="bold">Criticality:</Text>
									<Badge
										colorScheme={
											allergy.criticality === "high"
												? "red"
												: allergy.criticality === "low"
												? "yellow"
												: "orange"
										}
									>
										{allergy.criticality}
									</Badge>
								</Box>
								<Box>
									<Text fontWeight="bold">Clinical Status:</Text>
									{allergy.clinicalStatus?.map((status, statusIndex) => (
										<Box key={statusIndex}>
											<Text mb={2}>
												{status.text || renderCodeDisplay(status.codings)}
											</Text>
											<CodingsDisplay
												codings={status.codings}
												title={`Clinical Status Codings ${statusIndex + 1}`}
												context={{
													type: "allergy",
													id: allergy.id || index,
													field: "clinicalStatus",
													subIndex: statusIndex,
												}}
											/>
										</Box>
									))}
								</Box>
							</VStack>
						</Box>
					))}
				</VStack>
			</CardBody>
		</Card>
	);

	const addEquivalentCoding = async (targetCoding, equivalentCoding) => {
		try {
			let newCoding = await convertCoding(targetCoding, equivalentCoding);

			await addCoding(session, dataRoute, targetCoding, newCoding);

			toast({
				title: "Equivalent coding added",
				description:
					"The equivalent coding has been added locally to your medical record view.",
				status: "success",
				duration: 3000,
				isClosable: true,
			});
		} catch (err) {
			console.error("Error adding equivalent coding:", err);
			toast({
				title: "Error adding coding",
				description:
					err.message ||
					"Failed to add the equivalent coding. Please try again.",
				status: "error",
				duration: 5000,
				isClosable: true,
			});
		}
	};

	const handleAddCoding = (coding, context) => {
		setSelectedCoding(coding);
		setCodingContext(context);
		setNewCoding(coding.system || "");
		onOpen();
	};

	const handleSaveCoding = () => {
		addEquivalentCoding(selectedCoding, newCoding);
		onClose();
	};

	if (isLoading) {
		return (
			<Center minH="400px">
				<VStack spacing={4}>
					<Spinner size="xl" color="blue.500" />
					<Text>Loading medical records...</Text>
				</VStack>
			</Center>
		);
	}

	return (
		<Box p={6} maxW="full">
			<VStack spacing={6} align="stretch">
				<Heading size="lg" textAlign="center" color="blue.600">
					Medical Records Dashboard
				</Heading>

				<Card bg={cardBg} shadow="md">
					<CardHeader>
						<Heading size="md" color="blue.600">
							<Icon as={FaStethoscope} mr={2} />
							Dataset Configuration
						</Heading>
					</CardHeader>
					<CardBody>
						<VStack spacing={4} align="stretch">
							<Box>
								<Text fontWeight="bold" mb={2}>
									Current Route:
								</Text>
								<Badge colorScheme="blue" fontSize="md" p={2}>
									{dataRoute}
								</Badge>
							</Box>

							<Box>
								<Text fontWeight="bold" mb={3}>
									Quick Selection:
								</Text>
								<HStack spacing={4} wrap="wrap">
									<Button
										colorScheme="green"
										leftIcon={<Icon as={FaHospital} />}
										onClick={handleHospitalRoute}
									>
										Hospital Dataset
									</Button>
									<Button
										colorScheme="purple"
										leftIcon={<Icon as={FaTooth} />}
										onClick={handleDentalClinicRoute}
									>
										Dental Clinic Dataset
									</Button>
								</HStack>
							</Box>

							<FormControl>
								<FormLabel>Custom Data Route</FormLabel>
								<HStack>
									<Input
										value={customRoute}
										onChange={(e) => setCustomRoute(e.target.value)}
										placeholder="Enter custom route (e.g., custom/data.ttl)"
										flex="1"
									/>
									<Button colorScheme="blue" onClick={handleCustomRouteChange}>
										Apply Route
									</Button>
								</HStack>
							</FormControl>
						</VStack>
					</CardBody>
				</Card>

				<Tabs
					variant="enclosed"
					colorScheme="blue"
					index={activeTab}
					onChange={setActiveTab}
				>
					<TabList>
						<Tab>Patient Info</Tab>
						<Tab>Procedures</Tab>
						<Tab>Allergies</Tab>
					</TabList>

					<TabPanels>
						<TabPanel>
							<SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
								<PatientCard patient={medicalData} />
								<Box>
									<Stat bg={cardBg} p={6} borderRadius="md" shadow="md">
										<StatLabel>Total Records</StatLabel>
										<StatNumber>
											{(medicalData.procedures?.length || 0) +
												(medicalData.allergies?.length || 0)}
										</StatNumber>
										<StatHelpText>
											Procedures and allergies combined
										</StatHelpText>
									</Stat>
								</Box>
							</SimpleGrid>
						</TabPanel>

						<TabPanel>
							<ProceduresCard procedures={medicalData.procedures} />
						</TabPanel>

						<TabPanel>
							<AllergiesCard allergies={medicalData.allergies} />
						</TabPanel>
					</TabPanels>
				</Tabs>

				<Modal isOpen={isOpen} onClose={onClose} size="lg">
					<ModalOverlay />
					<ModalContent>
						<ModalHeader>
							<Heading size="md" color="blue.600">
								<Icon as={FaPlus} mr={2} />
								Add Equivalent Coding
							</Heading>
						</ModalHeader>
						<ModalCloseButton />
						<ModalBody>
							<VStack align="stretch" spacing={4}>
								<Box p={4} borderWidth={1} borderRadius="md" bg={cardBg}>
									<VStack align="start" spacing={3}>
										<Text fontWeight="bold">Selected Coding:</Text>
										{selectedCoding && (
											<Card size="sm" bg={modalCodingBg}>
												<CardBody p={3}>
													<VStack align="start" spacing={1}>
														<HStack>
															<Text
																fontSize="sm"
																fontWeight="bold"
																color="blue.600"
															>
																System:
															</Text>
															<Text fontSize="sm" fontFamily="mono">
																{selectedCoding.system || "Unknown"}
															</Text>
														</HStack>
														<HStack>
															<Text
																fontSize="sm"
																fontWeight="bold"
																color="green.600"
															>
																Code:
															</Text>
															<Badge colorScheme="green" variant="subtle">
																{selectedCoding.code || "Unknown"}
															</Badge>
														</HStack>
														<HStack>
															<Text
																fontSize="sm"
																fontWeight="bold"
																color="purple.600"
															>
																Display:
															</Text>
															<Text fontSize="sm">
																{selectedCoding.display || "No display name"}
															</Text>
														</HStack>
													</VStack>
												</CardBody>
											</Card>
										)}
									</VStack>
								</Box>

								<Heading size="sm" color="blue.600">
									New Equivalent Coding
								</Heading>
								<FormControl isRequired>
									<Select
										value={newCoding}
										onChange={(e) => setNewCoding(e.target.value)}
									>
										{codingContext &&
											getAvailableCodingsFor(codingContext).map((systems) => (
												<option key={systems} value={systems}>
													{systems}
												</option>
											))}
									</Select>
								</FormControl>
							</VStack>
						</ModalBody>

						<ModalFooter>
							<Button colorScheme="blue" onClick={handleSaveCoding}>
								Save Coding
							</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>
			</VStack>
		</Box>
	);
};

export default MedicalRecords;
