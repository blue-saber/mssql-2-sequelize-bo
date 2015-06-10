'use strict';

var db2sequelize = require('./lib');

var config = {
	server: 'xxxx',
	userName: 'xxxx',
	password: 'xxxx',
	database: 'xxxx',
};

var filepath = null;

db2sequelize(config, filepath, function (err) {
	if (err) {
		console.log(err);
	} else {
		console.log("done.");
	}
});
