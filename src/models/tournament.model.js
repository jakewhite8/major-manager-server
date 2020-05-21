module.exports = (connection) => {
  const Tournament = function (tournament) {
    this.name = tournament.name;
    this.start_date = tournament.start_date;
  };

  Tournament.findActive = (result) => {
    connection.query('SELECT * FROM tournaments', (err, res) => {
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

  Tournament.getTournamentNameFromId = (id, result) => {
    connection.query('SELECT name FROM tournaments WHERE id = ?', id, (err, res) => {
      if (err) {
        console.log('Error: ', err);
        result(err, null);
        return;
      }
      if (res.length) {
        result(null, res[0]);
        return;
      }
      result({ kind: 'not found' }, null);
    });
  };

  Tournament.findPlayerData = (id, result) => {
    connection.query('SELECT player_id, tier, score FROM players_tournaments WHERE tournament_id = ?', id, (err, res) => {
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

  return Tournament;
};
