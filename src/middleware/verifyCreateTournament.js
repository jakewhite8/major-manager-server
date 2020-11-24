const db = require('../models');

const Tournament = db.tournament;

const checkDuplicateTournamentName = (req, res, next) => {
  Tournament.findOne(req.body.name, (err, data) => {
    if (err) {
      console.log('Error: ', err);
      res.status(500).send(err);
      return;
    }
    if (data) {
      res.status(400).send({
        message: 'Tournament Name already in use',
      });
      return;
    }
    next();
  });
};

const verifyCreateTournament = {
  checkDuplicateTournamentName,
};

module.exports = verifyCreateTournament;
