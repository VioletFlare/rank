class Activityboard {
    constructor(guild, DAL) {
        this.guild = guild;
        this.DAL = DAL;
        this.activityBoardData = {};
    }

    init() {
        this.DAL.Activityboard.insertActivityBoard(this.guild.id);
        this.DAL.Activityboard.getActivityBoardData(this.guild.id).then(
            activityBoardData => {
                this.activityBoardData = activityBoardData;
            } 
        );
    }

    onMessageCreate(msg) {
        this.DAL.Activityboard.insertLastMessageRecord(
            this.activityBoardData.id, 
            msg.author.id, 
            msg.author.username
        );
    }

    onMessageReactionAdd(reaction, user) {
        this.DAL.Activityboard.insertLastReactionRecord(
            this.activityBoardData.id, 
            user.id, 
            user.username
        )
    }

    onVoiceStateUpdate(oldVoiceState, newVoiceState) {
        this.DAL.Activityboard.insertLastVoiceActivityRecord(
            this.activityBoardData.id, 
            newVoiceState.member.user.id, 
            newVoiceState.member.user.username
        )
    }

    printLeastActiveUsersBoard() {
        
    }
}

module.exports = Activityboard;