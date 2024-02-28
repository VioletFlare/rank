const Board = require("./Board.js");
const ActivityboardProvider = require("../Providers/ActivityboardProvider");
const ActivityboardEmbed = require("../Embeds/ActivityboardEmbed.js");
const ActivityboardHelper = require("../Helpers/ActivityboardHelper.js");

class Activityboard extends Board {
    constructor(guild, DAL, storage) {
        super();
        this.guild = guild;
        this.DAL = DAL;
        this.storage = storage;
    }

    onMessageCreate(msg) {
        this.msg = msg;

        if (!msg.author.bot) {
            this.DAL.Activityboard.insertLastMessageRecord(
                this.storage.activityBoardData.id, 
                msg.author.id, 
                msg.author.username
            );
        }
    }

    onMessageReactionAdd(reaction, user) {
        if (!user.bot) {
            this.DAL.Activityboard.insertLastReactionRecord(
                this.storage.activityBoardData.id, 
                user.id, 
                user.username
            )
        }
    }

    onVoiceStateUpdate(oldVoiceState, newVoiceState) {
        if (!newVoiceState.member.user.bot) {
            this.DAL.Activityboard.insertLastVoiceActivityRecord(
                this.storage.activityBoardData.id, 
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

    _handleValidRequest(params) {
        const offset = super.calculateOffset(params.page);
        const leastActiveMembersPage = this._getPage(params.leastActiveRealMembers, offset);
        const userListRepresentation = this.activityboardHelper.requestUserListRepresentation(leastActiveMembersPage);

        this._sendLeastActiveUsersBoardEmbed(params, userListRepresentation);
    }

    _executeCommand(params) {
        super._executeCommand(params);

        return this.ActivityboardProvider.getLeastActiveRealMembers(this.storage.activityBoardData.id).then(
            leastActiveRealMembers => {
                const numberOfPages = this._getNumberOfPages(leastActiveRealMembers.length);
                const isRequestedPageValid = params.page <= numberOfPages && params.page >= 1;

                if (isRequestedPageValid) {
                    params.numberOfPages = numberOfPages;
                    params.leastActiveRealMembers = leastActiveRealMembers;
                    this._handleValidRequest(params);

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
        this.DAL.Activityboard.insertActivityBoard(this.guild.id).then(() => {
            this.DAL.Activityboard.getActivityBoardData(this.guild.id).then(
                activityBoardData => {
                    this.storage.activityBoardData = activityBoardData;
                } 
            );
        });

        this.activityboardHelper = new ActivityboardHelper(this.guild);
        this.ActivityboardProvider = new ActivityboardProvider(this.guild, this.DAL);
    }

}

module.exports = Activityboard;