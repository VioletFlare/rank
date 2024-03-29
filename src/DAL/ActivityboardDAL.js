const mysql = require('mysql2');

class Activityboard {

    constructor(DB) {
        this.DB = DB;
    }

    insertActivityBoard(guildId) {
        return new Promise(
            (resolve, reject) => {
                this.DB.getConnection((err, connection) => {
                    if (err) throw err;

                    const query = `
                        INSERT IGNORE INTO rank_activityboards
                        SET id = ${guildId},
                        guild_id = ${guildId},
                        name = '🕒 Activity Board';
                    `

                    connection.query(query, (error, results, fields) => {
                        connection.release();

                        resolve(true);

                        if (error) throw error;
                    });
                });
            }
        )
    }

    getActivityBoardData(guildId) {
        return new Promise(
            (resolve, reject) => {
                this.DB.getConnection((err, connection) => {
                    if (err) throw err;
        
                    const query = `
                        SELECT * from rank_activityboards
                        WHERE guild_id = ${guildId};
                    `
        
                    connection.query(query, (error, results, fields) => {
                        if (error) throw error;
                        connection.release();

                        if (results === undefined) {
                            reject(new Error("Results is undefined."))
                        } else {
                            resolve(results[0]);
                        }
                    });
                });
            }
        );
    }

    insertLastVoiceActivityRecord(activityBoardId, userId, username) {
        this.DB.getConnection((err, connection) => {
            const escapedUsername =  mysql.escape(username);

            const insertScore = `
                INSERT INTO rank_activitylogs
                    (username, last_voice_active_ts, activityboard_id, user_id, latest_activity_ts)
                VALUES
                    (${escapedUsername}, ${Date.now()}, ${activityBoardId}, ${userId}, ${Date.now()})
                ON DUPLICATE KEY UPDATE
                    username = ${escapedUsername}, 
                    last_voice_active_ts = ${Date.now()},
                    latest_activity_ts = ${Date.now()};
            `;

            connection.query(insertScore, (error, results, fields) => {
                if (error) throw error;
                connection.release();
            })
        });
    }

    insertLastReactionRecord(activityBoardId, userId, username) {
        this.DB.getConnection((err, connection) => {
            const escapedUsername =  mysql.escape(username);

            const insertScore = `
                INSERT INTO rank_activitylogs
                    (username, last_reaction_ts, activityboard_id, user_id, latest_activity_ts)
                VALUES
                    (${escapedUsername}, ${Date.now()}, ${activityBoardId}, ${userId}, ${Date.now()})
                ON DUPLICATE KEY UPDATE
                    username = ${escapedUsername}, 
                    last_reaction_ts = ${Date.now()},
                    latest_activity_ts = ${Date.now()};
            `;

            connection.query(insertScore, (error, results, fields) => {
                if (error) throw error;
                connection.release();
            })
        });
    }

    insertLastMessageRecord(activityBoardId, userId, username) {
        this.DB.getConnection((err, connection) => {
            const escapedUsername =  mysql.escape(username);

            const insertScore = `
                INSERT INTO rank_activitylogs
                    (username, last_message_ts, activityboard_id, user_id, latest_activity_ts)
                VALUES
                    (${escapedUsername}, ${Date.now()}, ${activityBoardId}, ${userId}, ${Date.now()})
                ON DUPLICATE KEY UPDATE
                    username = ${escapedUsername}, 
                    last_message_ts = ${Date.now()},
                    latest_activity_ts = ${Date.now()};
            `;

            connection.query(insertScore, (error, results, fields) => {
                if (error) throw error;
                connection.release();
            })
        });
    }

    getLeastActiveUsers(activityBoardId) {
        return new Promise(
            (resolve, reject) => {
                this.DB.getConnection((err, connection) => {

                    const query = `
                        SELECT * FROM rank_activitylogs
                        WHERE activityboard_id = ${activityBoardId}
                    `;

                    connection.query(query, (error, results, fields) => {
                        if (error) throw error;
                        connection.release();

                        if (results === undefined) {
                            reject(new Error("Results is undefined."))
                        } else {
                            resolve(results);
                        }
                    })
                });
            }
        );
    }

}

module.exports = Activityboard;