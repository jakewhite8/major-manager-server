const db = require('../models');
const settings = require('../config/golfSettings.config');

const Tournament = db.tournament;
const Player = db.player;
const User = db.user;

exports.createTournament = (req, res) => {
  if (!req.body) {
    res.status(400).send({
      message: 'Content cannot be empty'
    });
    return;
  }
  const tournament = new Tournament({
    name: req.body.name,
    start_date: req.body.start_date
  });

  Tournament.create(tournament, (err, data) => {
    if (err) {
      res.status(500).send({
        message: err.message || 'Error creating tournament',
      });
      return;
    }
    res.send(data);
  })
}

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

exports.joinTournamentsPage = (req, res) => {
  Tournament.findUpcoming((err, data) => {
    if (err) {
      res.send({
        message: 'Error finding upcoming tournaments',
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
    // create buffer so the tournament will be on the active page while it is in progess
    const bufferDate = new Date()
    bufferDate.setDate(currentDate.getDate() - 5);
    for (let i = 0; i < data.length; i += 1) {
      const startDate = new Date(data[i].start_date);
      if (startDate.getTime() > bufferDate.getTime()) {
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
      // Create an object that tracks each Team's best scores
      const topScoresByTeam = {};
      for (let i = 0; i < userData.length; i += 1) {
        const selectedPlayer = userData[i];
        const selectedTeam = userData[i].team_name;
        if (!leaderboard[selectedTeam]) {
          leaderboard[selectedTeam] = [];
          topScoresByTeam[selectedTeam] = [];
        }
        // Check configuration settings to see how many scores are
        // counted to a teams total score
        if (topScoresByTeam[selectedTeam].length > settings.totalScoresCounted - 1) {
          // Remove the highest score in the array if the selected player has a lower score
          topScoresByTeam[selectedTeam].sort(function(a, b) {return a.score - b.score});
          const highestScoreInArrayLocation = topScoresByTeam[selectedTeam].length - 1;
          if (topScoresByTeam[selectedTeam][highestScoreInArrayLocation].score > selectedPlayer.score) {
            topScoresByTeam[selectedTeam][highestScoreInArrayLocation] = {
              'score': selectedPlayer.score,
              'playerId': selectedPlayer.playerId
            };
          }
        } else {
          topScoresByTeam[selectedTeam].push({
            'score': selectedPlayer.score,
            'playerId': selectedPlayer.playerId
          })       
        }
        leaderboard[selectedTeam].push(selectedPlayer);
      }
      
      // Iterate through the topScoresByTeam object to get a total score for each team
      let scoresByTeam = {};
      for (let team in topScoresByTeam) {
        let finalScore = 0;
        for (let j = 0; j < topScoresByTeam[team].length; j++) {
          if (!scoresByTeam[team]) {
            scoresByTeam[team] = 0;
          }
          scoresByTeam[team] += topScoresByTeam[team][j].score;
        }
      }

      // Add a 'selected' property for each player where a team uses their score towards their total score
      for (let team in leaderboard) {
        let arrayOfTopScoreIds = topScoresByTeam[team].map(function(player) {return player.playerId});
        for (let k = 0; k < leaderboard[team].length; k++){
          let selectedPlayer = leaderboard[team][k];
          // If a player's score is in the list of top players array (for a particular team)
          // then the selected attribute should equal true
          selectedPlayer['selected'] = arrayOfTopScoreIds.indexOf(selectedPlayer.playerId) > -1 ? true : false;
        }
      }

      const tournamentInformation = {
        tournamentName: tournamentNameData,
        leaderboard,
        scoresByTeam
      };
      res.send(tournamentInformation);
    });
  });
};

// Return all Team names that participated in a given tournament
exports.getTournamentTeamNames = (req, res) => {
  Tournament.getTournamentTeamNames(req.params.id, (err, data) => {
      if (err) {
        res.send({
          message: (err && err.message) || 'Error finding teams in a tournament',
        });
        return;
      }
      res.send(data);
    });
};