const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const config = require('../config/auth.config');

const User = db.user;

exports.signup = (req, res) => {
  // Save User to Database
  if (!req.body) {
    res.status(400).send({
      message: 'Content can not be empty',
    });
  }

  const user = new User({
    team_name: req.body.team_name,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
  });

  User.create(user, (err, data) => {
    if (err) {
      res.status(500).send({
        message: err.message || 'Error occured while creating the User',
      });
    } else {
      res.send(data);
    }
  });
};

exports.signin = (req, res) => {
  User.findOne(req.body.email, (err, data) => {
    if (err) {
      res.status(404).send({ message: 'Email not found' });
      return;
    }

    const passwordIsValid = bcrypt.compareSync(req.body.password, data.password);
    if (!passwordIsValid) {
      res.status(401).send({
        accessToken: null,
        message: 'Invalid Password',
      });
      return;
    }

    const token = jwt.sign({ id: data.id }, config.secret, {
      expiresIn: 86400, // 24 Hours
    });

    // Get the roles a user belongs to
    User.findRoles(data.id, (roleErr, roleData) => {
      if (roleErr) {
        console.error('Error getting user\'s roles: ', roleErr);
        res.status(500);
        return;
      }

      const roles = [];
      for (let i = 0; i < roleData.length; i += 1) {
        roles.push(roleData[i].roleId);
      }
      res.status(200).send({
        id: data.id,
        email: data.email,
        roles,
        accessToken: token,
      });
    });
  });
};
