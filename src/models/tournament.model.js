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

  Tournament.createTeam = (userId, tournamentId, playerIds, result) => {
    // First check if this relation has been established
    connection.query('SELECT id FROM users_tournaments WHERE tournamentId = ? AND userId= ?', [tournamentId, userId], (err, res) => {
      if (err) {
        console.error(err);
        result(err, null);
        return;
      }

      // Function is used to make an array of arrays consisting of an id, representing a user
      // and tournaments relation, and a players id
      // ex - [[teamXId, playerZid], ..., [teamXId, playerYId]]
      function createSqlValuesString(userTournamentRelationId) {
        const playerTiers = Object.keys(playerIds);
        const sqlValuesArray = [];
        for (let i = 0; i < playerTiers.length; i += 1) {
          sqlValuesArray.push([userTournamentRelationId, playerIds[playerTiers[i]]]);
        }

        return sqlValuesArray.join('), (');
      }

      // If we are editing an existing team
      if (res.length) {
        if (res.length > 1) {
          console.log('Warning: Multiple userId and tournamentId relations');
        }

        const userTournamentRelationId = res[0].id;

        // Delete existing team for a particular tournament
        connection.query(`DELETE FROM user_tournament_players WHERE userTournamentRelationId=${userTournamentRelationId}`, (deleteTournPlayersErr) => {
          if (deleteTournPlayersErr) {
            console.error(deleteTournPlayersErr);
            result(deleteTournPlayersErr, null);
            return;
          }

          const sqlInsertStringHelper = createSqlValuesString(userTournamentRelationId, playerIds);
          // Insert new team for a particular tournament
          connection.query(`INSERT INTO user_tournament_players(userTournamentRelationId, playerId) VALUES(${sqlInsertStringHelper})`, (insertPlayersErr, insertPlayersRes) => {
            if (insertPlayersErr) {
              console.error(insertPlayersErr);
              result(insertPlayersErr, null);
              return;
            }

            result(null, insertPlayersRes);
          });
        });
      } else {
        // Create relation between a user and tournament (a team)
        connection.query(`INSERT INTO users_tournaments(userId, tournamentId) VALUES (${[userId, tournamentId]})`, (createTeamErr, createTeamRes) => {
          if (createTeamErr) {
            console.error(createTeamErr);
            result(createTeamErr, null);
            return;
          }

          // Then populate team in users_tournament_players with players
          const sqlStringHelper = createSqlValuesString(createTeamRes.insertId, playerIds);
          connection.query(`INSERT INTO user_tournament_players(userTournamentRelationId, playerId) VALUES(${sqlStringHelper})`, (insertPlayersErr, insertPlayersRes) => {
            if (insertPlayersErr) {
              console.error(insertPlayersErr);
              result(insertPlayersErr, null);
              return;
            }
            result(null, insertPlayersRes);
          });
        });
      }
    });
  };
  return Tournament;
};
