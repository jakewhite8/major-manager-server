const db = require('../models');

const User = db.user;

exports.allAccess = (req, res) => {
  res.status(200).send('Public Content');
};

exports.userPage = (req, res) => {
  res.status(200).send('User Content');
};

exports.moderatorPage = (req, res) => {
  res.status(200).send('Moderator Content');
};

exports.adminPage = (req, res) => {
  res.status(200).send('Admin Content');
};

exports.updateUser = (req, res) => {
  if (!req.body) {
    res.status(400).send({
      message: 'Content can not be empty',
    });
  }
  const user = {
    user_id: req.userId,
    team_name: req.body.team_name,
    email: req.body.email,
  };
  User.updateUser(user, (updateUserErr) => {
    if (updateUserErr) {
      res.status(500).send({
        message: 'Error updating user',
      });
    }
    res.status(200).send(user);
  });
};

// Add or update the user_wins table with a team that won a given tournament
exports.addWinningTeam = (req, res) => {
  if (!req.body) {
    res.status(400).send({
      message: 'Content can not be empty',
    });
  }

  User.updateUserWins({
    userId: req.body.userId,
    tournamentId: req.body.tournamentId,
  }, (updateUserWinsErr, updateUserWinsRes) => {
    if (updateUserWinsErr) {
      res.status(500).send({
        message: 'Error updating a users wins',
      });
    }
    res.status(200).send(updateUserWinsRes);
  });
};
