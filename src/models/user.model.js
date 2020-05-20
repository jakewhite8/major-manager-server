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

  return User;
};
