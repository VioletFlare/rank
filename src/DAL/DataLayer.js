const Leaderboard = require('./Leaderboard.js');
const Activityboard = require('./Activityboard.js');
const DB = require('./DB.js');
const mysql = require('mysql2');

class DataLayer {

    constructor() {
        this.Leaderboard = new Leaderboard(DB);
        this.Activityboard = new Activityboard(DB);
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