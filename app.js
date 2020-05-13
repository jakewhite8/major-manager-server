// seperate app.js and server.js for testing purposes

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Enables incoming requests to be decoded and parsed as json objects
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ encode: true }));

app.get('/', (req, res) => {
  res.status(200).send('Server can serve data');
});

module.exports = app;
