const jwt = require('jsonwebtoken');
const config = require('../config/auth.config.js');
const db = require('../models');

const User = db.user;

const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    res.status(403).send({
      message: 'No token provided',
    });
    return;
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      res.status(401).send({
        message: 'Unauthorized - Session may be expired. Log out and back in',
      });
      return;
    }
    req.userId = decoded.id;
    next();
  });
};

const isAdmin = (req, res, next) => {
  User.findRoles(req.userId, (err, data) => {
    if (err) {
      console.error('Error getting user\'s roles: ', err);
      res.status(500);
      return;
    }

    for (let i = 0; i < data.length; i += 1) {
      if (data[i].roleId === 3) {
        next();
        return;
      }
    }
    res.status(403).send({
      message: 'Admin access only',
    });
  });
};

const isModerator = (req, res, next) => {
  User.findRoles(req.userId, (err, data) => {
    // if the data.role indexOf(3) > -1 we're in business
    if (err) {
      console.error('Error getting user\'s roles: ', err);
      res.status(500);
      return;
    }

    for (let i = 0; i < data.length; i += 1) {
      if (data[i].roleId === 2) {
        next();
        return;
      }
    }
    res.status(403).send({
      message: 'Moderator access only',
    });
  });
};

const authJwt = {
  verifyToken,
  isModerator,
  isAdmin,
};
module.exports = authJwt;
