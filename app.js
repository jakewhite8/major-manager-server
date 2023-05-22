// seperate app.js and server.js for testing purposes

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

let whitelist = ['https://www.highstakesgolfpools.com', 'https://highstakesgolfpools.com'];

let corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.use(cors(corsOptions));

// Enables incoming requests to be decoded and parsed as json objects
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ encode: true }));

app.get('/', (req, res) => {
  res.status(200).send('Server can serve data');
});

require('./src/routes/user.routes.js')(app);
require('./src/routes/auth.routes.js')(app);
require('./src/routes/tournament.routes.js')(app);

// Add roles to the role table
// const db = require('./src/models');

// const Role = db.role;
// initializeRoleTable();

// function initializeRoleTable() {
//   Role.create('user')
//   Role.create('moderator')
//   Role.create('admin')
// }

module.exports = app;
