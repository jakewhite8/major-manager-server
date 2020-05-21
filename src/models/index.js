const mysql = require('mysql2');
const dbConfig = require('../config/db.config.js');

const connection = mysql.createPool({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  port: dbConfig.PORT,
});

const user = require('./user.model.js')(connection);
const role = require('./role.model.js')(connection);
const tournament = require('./tournament.model.js')(connection);
const player = require('./player.model.js')(connection);

module.exports = {
  connection,
  user,
  role,
  tournament,
  player,
};
