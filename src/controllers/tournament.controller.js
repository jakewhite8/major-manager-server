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

exports.getLeaderboardData = (req, res) => {
  // Need to get the Players on all of the Teams that are signed up for a particular Tournament
  Tournament.getLeaderboardData(req.params.id, (userErr, userData) => {
    if (userErr) {
      res.send({
        message: 'Error finding users in a tournament',
      });
      return;
    }

    Tournament.getTournamentNameFromId(req.params.id, (tournamentNameErr, tournamentNameData) => {
      if (tournamentNameErr) {
        res.send({
          message: 'Error finding tournament name',
        });
        return;
      }

      // Create an object that contains a User's Team for the Tournament
      const leaderboard = {};
      // Create an object that tracks each Team's total score
      const scoresByTeam = {};
      for (let i = 0; i < userData.length; i += 1) {
        if (!leaderboard[userData[i].team_name]) {
          leaderboard[userData[i].team_name] = [];
          scoresByTeam[userData[i].team_name] = 0;
        }
        leaderboard[userData[i].team_name].push(userData[i]);
        scoresByTeam[userData[i].team_name] += userData[i].score;
      }
      const tournamentInformation = {
        tournamentName: tournamentNameData,
        leaderboard,
        scoresByTeam,
      };
      res.send(tournamentInformation);
    });
  });
};
