const db = require('../models');

const User = db.user;

const checkDuplicateEmail = (req, res, next) => {
  User.findOne(req.body.email, (err, data) => {
    if (data) {
      res.status(400).send({
        message: 'Email already in use',
      });
      return;
    }
    next();
  });
};

const checkValidEmail = (req, res, next) => {
  User.findOne(req.body.email, (err, data) => {
    if (!data) {
      res.status(400).send({
        message: 'Email not in use',
      });
      return;
    }
    next();
  });
};

const verifySignUp = {
  checkDuplicateEmail,
  checkValidEmail,
};

module.exports = verifySignUp;
