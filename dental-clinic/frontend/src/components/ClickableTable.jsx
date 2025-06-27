const ClickableTable = ({ onRowClick, ...props }) => {
	const onExpand = (expanded, record) => {
		if (props.expandable && props.expandable.onExpand) {
			props.expandable.onExpand(expanded, record);
		}
	};

	const expandable = props.expandable
		? {
				...props.expandable,
				onExpand: (expanded, record, event) => {
					if (event) {
						event.stopPropagation();
					}
					onExpand(expanded, record);
				},
		  }
		: undefined;

	const onRow = (record) => {
		const originalOnRow = props.onRow ? props.onRow(record) : {};

		return {
			...originalOnRow,
			onClick: (event) => {
				if (
					event.target.closest(".ant-table-row-expand-icon") ||
					event.target.closest(".ant-btn") ||
					event.target.closest(".ant-dropdown-trigger") ||
					event.target.closest(".ant-popover-open")
				) {
					return;
				}

				if (originalOnRow.onClick) {
					originalOnRow.onClick(event);
				}

				if (onRowClick) {
					onRowClick(record);
				}
			},
		};
	};

	return <Table {...props} expandable={expandable} onRow={onRow} />;
};

export default ClickableTable;
