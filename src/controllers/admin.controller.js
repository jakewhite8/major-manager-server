const db = require('../models');

const Admin = db.admin;

exports.uploadPlayerScores = (req, res) => {
  Admin.postPlayerScores(req.params.id, req.body.playerData, (err, data) => {
    if (err) {
      res.send({
        message: 'Error uploading players scores',
      })
      return;
    }
    res.status(200).send(data);
  })
};
