const { authJwt } = require('../middleware');
const controller = require('../controllers/user.controller.js');
const adminController = require('../controllers/admin.controller.js');

module.exports = function (app) {
  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept',
    );
    next();
  });

  app.get('/api/test/all', controller.allAccess);

  app.get(
    '/api/test/user',
    [authJwt.verifyToken],
    controller.userPage,
  );

  app.get(
    '/api/v1/user_info/:id',
    controller.userInfo,
  );

  app.get(
    '/api/test/mod',
    [authJwt.verifyToken, authJwt.isModerator],
    controller.moderatorPage,
  );

  app.get(
    '/api/test/admin',
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminPage,
  );

  app.get(
    '/api/v1/non_admin_users',
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getNonAdmins,
  );

  app.post(
    '/api/v1/upload_player_scores/:id',
    [authJwt.verifyToken, authJwt.isAdmin],
    adminController.uploadPlayerScores,
  );

  app.put(
    '/api/v1/update_user',
    [authJwt.verifyToken],
    controller.updateUser,
  );

  // Add or update the user_wins table with a team that won a given tournament
  app.post(
    '/api/v1/add_winning_team',
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.addWinningTeam,
  );
};
