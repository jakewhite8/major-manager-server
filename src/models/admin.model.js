module.exports = (connection) => {
  const Admin = {};

  const handleError = (error, result) => {
    console.error(error);
    result(error, null);
  };

  Admin.addPlayersToPlayersTable = (playerData, result) => {
    // Get an array of all Players in database
    connection.query('SELECT * from players', (selectPlayersErr, selectPlayersRes) => {
      if (selectPlayersErr) {
        handleError(selectPlayersErr, result);
        return;
      }
      // eslint-disable-next-line no-control-regex
      const escapeString = (str) => str.replace(/[\0\x08\x09\x1a\n\r"'\\%]/g, (char) => {
        switch (char) {
          case '\0':
            return '\\0';
          case '\x08':
            return '\\b';
          case '\x09':
            return '\\t';
          case '\x1a':
            return '\\z';
          case '\n':
            return '\\n';
          case '\r':
            return '\\r';
          case '"':
          case "'":
          case '\\':
          case '%':
            return `\\${char}`;
          default:
            return char;
        }
      });
      const capitalizeFirstInitalAndEncode = (name) => escapeString(
        // eslint-disable-next-line comma-dangle
        name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
      );

      // Make an object that merges existing players with their ids
      // and make an array of players that need to be added to the database

      // Put all Players in database into existingPlayersObject
      const existingPlayersObject = {};
      for (let k = 0; k < selectPlayersRes.length; k += 1) {
        const existingPlayer = selectPlayersRes[k];
        const playerProperty = `${existingPlayer.last_name.toLowerCase()}-${existingPlayer.first_name.toLowerCase()}`;
        existingPlayersObject[playerProperty] = {};
        existingPlayersObject[playerProperty].id = existingPlayer.id;
        existingPlayersObject[playerProperty].first_name = existingPlayer.first_name;
        existingPlayersObject[playerProperty].last_name = existingPlayer.last_name;
      }

      // Iterate through Players being uploaded. Find their ID and tier information if
      // available from database. Otherwise add them to the newPlayers array to be added to the
      // database

      // Array of Players already in the database with their scores, id, name info
      const existingPlayersAndIds = [];
      // Array that will be used for the SQL INSERT of new Players
      const sqlQueryValues = [];
      // Array of new Players that will contain Player id, score, name
      const newPlayers = [];
      for (let index = 0; index < playerData.length; index += 1) {
        const playerProperty = `${playerData[index].last_name.toLowerCase()}-${playerData[index].first_name.toLowerCase()}`;
        if (existingPlayersObject[playerProperty]) {
          // Player exists in database
          const playerDatabaseInfo = existingPlayersObject[playerProperty];
          existingPlayersAndIds.push({
            id: playerDatabaseInfo.id,
            first_name: playerDatabaseInfo.first_name,
            last_name: playerDatabaseInfo.last_name,
            score: playerData[index].score,
            tier: playerData[index].tier || '',
            cut: playerData[index].position === 'CUT',
          });
        } else {
          // Player doesnt exist in database
          sqlQueryValues.push([
            `'${(playerData[index].first_name && capitalizeFirstInitalAndEncode(playerData[index].first_name)) || ''}'`,
            `'${capitalizeFirstInitalAndEncode(playerData[index].last_name)}'`,
          ]);
          newPlayers.push({
            first_name: playerData[index].first_name || '',
            last_name: playerData[index].last_name,
            score: playerData[index].score,
            tier: playerData[index].tier || '',
          });
        }
      }

      // Create Players that were not found in database
      if (newPlayers.length) {
        connection.query(`INSERT INTO players(first_name, last_name) VALUES(${sqlQueryValues.join('), (')})`, (insertPlayersErr, insertPlayersRes) => {
          if (insertPlayersErr) {
            handleError(insertPlayersErr, result);
            return;
          }

          // insertId returns the id of the first row inserted
          // Add id to array of newPlayers
          for (let i = 0; i < newPlayers.length; i += 1) {
            // ClearDB SQL increases inserted row id's by ten
            newPlayers[i].id = insertPlayersRes.insertId + (10 * i);
          }

          // merge the newPlayers array to existingPlayersAndIds
          // that is sent to the tournaments table
          result(null, [...existingPlayersAndIds, ...newPlayers]);
        });
      } else {
        result(null, existingPlayersAndIds);
      }
    });
  };

  Admin.addPlayersToTournamentTable = (
    playerTournamentData, tournamentId, tournamentRound, result,
  ) => {
    // Find out what players need to be added to tournament table.
    // Array of all the IDs of the Players submitted from the client
    const playerIds = playerTournamentData.map(player => player.id)

    // Get all of the Players being added that are already in the players_tournaments table
    // if not exists sql?
    connection.query(`SELECT * FROM players_tournaments where tournament_id = ${tournamentId} AND player_id IN (${playerIds.join(', ')})`, (selectTournamentErr, selectTournamentRes) => {
      if (selectTournamentErr) {
        handleError(selectTournamentErr, result);
        return;
      }

      // selectTournamentRes
      // [
      //   {
      //     "id": 14,
      //     "player_id": 8,
      //     "tournament_id": 4,
      //     "tier": 1,
      //     "score": -15,
      //     "cut": null
      //   },
      //   ...
      // ]

      // Find players not in the players_tournaments table
      function idsNotInPlayersTournamentsTable(playersInTournamentArray, allPlayerIds) {
        const idSet = new Set(playersInTournamentArray.map(player => player.player_id))
        const missingIds = [];
        for (let i = 0; i < allPlayerIds.length; i++) {
          const id = allPlayerIds[i]
          if (!idSet.has(id)) {
            missingIds.push(id)
          }
        }
        return missingIds
      }

      const newPlayers = idsNotInPlayersTournamentsTable(selectTournamentRes, playerIds)

      function updateTournamentScores(selectTournamentRes, playerTournamentData, tournamentId, tournamentRound, handleError, result) {
        // Make an array of Players that are already registered for the selected Tournament
        // with their players_tournaments id and their updated score
        // - Need player_tournament id so rows can be updated, not duplicated
        const mergedTournamentAndPlayerData = [];
        for (let i = 0; i < selectTournamentRes.length; i += 1) {
          const updatedPlayer = playerTournamentData.find(
            (playerObject) => playerObject.id === selectTournamentRes[i].player_id,
          );

          if (updatedPlayer.cut) {
            updatedPlayer.score += 8;
          }
          mergedTournamentAndPlayerData.push([
            selectTournamentRes[i].id,
            updatedPlayer.score,
            selectTournamentRes[i].player_id,
            tournamentId,
            selectTournamentRes[i].tier,
            updatedPlayer.cut,
          ]);
        }

        const query = `INSERT INTO players_tournaments (id, score, player_id, tournament_id, tier, cut)
                VALUES (${mergedTournamentAndPlayerData.join('), (')})
                ON DUPLICATE KEY UPDATE id=VALUES(id),
                score=VALUES(score),
                player_id=VALUES(player_id),
                tournament_id=VALUES(tournament_id),
                tier=VALUES(tier),
                cut=VALUES(cut)`;

        connection.query(query, (updateTournamentErr, updateTournamentRes) => {
          if (updateTournamentErr) {
            handleError(updateTournamentErr, result);
            return;
          }
          // Update Tournament's round value
          connection.query(`UPDATE tournaments SET round = ${tournamentRound} WHERE id = ${tournamentId}`, (updateTournamentRoundErr) => {
            if (updateTournamentRoundErr) {
              handleError(updateTournamentRoundErr, result);
              return;
            }
            result(null, updateTournamentRes);
          });
        });
      }

      if (newPlayers.length) {
        // Add new Players to the Tournament
        const newPlayerData = [];
        for (let i = 0; i < playerTournamentData.length; i += 1) {
          const tier = playerTournamentData[i] && playerTournamentData[i].tier
            ? playerTournamentData[i].tier : 6;
          if (newPlayers.indexOf(playerTournamentData[i].id) > -1) {
            newPlayerData.push([
              playerTournamentData[i].id,
              tournamentId,
              playerTournamentData[i].score,
              tier,
            ]);
          }
        }
        connection.query(`INSERT INTO players_tournaments(player_id, tournament_id, score, tier) VALUES(${newPlayerData.join('), (')})`, (insertTournamentErr, insertTournamentRes) => {
          if (insertTournamentErr) {
            handleError(insertTournamentErr, result);
            return;
          }
 
          connection.query(`SELECT * FROM players_tournaments where tournament_id = ${tournamentId} AND player_id IN (${playerIds.join(', ')})`, (fullSelectTournamentErr, fullSelectTournamentRes) => {
            if (fullSelectTournamentErr) {
              handleError(fullSelectTournamentErr, result);
              return;
            }
            updateTournamentScores(fullSelectTournamentRes, playerTournamentData, tournamentId, tournamentRound, handleError, result)
          });
        });
      } else {
        updateTournamentScores(selectTournamentRes, playerTournamentData, tournamentId, tournamentRound, handleError, result)
      }
    });
  };
  return Admin;
};
