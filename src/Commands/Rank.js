const RankEmbed = require("../Embeds/RankEmbed.js");

class Rank {

    constructor(guild, DAL, storage) {
        this.guild = guild;
        this.DAL = DAL;
        this.storage = storage;
    }

    _sendRankEmbed(params) {
        const model = {
            rank: params.rank,
            userId: params.userId,
            msg: params.msg
        }

        RankEmbed.send(model);
    }

    _getUserId(params) {
        let userId;
        const isArgumentAnId = params.args.length && !isNaN(params.args[0]);

        if (isArgumentAnId) {
            userId = params.args[0];
        } else {
            userId = params.msg.author.id;
        }

        return userId;
    }

    _executeCommand(params) {
        const userId = this._getUserId(params);

        this.DAL.Rank.getRank(this.storage.leaderBoardData.id, userId).then(rank => {
            if (rank) {
                params.rank = rank;
            
            }
           
            params.userId = userId;

            this._sendRankEmbed(params);
        });
    }

    interceptRankCommand(params) {
        this._executeCommand(params);
    }

}

module.exports = Rank;