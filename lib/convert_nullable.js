module.exports = function (column) {
	switch (column['IS_NULLABLE']) {
	case "YES":
		return "true";
	case "NO":
		return "false";
	default:
		return column['IS_NULLABLE'];
	}
};