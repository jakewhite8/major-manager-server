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
    controller.activeTournamentsPage,
  );

  app.get(
    '/api/v1/active_tournament_user_data',
    [authJwt.verifyToken],
    controller.activeTournamentUserData,
  );

  app.get(
    '/api/v1/past_tournament_user_data',
    [authJwt.verifyToken],
    controller.pastTournamentUserData,
  );

  app.get(
    '/api/v1/tournament_player_data/:id',
    [authJwt.verifyToken],
    controller.tournamentPlayerData,
  );

  app.post(
    '/api/v1/set_team',
    [authJwt.verifyToken],
    controller.setTeam,
  );

  app.get(
    '/api/v1/tournament_leaderboard_data/:id',
    controller.getLeaderboardData,
  );
};
