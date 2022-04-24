const Board = require("./Board.js");
const ActivityboardProvider = require("./Providers/ActivityboardProvider");
const ActivityboardEmbed = require("./Embeds/ActivityboardEmbed.js");
const ActivityboardHelper = require("./Helpers/ActivityboardHelper.js");

class Activityboard extends Board {
    constructor(guild, DAL) {
        super();
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

    onInteractionCreate(interaction) {
        super.navigate(
            interaction,
            params => this.interceptLeastActiveUsersBoardCommand(params)
        );
    }

    _sendLeastActiveUsersBoardEmbed(params, userListRepresentation) {
        const model = {
            userListRepresentation: userListRepresentation,
            msg: params.msg,
            page: params.page,
            isNewMessage: params.isNewMessage,
            numberOfPages: params.numberOfPages
        }

        ActivityboardEmbed.send(model);
    }

    _getPage(leastActiveMembers, offset) {
        const limit = offset + 10;

        return leastActiveMembers.slice(offset, limit);
    }

    _getNumberOfPages(entries) {
        const numberOfPages = Math.floor(entries / 10) + 
                              Math.ceil(
                                  (entries % 10) / 10
                              )
    
        return numberOfPages;
    }

    _executeCommand(params) {
        super._executeCommand(params);
        const offset = super.calculateOffset(params.page);

        return this.ActivityboardProvider.getLeastActiveRealMembers(this.activityBoardData.id).then(
            leastActiveRealMembers => {
                const numberOfPages = this._getNumberOfPages(leastActiveRealMembers.length);

                if (params.page >= 1 && params.page <= numberOfPages) {
                    params.numberOfPages = numberOfPages;
                    const leastActiveMembersPage = this._getPage(leastActiveRealMembers, offset);
                    const userListRepresentation = this.activityboardHelper.requestUserListRepresentation(leastActiveMembersPage);
    
                    this._sendLeastActiveUsersBoardEmbed(params, userListRepresentation);

                    return Promise.resolve(true);
                } else {
                    return Promise.resolve(false);
                }
            } 
        )
    }

    interceptLeastActiveUsersBoardCommand(params) {
        const command = this._executeCommand(params)

        return command;
    }

    init() {
        this.DAL.Activityboard.insertActivityBoard(this.guild.id);
        this.DAL.Activityboard.getActivityBoardData(this.guild.id).then(
            activityBoardData => {
                this.activityBoardData = activityBoardData;
            } 
        );

        this.activityboardHelper = new ActivityboardHelper(this.guild);
        this.ActivityboardProvider = new ActivityboardProvider(this.guild, this.DAL);
    }

}

module.exports = Activityboard;