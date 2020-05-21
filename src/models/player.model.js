module.exports = (connection) => {
  const Player = function (player) {
    this.name = player.first_name;
    this.start_date = player.last_name;
  };

  Player.getPlayersNamesFromIds = (id, result) => {
    connection.query(`SELECT * FROM players WHERE id IN (${id.toString()})`, (err, res) => {
      if (err) {
        console.log('Error: ', err);
        result(err, null);
        return;
      }
      if (res.length) {
        result(null, res);
        return;
      }
      result({ kind: 'not found' }, null);
    });
  };

  return Player;
};
