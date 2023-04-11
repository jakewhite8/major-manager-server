const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require('request');
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

exports.setPassword = (req, res) => {
  if (!req.body) {
    res.status(400).send({
      message: 'Content can not be empty',
    });
  }

  const user = new User({
    team_name: null,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
  });

  User.changePassword(user, (err, data) => {
    if (err) {
      res.status(500).send({
        message: err.message || 'Error occured while updating password',
      });
    }
    res.send(data);
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
      expiresIn: 604800, // 1 week
    });

    // Get the roles a user belongs to
    User.findRoles(data.id, (roleErr, roleData) => {
      if (roleErr) {
        console.error('Error getting user\'s roles: ', roleErr);
        res.status(500).send({message: 'Error getting user\'s roles'});
        return;
      }

      const roles = [];
      for (let i = 0; i < roleData.length; i += 1) {
        roles.push(roleData[i].roleId);
      }
      res.status(200).send({
        id: data.id,
        email: data.email,
        team_name: data.team_name,
        roles,
        accessToken: token,
      });
    });
  });
};

exports.recaptcha = (req, res) => {
  if (!req.body) {
    res.status(400).send({
      message: 'Content cannot be empty',
    });
    return;
  }
  if (!req.body.Response) {
    res.status(400).json({ message: 'Recaptcha token required' });
    return;
  }
  const verifyRecaptchaOptions = {
    url: 'https://www.google.com/recaptcha/api/siteverify',
    json: true,
    form: {
      secret: config.recaptcha,
      response: req.body.Response,
    },
  };
  request.post(verifyRecaptchaOptions, (err, response, body) => {
    if (err) {
      return res.status(500).json({ message: 'Error verifying reCAPTCHA with Google' });
    }
    if (!body.success) {
      return res.status(500).json({ message: body['error-codes'].join('.') });
    }
    return res.send(response);
  });
};
