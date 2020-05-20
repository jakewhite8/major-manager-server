const db = require('../models');

const Tournament = db.tournament;

exports.activeTournamentsPage = (req, res) => {
  Tournament.findActive((err, data) => {
    if (err) {
      res.send({
        message: 'Error finding active tournaments',
      });
    }
    res.send(data);
  });
};
