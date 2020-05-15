const { verifySignUp } = require('../middleware');
const controller = require('../controllers/auth.controller');

// module.exports = function (app) {
module.exports = (app) => {
  app.use((req, res, next) => {
    // look into the header function
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept',
    );
    next();
  });

  app.post(
    '/api/auth/signup',
    [
      verifySignUp.checkDuplicateEmail,
    ],
    controller.signup,
  );

  app.post('/api/auth/signin', controller.signin);
};
