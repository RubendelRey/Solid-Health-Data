import {
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as ViewIcon,
} from "@mui/icons-material";
import {
	Box,
	Chip,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Typography,
} from "@mui/material";

const DataTable = ({
	data = [],
	columns = [],
	title,
	onEdit,
	onDelete,
	onView,
	page = 0,
	rowsPerPage = 10,
	onPageChange,
	onRowsPerPageChange,
	totalCount,
	loading = false,
}) => {
	const handleChangePage = (event, newPage) => {
		if (onPageChange) {
			onPageChange(newPage);
		}
	};

	const handleChangeRowsPerPage = (event) => {
		if (onRowsPerPageChange) {
			onRowsPerPageChange(parseInt(event.target.value, 10));
		}
	};

	const renderCellContent = (value, column) => {
		if (column.type === "date" && value) {
			return new Date(value).toLocaleDateString();
		}
		if (column.type === "datetime" && value) {
			return new Date(value).toLocaleString();
		}
		if (column.type === "status") {
			const color = column.statusColors?.[value] || "default";
			return <Chip label={value} color={color} size="small" />;
		}
		if (column.type === "array" && Array.isArray(value)) {
			return value.join(", ");
		}
		return value || "-";
	};

	return (
		<Paper>
			{title && (
				<Box p={2}>
					<Typography variant="h6">{title}</Typography>
				</Box>
			)}
			<TableContainer>
				<Table>
					<TableHead>
						<TableRow>
							{columns.map((column) => (
								<TableCell key={column.field} sx={{ fontWeight: "bold" }}>
									{column.headerName}
								</TableCell>
							))}
							{(onEdit || onDelete || onView) && (
								<TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
							)}
						</TableRow>
					</TableHead>
					<TableBody>
						{data.map((row, index) => (
							<TableRow key={row._id || index}>
								{columns.map((column) => (
									<TableCell key={column.field}>
										{column.render
											? column.render(row)
											: renderCellContent(row[column.field], column)}
									</TableCell>
								))}
								{(onEdit || onDelete || onView) && (
									<TableCell>
										<Box display="flex" gap={1}>
											{onView && (
												<IconButton
													size="small"
													onClick={() => onView(row)}
													color="primary"
												>
													<ViewIcon />
												</IconButton>
											)}
											{onEdit && (
												<IconButton
													size="small"
													onClick={() => onEdit(row)}
													color="primary"
												>
													<EditIcon />
												</IconButton>
											)}
											{onDelete && (
												<IconButton
													size="small"
													onClick={() => onDelete(row)}
													color="error"
												>
													<DeleteIcon />
												</IconButton>
											)}
										</Box>
									</TableCell>
								)}
							</TableRow>
						))}
						{data.length === 0 && !loading && (
							<TableRow>
								<TableCell
									colSpan={
										columns.length + (onEdit || onDelete || onView ? 1 : 0)
									}
									align="center"
								>
									<Typography variant="body2" color="text.secondary" py={4}>
										No data available
									</Typography>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
			{totalCount > rowsPerPage && (
				<TablePagination
					component="div"
					count={totalCount}
					page={page}
					onPageChange={handleChangePage}
					rowsPerPage={rowsPerPage}
					onRowsPerPageChange={handleChangeRowsPerPage}
					rowsPerPageOptions={[5, 10, 25, 50]}
				/>
			)}
		</Paper>
	);
};

export default DataTable;
