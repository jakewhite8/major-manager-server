const db = require('../models');
const settings = require('../config/golfSettings.config');

const Tournament = db.tournament;
const Player = db.player;
const User = db.user;

exports.createTournament = (req, res) => {
  if (!req.body) {
    res.status(400).send({
      message: 'Content cannot be empty',
    });
    return;
  }
  const tournament = new Tournament({
    name: req.body.name,
    start_date: req.body.start_date,
    round: 0,
  });

  Tournament.create(tournament, (err, data) => {
    if (err) {
      res.status(500).send({
        message: err.message || 'Error creating tournament',
      });
      return;
    }
    res.send(data);
  });
};

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

exports.concludedTournaments = (req, res) => {
  Tournament.concludedTournaments((err, data) => {
    if (err) {
      res.send({
        message: 'Error finding tournaments that have ended',
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
    const bufferDate = new Date();
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

    Tournament.getTournamentInfoFromId(req.params.id, (tournamentInfoErr, tournamentInfoData) => {
      if (tournamentInfoErr) {
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
          tournamentName: tournamentInfoData.name,
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

    Tournament.getTournamentInfoFromId(req.params.id, (tournamentInfoErr, tournamentInfoData) => {
      if (tournamentInfoErr) {
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
          topScoresByTeam[selectedTeam].sort((a, b) => a.score - b.score);
          const highestScoreInArrayLocation = topScoresByTeam[selectedTeam].length - 1;
          if (topScoresByTeam[selectedTeam][highestScoreInArrayLocation].score
            > selectedPlayer.score) {
            topScoresByTeam[selectedTeam][highestScoreInArrayLocation] = {
              score: selectedPlayer.score,
              playerId: selectedPlayer.playerId,
            };
          }
        } else {
          topScoresByTeam[selectedTeam].push({
            score: selectedPlayer.score,
            playerId: selectedPlayer.playerId,
          });
        }
        leaderboard[selectedTeam].push(selectedPlayer);
      }

      // Iterate through the topScoresByTeam object to get a total score for each team
      const scoresByTeam = {};
      for (const team in topScoresByTeam) {
        for (let j = 0; j < topScoresByTeam[team].length; j += 1) {
          if (!scoresByTeam[team]) {
            scoresByTeam[team] = {
              score: 0,
              position: '',
            };
          }
          scoresByTeam[team].score += topScoresByTeam[team][j].score;
        }
      }

      // Add a 'selected' property for each player where a team uses their score
      // towards their total score
      for (const team in leaderboard) {
        const arrayOfTopScoreIds = topScoresByTeam[team].map((player) => player.playerId);
        for (let k = 0; k < leaderboard[team].length; k += 1) {
          const selectedPlayer = leaderboard[team][k];
          // If a player's score is in the list of top players array (for a particular team)
          // then the selected attribute should equal true
          selectedPlayer.selected = arrayOfTopScoreIds.indexOf(selectedPlayer.playerId) > -1;
        }
      }

      // Sort Leaderboard into an Array based off their calculated score
      const sortedLeaderboardArray = [];
      for (const team in leaderboard) {
        sortedLeaderboardArray.push(leaderboard[team]);
      }
      sortedLeaderboardArray.sort((a, b) => scoresByTeam[a[0].team_name].score - scoresByTeam[b[0].team_name].score);

      // Calculate each Team's position in the Tournament
      for (let i = 0; i < sortedLeaderboardArray.length; i += 1) {
        const currentTeamName = sortedLeaderboardArray[i][0].team_name;
        const currentTeamScore = scoresByTeam[currentTeamName].score;
        // The first Team in the array is either in first place or is tied for first
        if (i === 0) {
          if (
            sortedLeaderboardArray[i + 1]
            && scoresByTeam[sortedLeaderboardArray[i + 1][0].team_name].score == currentTeamScore) {
            scoresByTeam[currentTeamName].position = 'T1';
          } else {
            scoresByTeam[currentTeamName].position = '1';
          }
        } else {
          // Check if the current Team's score is the same as the one before it in the sorted array
          const previousTeamName = sortedLeaderboardArray[i - 1][0].team_name;
          if (scoresByTeam[previousTeamName].score == currentTeamScore) {
            // Current Team is tied with the previous Team in the sorted array
            scoresByTeam[currentTeamName].position = scoresByTeam[previousTeamName].position;
          } else if (
            sortedLeaderboardArray[i + 1]
            && scoresByTeam[sortedLeaderboardArray[i + 1][0].team_name].score == currentTeamScore) {
            // Current Team is tied with the next Team in the sorted array
            scoresByTeam[currentTeamName].position = `T${i + 1}`;
          } else {
            // Current Team is not tied with anyone
            scoresByTeam[currentTeamName].position = `${i + 1}`;
          }
        }
      }

      const tournamentInformation = {
        leaderboardArray: sortedLeaderboardArray,
        tournament: tournamentInfoData,
        leaderboard,
        scoresByTeam,
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

// Return an array of Teams with the Tournaments they have won
// as well as an object with the number of wins each Team has
exports.getLeagueLeaderboard = (req, res) => {
  Tournament.getLeagueLeaderboard(req, (err, data) => {
    if (err) {
      res.send({
        message: (err && err.message) || 'Error retrieving League Leaderboard Data',
      });
      return;
    }

    // Make an array of objects organized by Team, populated with the Tournaments they have won
    // [{
    //   userId: 131,
    //   team_name: "Winning Team",
    //   tournaments: [{123, "1999 Masters"}]
    // },
    // {
    //   userId: 157,
    //   team_name: "Clicker",
    //   tournaments: [{230, "2000 PGA Championship"}]
    // }]
    // x interates through data
    // i iterates through teamArray
    const teamArray = [];
    const tournamentWinCount = {};
    for (let x = 0, i = 0; x < data.length; x += 1) {
      if (x == 0) {
        teamArray.push({
          userId: data[x].userId,
          team_name: data[x].team_name,
          tournaments: [{ id: data[x].tournamentId, name: data[x].name }],
        });
        tournamentWinCount[data[x].team_name] = 1;
      } else if (data[x].userId == teamArray[i].userId) {
        // Team has already been created
        teamArray[i].tournaments.push({ id: data[x].tournamentId, name: data[x].name });
        tournamentWinCount[data[x].team_name] += 1;
      } else {
        // New Team
        teamArray.push({
          userId: data[x].userId,
          team_name: data[x].team_name,
          tournaments: [{ id: data[x].tournamentId, name: data[x].name }],
        });
        tournamentWinCount[data[x].team_name] = 1;
        i += 1;
      }
    }

    // Order the teamArray array by how many Tournaments a Team has won
    teamArray.sort((a, b) => b.tournaments.length - a.tournaments.length);

    res.send({ teamArray, tournamentWinCount });
  });
};
