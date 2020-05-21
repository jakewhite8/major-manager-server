const db = require('../models');

const Tournament = db.tournament;
const Player = db.player;

exports.activeTournamentsPage = (req, res) => {
  Tournament.findActive((err, data) => {
    if (err) {
      res.send({
        message: 'Error finding active tournaments',
      });
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
        // join the tier and player data from the players_tournaments table
        // with the first_name and last_name that was retrieved from the player table
        // with the name that was retrieved from the tournaments table
        const merged = [];

        for (let i = 0; i < tournamentPlayerData.length; i += 1) {
          merged.push({
            ...tournamentPlayerData[i],
            ...(playerNameData.find(
              (itmInner) => itmInner.id === tournamentPlayerData[i].player_id,
            )),
          });
        }

        const tournamentPlayerObj = {
          tournamentName: tournamentNameData.name,
          playerData: merged,
        };
        res.send(tournamentPlayerObj);
      });
    });
  });
};
