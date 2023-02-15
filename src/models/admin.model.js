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
      // and makes an array of players that need to be added to the database

      // Array of Players already in the database with their scores, id, name info
      const existingPlayersAndIds = [];
      // Array that will be used for the SQL INSERT of new Players
      const sqlQueryValues = [];
      // Array of new Players that will contain Player id, score, name
      const newPlayers = [];
      for (let i = 0; i < playerData.length; i += 1) {
        let addToInsertList = true;
        for (let j = 0; j < selectPlayersRes.length; j += 1) {
          const playerDataLastName = playerData[i].last_name.toLowerCase();
          const selectPlayersResLastName = selectPlayersRes[j].last_name.toLowerCase();
          if (playerDataLastName === selectPlayersResLastName) {
            // Only one player with this last name is playing in the tournament,
            // add to the existing array OR
            // If the first_name property is present, there are two players
            // in the tournament with the same last name
            // Need to make sure first intials are the same
            if (!playerData[i].first_name
              || (playerData[i].first_name
              && (playerData[i].first_name.charAt(0).toLowerCase()
                === selectPlayersRes[j].first_name.charAt(0).toLowerCase()))) {
              existingPlayersAndIds.push({
                id: selectPlayersRes[j].id,
                first_name: selectPlayersRes[j].first_name,
                last_name: selectPlayersRes[j].last_name,
                score: playerData[i].score,
                tier: playerData[i].tier || '',
                cut: playerData[i].position == 'CUT',
              });
              addToInsertList = false;
              break;
            }
          }
        }

        if (addToInsertList) {
          // Player doesnt exist in database
          sqlQueryValues.push([
            `'${(playerData[i].first_name && capitalizeFirstInitalAndEncode(playerData[i].first_name)) || ''}'`,
            `'${capitalizeFirstInitalAndEncode(playerData[i].last_name)}'`,
          ]);
          newPlayers.push({
            first_name: playerData[i].first_name || '',
            last_name: playerData[i].last_name,
            score: playerData[i].score,
            tier: playerData[i].tier || '',
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

  Admin.addPlayersToTournamentTable = (playerTournamentData, tournamentId, result) => {
    // Find out what players need to be added to tournament table
    const playerIds = [];
    for (let i = 0; i < playerTournamentData.length; i += 1) {
      playerIds.push(playerTournamentData[i].id);
    }
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

      // Add new Players to players_tournament table
      const newPlayers = playerIds;
      for (let i = 0; i < selectTournamentRes.length; i += 1) {
        const index = newPlayers.indexOf(selectTournamentRes[i].player_id);
        if (index > -1) {
          // Remove the Player that is already signed up for the tournament
          newPlayers.splice(index, 1);
        }
      }

      if (newPlayers.length) {
        const newPlayerData = [];
        for (let i = 0; i < playerTournamentData.length; i += 1) {
          const tier = playerTournamentData[i] && playerTournamentData[i].tier ? playerTournamentData[i].tier : 6;
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
          result(null, insertTournamentRes);
        });
      // Update Player's Tournament data
      } else {
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

          result(null, updateTournamentRes);
        });
      }
    });
  };
  return Admin;
};
