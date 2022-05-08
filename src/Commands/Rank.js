class Rank {

    constructor(guild, DAL) {
        this.guild = guild;
        this.DAL = DAL;
    }

    _executeCommand(params) {
        this.DAL.Leaderboard.getScore(this.leaderBoardData.id, userId).then((score) => {

        });
    }

    interceptRankCommand(params) {
        this._executeCommand(params);
    }

}

module.exports = Rank;