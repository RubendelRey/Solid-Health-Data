import { Box, Card, CardContent, Typography } from "@mui/material";

const StatsCard = ({ title, value, icon, color = "primary" }) => {
	return (
		<Card>
			<CardContent>
				<Box display="flex" alignItems="center" gap={2}>
					<Box color={`${color}.main`}>{icon}</Box>
					<Box>
						<Typography variant="h4" component="div" color={`${color}.main`}>
							{value}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{title}
						</Typography>
					</Box>
				</Box>
			</CardContent>
		</Card>
	);
};

export default StatsCard;
