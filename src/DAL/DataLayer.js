const Leaderboard = require('./LeaderboardDAL.js');
const Activityboard = require('./ActivityboardDAL.js');
const Rank = require('./RankDAL.js');
const Accounts = require('./AccountsDAL.js');
const DB = require('./DB.js');
const mysql = require('mysql2');

class DataLayer {

    constructor() {
        this.Leaderboard = new Leaderboard(DB);
        this.Activityboard = new Activityboard(DB);
        this.Rank = new Rank(DB);
        this.Accounts = new Accounts(DB);
    }

    insertGuild(guildId, name) {
        DB.getConnection((err, connection) => {
            if (err) throw err;

            const escapedName = mysql.escape(name);

            const query = `
                INSERT INTO rank_guilds
                    (id, name)
                VALUES
                    (${guildId}, ${escapedName})
               ON DUPLICATE KEY UPDATE
                    name = ${escapedName};
            `

            connection.query(query, (error, results, fields) => {
                connection.release();
                if (error) throw error;
            });
        });
    }
    
}

module.exports = new DataLayer();