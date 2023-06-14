module.exports = (connection) => {
  const Tournament = function (tournament) {
    this.name = tournament.name;
    this.start_date = tournament.start_date;
    this.round = tournament.round;
  };

  const handleError = (error, result) => {
    console.error(error);
    result(error, null);
  };

  Tournament.create = (tournament, result) => {
    connection.query(`INSERT INTO tournaments(name, start_date, round) VALUES('${tournament.name}', '${tournament.start_date}', '${tournament.round}')`, (tournamentErr, tournamentRes) => {
      if (tournamentErr) {
        handleError(tournamentErr, result);
        return;
      }
      result(null, tournamentRes);
    });
  };

  Tournament.findOne = (tournamentName, result) => {
    connection.query(`SELECT * FROM tournaments WHERE name = '${tournamentName}'`, (err, res) => {
      if (err) {
        handleError(err, result);
        return;
      }
      if (res.length) {
        result(null, res[0]);
        return;
      }
      result(null, null);
    });
  };

  Tournament.findActive = (result) => {
    // Active tournaments are tournaments that have not ended yet
    connection.query('SELECT * FROM tournaments WHERE datediff(start_date, curdate()) > -7', (err, res) => {
      if (err) {
        handleError(err, result);
        return;
      }
      result(null, res);
    });
  };

  Tournament.concludedTournaments = (result) => {
    // Return IDs and the name of tournaments that have ended
    let concludedTournamentsQuery = 'select * from tournaments where timestampdiff(hour, start_date, date_sub(current_timestamp(), interval 4 hour)) > 80'
    if (process.env && process.env.NODE_ENV && process.env.NODE_ENV != "development") {
      // Remove test Tournaments when not in development mode
      concludedTournamentsQuery = concludedTournamentsQuery + ' and start_date > "1996-01-01 11:30:00"'
    }
    concludedTournamentsQuery = concludedTournamentsQuery + ';'
    connection.query(concludedTournamentsQuery, (err, res) => {
      if (err) {
        handleError(err, result);
        return;
      }
      if (res.length) {
        result(null, res);
        return;
      }
      result({ kind: 'not found' }, null);
    });
  };

  Tournament.findUpcoming = (result) => {
    // Upcoming tournaments are tournaments that have not started yet
    connection.query('SELECT * FROM tournaments WHERE datediff(start_date, curdate()) > -1', (err, res) => {
      if (err) {
        handleError(err, result);
        return;
      }
      if (res.length) {
        result(null, res);
        return;
      }
      result({ kind: 'not found' }, null);
    });
  };

  Tournament.findActiveTournamentUser = (id, result) => {
    // Get list of tournaments a user is in
    connection.query(`SELECT * FROM users_tournaments WHERE userId = ${id}`, (usersTournamentsErr, usersTournamentsRes) => {
      if (usersTournamentsErr) {
        handleError(usersTournamentsErr, result);
        return;
      }
      if (usersTournamentsRes.length) {
        // Make an array of the tournament ids the user is a part of
        const tournamentIds = [];
        for (let i = 0; i < usersTournamentsRes.length; i += 1) {
          tournamentIds.push(usersTournamentsRes[i].tournamentId);
        }
        // Get the details of the tournaments a user is in
        connection.query(`SELECT * FROM tournaments WHERE id IN (${tournamentIds.join(', ')})`, (tournamentsErr, tournamentRes) => {
          if (tournamentsErr) {
            handleError(tournamentsErr, result);
            return;
          }
          if (tournamentRes.length) {
            result(null, tournamentRes);
            return;
          }
          result({ kind: 'not found' }, null);
        });
      } else {
        console.log('User is not in any tournaments');
        result(null, []);
      }
    });
  };

  Tournament.findPastTournamentUser = (id, result) => {
    // Get list of tournaments a user is in
    connection.query(`SELECT * FROM users_tournaments WHERE userId = ${id}`, (usersTournamentsErr, usersTournamentsRes) => {
      if (usersTournamentsErr) {
        handleError(usersTournamentsErr, result);
        return;
      }
      if (usersTournamentsRes.length) {
        // Make an array of the tournament ids the user was a part of
        const tournamentIds = [];
        for (let i = 0; i < usersTournamentsRes.length; i += 1) {
          tournamentIds.push(usersTournamentsRes[i].tournamentId);
        }
        // Get the details of the tournaments a user was in
        connection.query(`SELECT * FROM tournaments WHERE id IN (${tournamentIds.join(', ')})`, (tournamentsErr, tournamentRes) => {
          if (tournamentsErr) {
            handleError(tournamentsErr, result);
            return;
          }
          result(null, tournamentRes);
        });
      } else {
        console.log('User is not in any tournaments');
        result(null, []);
      }
    });
  };

  Tournament.getTournamentInfoFromId = (id, result) => {
    connection.query('SELECT name, round FROM tournaments WHERE id = ?', id, (err, res) => {
      if (err) {
        handleError(err, result);
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
        handleError(err, result);
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
    // First check if the tournament has started.
    // If it has, then a User should not be able to update their Team
    connection.query('SELECT start_date FROM tournaments WHERE id = ?;', [tournamentId], (dateCheckErr, dateCheckRes) => {
      // Do not update Team if the Tournament has already started
      const currentDate = new Date().getTime();
      const tournamentStartDate = new Date(dateCheckRes[0].start_date).getTime();
      if (currentDate < tournamentStartDate) {
        // Check if this relation has been established
        connection.query('SELECT id FROM users_tournaments WHERE tournamentId = ? AND userId= ?', [tournamentId, userId], (err, res) => {
          if (err) {
            handleError(err, result);
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
                handleError(deleteTournPlayersErr, result);
                return;
              }

              const sqlInsertStringHelper = createSqlValuesString(
                userTournamentRelationId, playerIds,
              );
              // Insert new team for a particular tournament
              connection.query(`INSERT INTO user_tournament_players(userTournamentRelationId, playerId) VALUES(${sqlInsertStringHelper})`, (insertPlayersErr, insertPlayersRes) => {
                if (insertPlayersErr) {
                  handleError(insertPlayersErr, result);
                  return;
                }
                result(null, insertPlayersRes);
              });
            });
          } else {
            // Create relation between a user and tournament (a team)
            connection.query(`INSERT INTO users_tournaments(userId, tournamentId) VALUES (${[userId, tournamentId]})`, (createTeamErr, createTeamRes) => {
              if (createTeamErr) {
                handleError(createTeamErr, result);
                return;
              }

              // Then populate team in users_tournament_players with players
              const sqlStringHelper = createSqlValuesString(createTeamRes.insertId, playerIds);
              connection.query(`INSERT INTO user_tournament_players(userTournamentRelationId, playerId) VALUES(${sqlStringHelper})`, (insertPlayersErr, insertPlayersRes) => {
                if (insertPlayersErr) {
                  handleError(insertPlayersErr, result);
                  return;
                }
                result(null, insertPlayersRes);
              });
            });
          }
        });
      } else {
        result({ message: 'Error: Tournament already started' }, null);
      }
    });
  };

  Tournament.getLeaderboardData = (tournamentId, result) => {
    const queryHelper = `SELECT users.team_name, users_tournaments.userId, user_tournament_players.playerId, players_tournaments.score, players_tournaments.tier, players_tournaments.cut, players.first_name, players.last_name
        FROM users_tournaments INNER JOIN user_tournament_players
        ON users_tournaments.tournamentId = ${tournamentId} AND users_tournaments.id = user_tournament_players.userTournamentRelationId
        INNER JOIN players_tournaments
        ON players_tournaments.player_id = user_tournament_players.playerId AND players_tournaments.tournament_id = ${tournamentId}
        INNER JOIN users
        ON users_tournaments.userId = users.id
        INNER JOIN players
        ON players.id = user_tournament_players.playerId
        ORDER BY \`users_tournaments\`.\`userId\` ASC, \`players_tournaments\`.\`tier\` ASC;`;

    connection.query(queryHelper, (err, res) => {
      if (err) {
        handleError(err, result);
        return;
      }
      result(null, res);
    });
  };

  // Return all Team names that participated in a given tournament
  Tournament.getTournamentTeamNames = (tournamentId, result) => {
    connection.query(`SELECT users.id, users.team_name FROM users_tournaments 
      INNER JOIN users ON users.id = users_tournaments.userId AND users_tournaments.tournamentId = ${tournamentId};`,
    (err, res) => {
      if (err) {
        handleError(err, result);
        return;
      }
      result(null, res);
    });
  };

  // Return the winning Team of each Tournament
  // [userId, users.team_name, tournament.name, tournamentId]
  Tournament.getLeagueLeaderboard = (tournamentId, result) => {
    connection.query(`SELECT user_wins.userId, users.team_name, user_wins.tournamentId, tournaments.name FROM user_wins 
      INNER JOIN users ON users.id = user_wins.userId 
      INNER JOIN tournaments ON user_wins.tournamentId = tournaments.id
      ORDER BY user_wins.userId;`, (err, res) => {
      if (err) {
        handleError(err, result);
        return;
      }
      result(null, res);
    });
  };

  return Tournament;
};
