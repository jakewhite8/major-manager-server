const db = require('../models');

const Tournament = db.tournament;
const Player = db.player;
const User = db.user;

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
  Tournament.findActiveTournamentUser(req.userId, (err, data) => {
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

exports.pastTournamentUserData = (req, res) => {
  Tournament.findPastTournamentUser(req.userId, (err, data) => {
    if (err) {
      res.send({
        message: 'Error finding a user\'s past tournaments',
      });
      return;
    }
    res.send(data);
  });
};

exports.setTeam = (req, res) => {
  Tournament.createTeam(req.userId, req.body.tournamentId, req.body.selectedPlayers,
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
  // Get Players in a given Tournament
  Player.getTournamentPlayerData(req.params.id, (playerErr, playerData) => {
    if (playerErr) {
      res.send({
        message: 'Error finding a tournaments player data',
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

      // Get a User's team, if they have one
      User.getTeam(req.userId, req.params.id, (getTeamErr, getTeamData) => {
        if (getTeamErr) {
          res.send({
            message: 'Error getting users team',
          });
          return;
        }

        const selectedTeam = [];
        if (getTeamData) {
          for (let j = 0; j < getTeamData.length; j += 1) {
            selectedTeam.push(getTeamData[j].playerId);
          }
        }

        // Organize Player data by tier
        const playerDataByTier = {};
        // Create an object that contains which players are
        // selected based on what tier they are in
        const selectedPlayers = {};
        for (let i = 0; i < playerData.length; i += 1) {
          const player = playerData[i];
          if (!playerDataByTier[`tier-${player.tier}`]) {
            playerDataByTier[`tier-${player.tier}`] = [];
            selectedPlayers[`tier-${player.tier}`] = null;
          }
          if (selectedTeam && selectedTeam.indexOf(player.player_id) > -1) {
            selectedPlayers[`tier-${player.tier}`] = player.player_id;
          }
          playerDataByTier[`tier-${player.tier}`].push(player);
        }

        const tournamentPlayerObj = {
          tournamentName: tournamentNameData.name,
          playerData: playerDataByTier,
          selectedPlayers,
        };
        res.send(tournamentPlayerObj);
      });
    });
  });
};
