class Rank {

    constructor (DB) {
        this.DB = DB;
    }

    getRank(leaderBoardId, userId) {
        return new Promise(
            (resolve, reject) => {
                this.DB.getConnection((err, connection) => {
                    const getScore =  `
                            SELECT rank, score from (
                                SELECT
                                    RANK() over (ORDER BY score DESC) AS rank,
                                    score,
                                    user_id
                                FROM
                                    rank_chatscores
                                WHERE
                                    chatleaderboard_id = ${leaderBoardId}
                            ) AS t WHERE user_id = ${userId}
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

}

module.exports = Rank;