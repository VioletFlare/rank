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

    getLeaderBoardData(guildId) {
        return new Promise(
            (resolve, reject) => {
                DB.getConnection((err, connection) => {
                    if (err) throw err;
        
                    const getLeaderBoardId = `
                        SELECT * from chatleaderboards
                        WHERE guild_id = ${guildId};
                    `
        
                    connection.query(getLeaderBoardId, (error, results, fields) => {
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

    updateResetTime(leaderBoardId) {
        DB.getConnection((err, connection) => {
            const updateResetTime = `
                UPDATE chatleaderboards
                SET last_reset_ts = ${Date.now()}
                WHERE id = ${leaderBoardId}
            `;

            connection.query(updateResetTime, (error, results, fields) => {
                if (error) throw error;
                connection.release();
            })
        });
    }

    clearScores(leaderBoardId) {
        DB.getConnection((err, connection) => {
            const clearScores = `
                UPDATE chatscores
                SET score = 0
                WHERE chatleaderboard_id = ${leaderBoardId}
            `;

            connection.query(clearScores, (error, results, fields) => {
                if (error) throw error;
                connection.release();
            })
        });
    }

    resetLeaderBoard(leaderBoardId) {
        return new Promise(
            (resolve, reject) => {
                DB.getConnection((err, connection) => {
                    const resetLeaderBoard =  `
                        UPDATE chatleaderboards
                        SET last_reset_ts = ${Date.now()}
                        WHERE id = ${leaderBoardId};

                        UPDATE chatscores
                        SET score = 0
                        WHERE chatleaderboard_id = ${leaderBoardId};

                        SELECT * FROM chatleaderboards
                        WHERE id = ${leaderBoardId};
                    `;

                    connection.query(resetLeaderBoard, (error, results, fields) => {
                        if (error) throw error;
                        connection.release();

                        if (results === undefined) {
                            reject(new Error("Results is undefined."))
                        } else {
                            resolve(results[2]);
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

    getScore(leaderBoardId, userId) {
        return new Promise(
            (resolve, reject) => {
                DB.getConnection((err, connection) => {
                    const getScore =  `
                            SELECT * FROM chatscores
                            WHERE chatleaderboard_id = ${leaderBoardId} AND user_id = ${userId};
                        `;

                    connection.query(getScore, (error, results, fields) => {
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

    getLeaderBoard(leaderBoardId) {
        return new Promise(
            (resolve, reject) => {
                DB.getConnection((err, connection) => {
                    const getLeaderBoard =  `
                            SELECT * FROM chatscores
                            WHERE chatleaderboard_id = ${leaderBoardId} AND score != 0
                            ORDER BY score DESC
                            LIMIT 10;
                        `;

                    connection.query(getLeaderBoard, (error, results, fields) => {
                        if (error) throw error;
                        connection.release();

                        if (results === undefined) {
                            reject(new Error("Results is undefined."))
                        } else {
                            resolve(results);
                        }
                    });

                });
            }
        );
    }

    getTopUser(leaderBoardId) {
        return new Promise(
            (resolve, reject) => {
                DB.getConnection((err, connection) => {
                    const getLeaderBoard =  `
                            SELECT * FROM chatscores
                            WHERE chatleaderboard_id = ${leaderBoardId}
                            ORDER BY score DESC
                            LIMIT 1;
                        `;

                    connection.query(getLeaderBoard, (error, results, fields) => {
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

    getFirstThreePositions(leaderBoardId) {
        return new Promise(
            (resolve, reject) => {
                DB.getConnection((err, connection) => {
                    const getLeaderBoard =  `
                            SELECT * FROM chatscores
                            WHERE chatleaderboard_id = ${leaderBoardId}
                            ORDER BY score DESC
                            LIMIT 3;
                        `;

                    connection.query(getLeaderBoard, (error, results, fields) => {
                        if (error) throw error;
                        connection.release();

                        if (results === undefined) {
                            reject(new Error("Results is undefined."))
                        } else {
                            resolve(results);
                        }
                    });

                });
            }
        );
    }
}

module.exports = new DataLayer();