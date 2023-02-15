const { authJwt, verifyCreateTournament } = require('../middleware');
const controller = require('../controllers/tournament.controller.js');

module.exports = function (app) {
  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept',
    );
    next();
  });

  // Return list of Tournaments that have not started yet
  app.get(
    '/api/v1/upcoming_tournaments',
    controller.joinTournamentsPage,
  );

  // Return list of Tournaments that have not ended
  app.get(
    '/api/v1/active_tournaments',
    controller.activeTournamentsPage,
  );

  // Return list of Tournaments that have ended
  app.get(
    '/api/v1/concluded_tournaments',
    controller.concludedTournaments,
  );

  // Return a list of Tournaments a user is signed up for
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

  app.post(
    '/api/v1/create_tournament',
    [authJwt.verifyToken, authJwt.isAdmin, verifyCreateTournament.checkDuplicateTournamentName],
    controller.createTournament,
  );

  app.get(
    '/api/v1/tournament_leaderboard_data/:id',
    controller.getLeaderboardData,
  );

  // Returns all the Team names that participated in a given Tournament
  app.get(
    '/api/v1/tournament_team_data/:id',
    [authJwt.verifyToken],
    controller.getTournamentTeamNames,
  );

  app.get(
    '/api/v1/league_leaderboard',
    [authJwt.verifyToken],
    controller.getLeagueLeaderboard,
  );
};
