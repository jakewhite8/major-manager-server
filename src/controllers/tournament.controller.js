const db = require('../models');

const Tournament = db.tournament;
const Player = db.player;

exports.activeTournamentsPage = (req, res) => {
  Tournament.findActive((err, data) => {
    if (err) {
      res.send({
        message: 'Error finding active tournaments',
      });
      return;
    }
    res.send(data);
  });
};

exports.activeTournamentUserData = (req, res) => {
  Tournament.findActiveTournamentUser(req.params.id, (err, data) => {
    if (err) {
      res.send({
        message: 'Error finding a user\'s active tournaments',
      });
      return;
    }
    // Do not send tournaments that have already occured
    const activeTournaments = [];
    const currentDate = new Date();
    for (let i = 0; i < data.length; i += 1) {
      const startDate = new Date(data[i].start_date);
      if (startDate.getTime() > currentDate.getTime()) {
        activeTournaments.push(data[i]);
      }
    }
    res.send(activeTournaments);
  });
};

exports.setTeam = (req, res) => {
  Tournament.createTeam(req.body.userId, req.body.tournamentId, req.body.selectedPlayers,
    (err, data) => {
      if (err) {
        res.send({
          message: 'Error finding active tournaments',
        });
        return;
      }
      res.send(data);
    });
};

exports.tournamentPlayerData = (req, res) => {
  Tournament.findPlayerData(req.params.id, (tournamentPlayerErr, tournamentPlayerData) => {
    if (tournamentPlayerErr) {
      res.send({
        message: 'Error finding a tournaments player data',
      });
      return;
    }

    // Get an array of ids of the players playing in the tournament
    // and get their name information from the players table
    const playerIds = [];
    for (let i = 0; i < tournamentPlayerData.length; i += 1) {
      playerIds.push(tournamentPlayerData[i].player_id);
    }

    Player.getPlayersNamesFromIds(playerIds, (playerNameErr, playerNameData) => {
      if (playerNameErr) {
        res.send({
          message: 'Error finding player name data',
        });
        return;
      }
      Tournament.getTournamentNameFromId(req.params.id, (tournamentNameErr, tournamentNameData) => {
        if (tournamentNameErr) {
          res.send({
            message: 'Error getting tournament name',
          });
          return;
        }
        // Join the tier and player data from the players_tournaments table
        // with the first_name and last_name that was retrieved from the player table
        // with the name that was retrieved from the tournaments table
        // - may want to move all of this organizing of data if we use this funciton
        // in a scenario that doesnt need it
        const merged = [];

        for (let i = 0; i < tournamentPlayerData.length; i += 1) {
          merged.push({
            ...tournamentPlayerData[i],
            ...(playerNameData.find(
              (itmInner) => itmInner.id === tournamentPlayerData[i].player_id,
            )),
          });
        }

        // Return player objects to UI in an array grouped by tiers
        // ex) All tier-1 players are found in sortedArray[0]
        // ex) All tier-2 players are found in sortedArray[1]
        merged.sort((a, b) => a.tier - b.tier);
        const sortedArray = [[]];
        let array = 0;
        for (let index = 0; index < merged.length; index += 1) {
          if (!sortedArray[array][0]) {
            sortedArray[array].push(merged[index]);
          } else if (sortedArray[array][0].tier === merged[index].tier) {
            sortedArray[array].push(merged[index]);
          } else {
            array += 1;
            sortedArray[array] = [merged[index]];
          }
        }

        const tournamentPlayerObj = {
          tournamentName: tournamentNameData.name,
          playerData: sortedArray,
        };
        res.send(tournamentPlayerObj);
      });
    });
  });
};
