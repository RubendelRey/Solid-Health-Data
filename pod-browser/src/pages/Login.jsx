import {
	Box,
	Button,
	Card,
	CardBody,
	Divider,
	FormControl,
	FormHelperText,
	FormLabel,
	Heading,
	HStack,
	Icon,
	Input,
	Link,
	List,
	ListIcon,
	ListItem,
	Text,
	useColorModeValue,
	VStack,
} from "@chakra-ui/react";
import { useSession } from "@inrupt/solid-ui-react";
import { useCallback, useEffect, useState } from "react";
import {
	FiCheck,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiLock,
	FiShield,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Login = () => {
	const { session } = useSession();
	const [podUrl, setPodUrl] = useState("");
	const [isConnecting, setIsConnecting] = useState(false);
	const navigate = useNavigate();
	const cardBg = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "gray.700");

	const handleConnect = async (providerUrl = null) => {
		const urlToUse = providerUrl || podUrl.trim();
		if (!urlToUse) {
			return;
		}
		setIsConnecting(true);
		session.login({
			oidcIssuer: urlToUse,
			redirectUrl: window.location.href,
			clientName: "pod-browser",
		});
	};

	const redirect = useCallback(() => {
		if (session.info.isLoggedIn) {
			navigate("/medical-records");
		}
	}, [session.info.isLoggedIn, navigate]);

	useEffect(() => {
		redirect();
	}, [redirect]);

	useEffect(() => {
		redirect();
	}, [redirect]);

	const commonPodProviders = [
		{
			name: "Solid Community",
			url: "https://solidcommunity.net/",
			description: "Community-run SOLID pod provider",
		},
		{
			name: "Solid Web",
			url: "https://solidweb.org/",
			description: "Official Inrupt SOLID pod service",
		},
	];

	return (
		<VStack spacing={8} align="stretch" maxW="2xl" mx="auto">
			<Box textAlign="center">
				<Icon as={FiLock} boxSize={12} color="medical.500" mb={4} />
				<Heading size="xl" mb={2}>
					Connect to Your SOLID Pod
				</Heading>
				<Text color="gray.600">
					Enter your SOLID pod URL to securely access your medical records
				</Text>
			</Box>

			<Card bg={cardBg} border="1px" borderColor={borderColor}>
				<CardBody>
					<VStack spacing={6}>
						<FormControl>
							<FormLabel>SOLID Pod URL</FormLabel>
							<Input
								placeholder="https://your-username.solidcommunity.net/"
								value={podUrl}
								onChange={(e) => setPodUrl(e.target.value)}
								size="lg"
								variant="filled"
							/>
							<FormHelperText>
								Enter the full URL of your SOLID pod (e.g.,
								https://username.provider.com/)
							</FormHelperText>
						</FormControl>

						<HStack spacing={4} width="100%">
							<Button
								colorScheme="medical"
								size="lg"
								flex="1"
								isLoading={isConnecting}
								loadingText="Connecting..."
								onClick={handleConnect}
								isDisabled={!podUrl.trim()}
								leftIcon={<Icon as={FiGlobe} />}
							>
								Connect to Pod
							</Button>
						</HStack>
					</VStack>
				</CardBody>
			</Card>

			<Divider />

			<Box>
				<Heading size="md" mb={4}>
					<Icon as={FiInfo} mr={2} />
					Popular SOLID Pod Providers
				</Heading>
				<Text fontSize="sm" color="gray.600" mb={4}>
					Click on any provider below to login directly, or enter your custom
					pod URL above.
				</Text>
				<VStack spacing={3}>
					{commonPodProviders.map((provider, index) => (
						<Card
							key={index}
							bg={cardBg}
							border="1px"
							borderColor={borderColor}
							width="100%"
							cursor="pointer"
							_hover={{
								transform: "translateY(-2px)",
								shadow: "md",
								borderColor: "medical.300",
							}}
							transition="all 0.2s"
							onClick={() => handleConnect(provider.url)}
						>
							<CardBody py={4}>
								<HStack justify="space-between" align="center">
									<VStack align="start" spacing={1} flex="1">
										<Heading size="sm">{provider.name}</Heading>
										<Text fontSize="sm" color="gray.600">
											{provider.description}
										</Text>
										<Text fontSize="xs" color="blue.500" fontFamily="mono">
											{provider.url}
										</Text>
									</VStack>
									<VStack spacing={2}>
										<Button
											size="sm"
											colorScheme="medical"
											variant="solid"
											leftIcon={<Icon as={FiLock} />}
											isLoading={isConnecting}
											loadingText="Connecting..."
											onClick={(e) => {
												e.stopPropagation();
												handleConnect(provider.url);
											}}
										>
											Login
										</Button>
										<Link
											href={provider.url}
											isExternal
											onClick={(e) => e.stopPropagation()}
										>
											<Button
												size="xs"
												variant="ghost"
												rightIcon={<FiExternalLink />}
											>
												Visit
											</Button>
										</Link>
									</VStack>
								</HStack>
							</CardBody>
						</Card>
					))}
				</VStack>
			</Box>

			<Card bg={cardBg} border="1px" borderColor={borderColor}>
				<CardBody>
					<VStack align="start" spacing={4}>
						<Heading size="md">
							<Icon as={FiShield} mr={2} />
							How SOLID Authentication Works
						</Heading>
						<List spacing={2}>
							<ListItem fontSize="sm">
								<ListIcon as={FiCheck} color="green.500" />
								You remain in control of your data at all times
							</ListItem>
							<ListItem fontSize="sm">
								<ListIcon as={FiCheck} color="green.500" />
								Authentication happens through your pod provider
							</ListItem>
							<ListItem fontSize="sm">
								<ListIcon as={FiCheck} color="green.500" />
								This app only accesses data you explicitly grant permission to
							</ListItem>
							<ListItem fontSize="sm">
								<ListIcon as={FiCheck} color="green.500" />
								Your medical records never leave your pod unless you choose to
								share them
							</ListItem>
							<ListItem fontSize="sm">
								<ListIcon as={FiCheck} color="green.500" />
								You can revoke access at any time through your pod settings
							</ListItem>
						</List>
					</VStack>
				</CardBody>
			</Card>

			<Card bg={cardBg} border="1px" borderColor={borderColor}>
				<CardBody>
					<VStack align="start" spacing={4}>
						<Heading size="md">Don't have a SOLID Pod yet?</Heading>
						<Text fontSize="sm" color="gray.600">
							A SOLID pod is your personal data storage space on the web. You
							can create one for free with various providers and start taking
							control of your digital identity.
						</Text>
						<HStack spacing={4}>
							<Link href="https://solidproject.org/users/get-a-pod" isExternal>
								<Button
									size="sm"
									variant="outline"
									rightIcon={<FiExternalLink />}
								>
									Get a Pod
								</Button>
							</Link>
							<Link href="https://solidproject.org/" isExternal>
								<Button
									size="sm"
									variant="ghost"
									rightIcon={<FiExternalLink />}
								>
									Learn More
								</Button>
							</Link>
						</HStack>
					</VStack>
				</CardBody>
			</Card>
		</VStack>
	);
};

export default Login;
