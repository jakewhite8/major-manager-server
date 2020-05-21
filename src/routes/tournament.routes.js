const { authJwt } = require('../middleware');
const controller = require('../controllers/tournament.controller.js');

module.exports = function (app) {
  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept',
    );
    next();
  });

  app.get(
    '/api/v1/active_tournaments',
    [authJwt.verifyToken],
    controller.activeTournamentsPage,
  );

  app.get(
    '/api/v1/tournament_player_data/:id',
    [authJwt.verifyToken],
    controller.tournamentPlayerData,
  );
};
