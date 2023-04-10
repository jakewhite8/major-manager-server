const db = require('../models');

const Admin = db.admin;

exports.uploadPlayerScores = (req, res) => {
  Admin.addPlayersToPlayersTable(req.body.playerData, (addPlayersErr, addPlayersData) => {
    if (addPlayersErr) {
      res.status(500).send({
        message: 'Error uploading players to players table',
      });
      return;
    }

    // addPlayersData:
    // [
    //   {
    //     "first_name": "",
    //     "last_name": "terry",
    //     "score": "157",
    //     "id": 123,
    //   ? "tier":2,
    //   },
    //   ...
    // ]
    Admin.addPlayersToTournamentTable(addPlayersData, req.params.id, req.body.round,
      (addTournamentErr, addTournamentData) => {
        if (addTournamentErr) {
          res.send({
            message: 'Error uploading players to tournament table',
          });
          return;
        }
        res.status(200).send(addTournamentData);
      });
  });
};
