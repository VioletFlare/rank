const ActivityboardEmbed = require("./Embeds/ActivityboardEmbed.js");
const ActivityboardHelper = require("./Helpers/ActivityboardHelper.js");

class Activityboard {
    constructor(guild, DAL) {
        this.guild = guild;
        this.DAL = DAL;
        this.activityBoardData = {};
    }

    onMessageCreate(msg) {
        this.msg = msg;

        if (!msg.author.bot) {
            this.DAL.Activityboard.insertLastMessageRecord(
                this.activityBoardData.id, 
                msg.author.id, 
                msg.author.username
            );
        }
    }

    onMessageReactionAdd(reaction, user) {
        if (!user.bot) {
            this.DAL.Activityboard.insertLastReactionRecord(
                this.activityBoardData.id, 
                user.id, 
                user.username
            )
        }
    }

    onVoiceStateUpdate(oldVoiceState, newVoiceState) {
        if (!newVoiceState.member.user.bot) {
            this.DAL.Activityboard.insertLastVoiceActivityRecord(
                this.activityBoardData.id, 
                newVoiceState.member.user.id, 
                newVoiceState.member.user.username
            )
        }
    }

    _sendLeastActiveUsersBoardEmbed(params, userListRepresentation) {
        const model = {
            userListRepresentation: userListRepresentation,
            msg: params.msg,
            page: params.page,
            isNewMessage: params.isNewMessage
        }

        ActivityboardEmbed.send(model);
    }

    printLeastActiveUsersBoard(params) {
        this.DAL.Activityboard.getLeastActiveUsers(this.activityBoardData.id).then(
            leastActiveUsers => this.activityboardHelper.prepareLeastActiveUsersBoard(leastActiveUsers)
        ).then(
            userListRepresentation => this._sendLeastActiveUsersBoardEmbed(params, userListRepresentation)
        )
    }

    init() {
        this.DAL.Activityboard.insertActivityBoard(this.guild.id);
        this.DAL.Activityboard.getActivityBoardData(this.guild.id).then(
            activityBoardData => {
                this.activityBoardData = activityBoardData;
            } 
        );

        this.activityboardHelper = new ActivityboardHelper(this.guild);
    }

}

module.exports = Activityboard;