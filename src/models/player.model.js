module.exports = (connection) => {
  const Player = function (player) {
    this.name = player.first_name;
    this.start_date = player.last_name;
  };

  // Returns an array of Player objects that are in the given Tournament
  Player.getTournamentPlayerData = (id, result) => {
    connection.query(`SELECT players_tournaments.player_id, players_tournaments.tier, players_tournaments.score, players.first_name, players.last_name FROM players_tournaments INNER JOIN players on players.id = players_tournaments.player_id AND players_tournaments.tournament_id=${id} `, (err, res) => {
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
