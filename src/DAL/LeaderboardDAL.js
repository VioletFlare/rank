const mysql = require('mysql2');

class Leaderboard {

    constructor(DB) {
        this.DB = DB;
    }

    insertChatLeaderBoard(guildId) {
        this.DB.getConnection((err, connection) => {
            if (err) throw err;

            const query = `
                INSERT IGNORE INTO rank_chatleaderboards
                SET id = ${guildId},
                guild_id = ${guildId},
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
                this.DB.getConnection((err, connection) => {
                    if (err) throw err;
        
                    const getLeaderBoardId = `
                        SELECT * from rank_chatleaderboards
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
        this.DB.getConnection((err, connection) => {
            const updateResetTime = `
                UPDATE rank_chatleaderboards
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
        this.DB.getConnection((err, connection) => {
            const clearScores = `
                UPDATE rank_chatscores
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
                this.DB.getConnection((err, connection) => {
                    const resetLeaderBoard =  `
                        UPDATE rank_chatleaderboards
                        SET last_reset_ts = ${Date.now()}
                        WHERE id = ${leaderBoardId};

                        UPDATE rank_chatscores
                        SET score = 0
                        WHERE chatleaderboard_id = ${leaderBoardId};

                        SELECT * FROM rank_chatleaderboards
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
        this.DB.getConnection((err, connection) => {
            const escapedUsername =  mysql.escape(username);

            const insertScore = `
                INSERT INTO rank_chatscores
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
                this.DB.getConnection((err, connection) => {
                    const getScore =  `
                            SELECT * FROM rank_chatscores
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

    getLeaderBoard(leaderBoardId, offset) {
        return new Promise(
            (resolve, reject) => {
                this.DB.getConnection((err, connection) => {
                    const getLeaderBoard =  `
                            SELECT * FROM rank_chatscores
                            WHERE chatleaderboard_id = ${leaderBoardId} AND score != 0
                            ORDER BY score DESC
                            LIMIT ${offset}, 10;
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
                this.DB.getConnection((err, connection) => {
                    const getLeaderBoard =  `
                            SELECT * FROM rank_chatscores
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
                this.DB.getConnection((err, connection) => {
                    const getLeaderBoard =  `
                            SELECT * FROM rank_chatscores
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

    getNumberOfPages(leaderBoardId) {
        return new Promise(
            (resolve, reject) => {
                this.DB.getConnection((err, connection) => {
                    const getLeaderBoard =  `
                         SELECT 
                            FLOOR(COUNT(*) / 10) + CEIL((COUNT(*) % 10) / 10) 
                         FROM rank_chatscores
                         WHERE chatleaderboard_id = ${leaderBoardId} AND score != 0
                    `;

                    connection.query(getLeaderBoard, (error, results, fields) => {
                        if (error) throw error;
                        connection.release();

                        if (results === undefined) {
                            reject(new Error("Results is undefined."))
                        } else {
                            const entries = Object.entries(results[0]);
                            const result = entries[0][1];

                            resolve(
                                Number(result)
                            );
                        }
                    });

                });
            }
        );
    }
}

module.exports = Leaderboard;