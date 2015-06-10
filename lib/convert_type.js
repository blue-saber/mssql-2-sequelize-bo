module.exports = function (column) {
	switch (column['DATA_TYPE']) {
	case "nvarchar":
	case "varchar":
	case "char":
		return "DataTypes.STRING(" + column['CHARACTER_MAXIMUM_LENGTH'] + ")";
	case "bigint":
		return "DataTypes.BIGINT";
	case "smallint":
	case "int":
		return "DataTypes.INTEGER";
	case "datetime":
		return "DataTypes.DATE";
	case "text":
	case "ntext":
		return "DataTypes.TEXT";
	case "varbinary":
		return "DataTypes.STRING.BINARY";
	case "image":
		return "DataTypes.BLOB";
	default:
		throw new Error('Oops! please add proper datatype for "' + column['DATA_TYPE'] + ' in ' + __filename);
	}
};