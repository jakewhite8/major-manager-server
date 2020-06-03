module.exports = (connection) => {
  const Admin = {};
  
  Admin.postPlayerScores = (tournamentId, playerData, result) => { 
    // Get an array of all Players in database
    connection.query(`SELECT * from players`, (selectPlayersErr, selectPlayersRes) => {
      if (selectPlayersErr) {
        console.log('Error: ', selectPlayersErr);
        result(selectPlayersErr, null);
        return;
      }

      // Make an object that merges existing players with their ids
      // and makes an array of players that need to be added to the database
      const existingPlayersAndIds = []
      const newPlayers = []
      for ( var i = 0; i < playerData.length; i += 1) {
        let addToInsertList = true
        for ( var j = 0; j < selectPlayersRes.length; j += 1) {
          if ( playerData[i].last_name.toLowerCase() === selectPlayersRes[j].last_name.toLowerCase() ) {
            // Only one player with this last name is playing in the tournament, add to the existing array OR
            // If the first_name property is present, there are two players in the tournament with the same last name
            // Need to make sure first intials are the same
            if ( !playerData[i].first_name || (playerData[i].first_name && playerData[i].first_name.charAt(0).toLowerCase() === selectPlayersRes[j].first_name.charAt(0).toLowerCase()) ) {
              existingPlayersAndIds.push({
                id: selectPlayersRes[j].id,
                first_name: selectPlayersRes[j].first_name,
                last_name: selectPlayersRes[j].last_name,
                score: playerData[i].score
              })
              addToInsertList = false
              break
            }
          }
        }

        const mysql_real_escape_string = (str) => {
          return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
            switch (char) {
              case "\0":
                return "\\0";
              case "\x08":
                return "\\b";
              case "\x09":
                return "\\t";
              case "\x1a":
                return "\\z";
              case "\n":
                return "\\n";
              case "\r":
                return "\\r";
              case "\"":
              case "'":
              case "\\":
              case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                    // and double/single quotes
              default:
                return char;
            }
          });
        }

        const capitalizeFirstInitalAndEncode = (name) => {
          return mysql_real_escape_string(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
        }

        if (addToInsertList) {
          // Player doesnt exist in database
          newPlayers.push([
            `'${playerData[i].first_name && capitalizeFirstInitalAndEncode(playerData[i].first_name) || ''}'`,
            `'${capitalizeFirstInitalAndEncode(playerData[i].last_name)}'`,
            // score: playerData[i].score
          ])
        }
      }
      
      // Create Players that were not found in database 
      connection.query(`INSERT INTO players(first_name, last_name) VALUES(${newPlayers.join('), (')})`, (insertPlayersErr, insertPlayersRes) => {
        if (insertPlayersErr) {
          console.log('Error: ', insertPlayersErr);
          result(insertPlayersErr, null);
          return;
        }
        result(null, insertPlayersRes);
      })

    });
  };

  return Admin;
};
