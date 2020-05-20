module.exports = (connection) => {
  const Tournament = function (tournament) {
    this.name = tournament.name;
    this.start_date = tournament.start_date;
  };

  Tournament.findActive = (result) => {
    connection.query('SELECT * FROM tournaments', (err, res) => {
      if (err) {
        console.log('Error: ', err);
        result(err, null);
        return;
      }
      if (res.length) {
        result(null, res);
        return;
      }
      result({ kind: 'not found' }, null);
    });
  };

  return Tournament;
};
