const DB = require('./DB.js');
const mysql = require('mysql2');

class DataLayer {

    insertGuild(guildId, name) {
        DB.getConnection((err, connection) => {
            if (err) throw err;

            const escapedName = mysql.escape(name);

            const query = `
                INSERT INTO guilds
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

    insertChatLeaderBoard(guildId) {
        DB.getConnection((err, connection) => {
            if (err) throw err;

            const query = `
                INSERT IGNORE INTO chatleaderboards
                SET guild_id = ${guildId},
                last_reset_ts = ${Date.now()},
                next_reset_time_offset = ${604800000},
                name = '👑 Leader Board';
            `

            connection.query(query, (error, results, fields) => {
                connection.release();
                if (error) throw error;
            });
        });
    }

    getLeaderBoardId(guildId) {
        return new Promise(
            (resolve, reject) => {
                DB.getConnection((err, connection) => {
                    if (err) throw err;
        
                    const getLeaderBoardId = `
                        SELECT id from chatleaderboards
                        WHERE guild_id = ${guildId};
                    `
        
                    connection.query(getLeaderBoardId, (error, results, fields) => {
                        if (error) throw error;
                        connection.release();

                        if (results === undefined) {
                            reject(new Error("Results is undefined."))
                        } else {
                            resolve(results[0].id);
                        }
                    });
                });
            }
        );
    }

    insertScore(leaderBoardId, score, userId, username) {
        DB.getConnection((err, connection) => {
            const escapedUsername = mysql.escape(username);

            const insertScore = `
                INSERT INTO chatscores
                    (username, score, chatleaderboard_id, user_id)
                VALUES
                    (${escapedUsername}, ${score}, ${leaderBoardId}, ${userId})
                ON DUPLICATE KEY UPDATE
                    username = ${escapedUsername}, score = ${score};
            `;

            connection.query(insertScore, (error, results, fields) => {
                if (error) throw error;
                connection.release();
            })
        });
    }

    getLeaderBoard(guildId) {

    }
}

module.exports = new DataLayer();