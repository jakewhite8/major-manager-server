module.exports = (connection) => {
  const User = function (user) {
    this.team_name = user.team_name;
    this.email = user.email;
    this.password = user.password;
  };

  User.create = (newUser, result) => {
    // execute() may be the better then using query()
    connection.query('INSERT INTO users SET ?', newUser, (userErr, userRes) => {
      if (userErr) {
        console.error(userErr);
        result(userErr, null);
        return;
      }
      console.log(`Create user: ${JSON.stringify({ id: userRes.insertId, ...newUser })}`);

      // Add user to user_roles table
      connection.query('INSERT INTO user_roles(userId, roleId) VALUES(?, ?)', [userRes.insertId, 1], (err, res) => {
        if (err) {
          console.error(err);
          result(err, null);
          return;
        }
        console.log(`User added to user_roles table: ${JSON.stringify(res)}`);
        result(null, { id: userRes.insertId, ...newUser });
      });
    });
  };

  User.findOne = (email, result) => {
    connection.query('SELECT * FROM users WHERE email = ?', email, (err, res) => {
      if (err) {
        console.log('Error: ', err);
        result(err, null);
        return;
      }

      if (res.length) {
        console.log('found user: ', res[0]);
        result(null, res[0]);
        return;
      }

      result({ kind: 'not found' }, null);
    });
  };

  User.findRoles = (userId, result) => {
    connection.query('SELECT * FROM user_roles WHERE userId = ?', userId, (err, res) => {
      if (err) {
        console.log('Error: ', err);
        result(err, null);
        return;
      }

      if (res.length) {
        console.log('User\'s roles found');
        result(null, res);
        return;
      }

      result({ kind: 'roles not found' }, null);
    });
  };

  User.getTeam = (userId, tournamentId, result) => {
    connection.query(`SELECT * FROM users_tournaments WHERE userId = ${userId} AND tournamentId = ${tournamentId}`, (getTeamErr, getTeamRes) => {
      if (getTeamErr) {
        console.log('Error: ', getTeamErr);
        result(getTeamErr, null);
        return;
      }

      if (getTeamRes.length) {
        if (getTeamRes.length > 1) {
          console.log('Warning: multiple Teams found for the same Tournament by the same User');
        }

        const userTournamentRelationId = getTeamRes[0].id;

        connection.query(`SELECT * FROM user_tournament_players WHERE userTournamentRelationId = ${userTournamentRelationId}`, (getPlayersErr, getPlayersRes) => {
          if (getPlayersErr) {
            console.log('Error: ', getPlayersErr);
            result(getPlayersErr, null);
            return;
          }

          result(null, getPlayersRes);
        });
      } else {
        // No team made yet
        result(null, []);
      }
    });
  };

  User.updateUser = (user, result) => {
    connection.query(`UPDATE users SET team_name = '${user.team_name}' , email = '${user.email}' WHERE id = ${user.user_id}`, (err, res) => {
      if (err) {
        console.log('Error: ', err);
        result(err, null);
        return;
      }

      result(null, res);
    });
  }

  // Add or update the user_wins table with a team that won a given tournament
  User.updateUserWins = (data, result) => {
    connection.query(`INSERT INTO user_wins(userId, tournamentId) VALUES(${data.userId}, ${data.tournamentId})`, (err, res) => {
      if (err) {
        console.log('Error: ', err);
        result(err, null);
        return;
      }

      result(null, res);
    });
  }

  return User;
};
