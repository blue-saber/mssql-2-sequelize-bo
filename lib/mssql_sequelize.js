var convert_type = require('./convert_type');
var convert_nullable = require('./convert_nullable');

module.exports = function mssql_sequelize(schema) {
	var		output = [];

	output.push("module.exports = function(sequelize, DataTypes) {");
	output.push("\treturn sequelize.define('" + schema.table + "', {");

	for (var i = 0; i < schema.columns.length; i++) {
		var colName = schema.columns[i].colName;

		output.push("\t\t" + colName + ": {");

		output.push("\t\t\ttype: " + convert_type(schema.columns[i].columns) + ",");

		if (schema.pk.hasOwnProperty(colName)) {
			output.push("\t\t\tprimaryKey: true,");
		}

		output.push("\t\t\tallowNull: " + convert_nullable(schema.columns[i].columns));

		if (i !== schema.columns.length - 1) {
			output.push("\t\t},");
		} else {
			output.push("\t\t}");
		}

		// TABLE_CATALOG// TABLE_SCHEMA// TABLE_NAME// COLUMN_NAME// ORDINAL_POSITION// COLUMN_DEFAULT// IS_NULLABLE
		// DATA_TYPE// CHARACTER_MAXIMUM_LENGTH// CHARACTER_OCTET_LENGTH// NUMERIC_PRECISION// NUMERIC_PRECISION_RADIX
		// NUMERIC_SCALE// DATETIME_PRECISION// CHARACTER_SET_CATALOG// CHARACTER_SET_SCHEMA// CHARACTER_SET_NAME
		// COLLATION_CATALOG// COLLATION_SCHEMA// COLLATION_NAME// DOMAIN_CATALOG// DOMAIN_SCHEMA// DOMAIN_NAME

	}

	output.push("\t}, {");
	output.push("\t\tfreezeTableName: true,");
	output.push("\t\tcreatedAt: false,");
	output.push("\t\tupdatedAt: false");
	output.push("\t});");
	output.push("};");

	return output.join("\n");
};