// var db2sequelize = require('./lib');
var fs = require('fs');
var mssql_sequelize = require('./mssql_sequelize');

var tedious = require('tedious');
var async = require('async');

var Connection = tedious.Connection;
var Request = tedious.Request;

function convert_database_schema (cfg, dbname, filedir, callback) {
	var config = JSON.parse(JSON.stringify(cfg));

	config.options = config.options || {};

	config.options.rowCollectionOnRequestCompletion = false;
	config.options.rowCollectionOnDone = false;

	var connection = new Connection(config);

	connection.on('connect', function (err) {
		async.waterfall([
			function (callback) {
				var request = new Request(
					"USE " + dbname,
					function(err, rowCount) {
						if (err) {
							callback(err);
						} else {
							callback(null);
						}
					}
				);

				connection.execSql(request);
			},
			function (callback) {
				var tables = [];

				var request = new Request(
					"SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_TYPE = 'BASE TABLE'", 
					//"SELECT DB_NAME()",
					// "SELECT name from Sys.Databases",
					function (err, rowCount, rows) {
						if (err) {
							callback(err);
						} else {
							callback(null, tables);
						}
					}
				);

				request.on('row', function (columns) {
					// console.dir(columns);
					columns.forEach(function (column) {
						tables.push(column.value);
						// process.stdout.write("[" + column.metadata.colName + ": " + column.value + "]");
					});
					// process.stdout.write("\n");
				});

				connection.execSql(request);
			},
			function (tables, callback) {
				var TYPES = tedious.TYPES;
				var schemas = [];

				async.forEachSeries(
					tables,
					function (element, callback) {
						var schema = {
							table: element,
							columns: [],
							pk: {}
						};

						var request = new Request(
							"SELECT * FROM information_schema.COLUMNS WHERE (TABLE_NAME = @name AND TABLE_CATALOG = @catalog ) ORDER BY ORDINAL_POSITION",
							function (err, rowCount) {
								if (err) {
								} else {
									schemas.push(schema);
									callback (null);
								}
							}
						);

						request.on('row', function (columns) {
							var cols = {
								colName: undefined,
								columns: {}
							};

							columns.forEach(function (column) {
								if (column.metadata.colName === 'COLUMN_NAME') {
									cols.colName = column.value;
								}
								cols.columns[column.metadata.colName] = column.value;
							});

							schema.columns.push (cols);
						});

						request.addParameter('name', TYPES.VarChar, element);
						request.addParameter('catalog', TYPES.VarChar, dbname);

						connection.execSql(request);
					},
					function (err) {
						if (err) {
							callback (err);
						} else {
							callback (null, schemas);
						}
					}
				);
			},
			function (schemas, callback) {
				var TYPES = tedious.TYPES;

				async.forEachSeries(
					schemas,
					function (schema, callback) {
						var request = new Request(
								"SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE " +
								"WHERE TABLE_CATALOG=@catalog AND TABLE_NAME=@name AND " +
								"CONSTRAINT_NAME LIKE 'PK_%' ORDER BY ORDINAL_POSITION",
							function (err, rowCount) {
								callback(err);
							}
						);

						request.on('row', function (pks) {
							pks.forEach(function (pk) {
								schema.pk[pk.value] = schema.pk.length;
							});
						});

						request.addParameter('name', TYPES.VarChar, schema.table);
						request.addParameter('catalog', TYPES.VarChar, dbname);

						connection.execSql(request);
					},
					function (err) {
						callback(null, schemas);
					}
				);
			},
			function (schemas, callback) {
				async.forEachSeries(
					schemas,
					function (schema, callback) {
						try {
							var buffer = mssql_sequelize(schema);

							if (filedir != null) {
								var filename = filedir + '/' + schema.table + '.js';

								fs.open(filename, 'wx', 0644, function (err, fd) {
									if (! err) {
											fs.write(fd, buffer, function (err, written, string) {
												fs.close(fd, function (err) {
													console.log(filename + ": created.");
													callback(null);
												});
											});
									} else if (err.code == 'EEXIST') {
										console.log(filename + ": file already exists!");
										callback(null);
									} else {
										console.log(err);
										callback(err);
									}
								});
							} else {
								console.log(buffer);
								callback(null);
							}
						} catch (err) {
							callback(err);
						}
					},
					function (err) {
						callback(err);
					}
				);
			}
		], function (err) {
			connection.close();
			callback(err);
		});
	});
}

module.exports = function (cfg, filedir, callback) {
	if (typeof filedir == 'function') {
		callback = filedir;
		filedir = null;
	}

	async.waterfall([
		function (callback) {
			if (filedir == null) {
				callback(null);
			} else {
				var mask = 0755;

				fs.mkdir(filedir, mask, function (err) {
					if (err) {
						callback(err.code == 'EEXIST' ? null : err);
					} else {
						callback(null);
					}
				});
			}
		},
		function (callback) {
			convert_database_schema (cfg, cfg.database, filedir, callback);
		}
	], function (err) {
		callback(err);
	});
};
