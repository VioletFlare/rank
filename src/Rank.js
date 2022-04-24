const Leaderboard = require("./Leaderboard.js");
const Activityboard = require("./Activityboard.js");

class Rank {
    constructor(guild, DAL) {
        this.guild = guild;
        this.DAL = DAL;
        this.Leaderboard = new Leaderboard(guild, DAL);
        this.Activityboard = new Activityboard(guild, DAL);
    }

    _setActivity() {
        this.guild.client.user.setActivity(
            `r/help`
        );
    }
    
    init() {
        this.DAL.insertGuild(this.guild.id, this.guild.name);
        this.Leaderboard.init();
        this.Activityboard.init();
        this._setActivity();
    }

    onVoiceStateUpdate(oldVoiceState, newVoiceState) {
        this.Activityboard.onVoiceStateUpdate(oldVoiceState, newVoiceState);
    }

    onInteractionCreate(interaction) {
        const scope = interaction.customId.split("::")[0];

        switch (scope) {
            case "LeaderboardEmbed":
                this.Leaderboard.onInteractionCreate(interaction);
            break;
            case "ActivityboardEmbed":
                this.Activityboard.onInteractionCreate(interaction);
            break;
        }
    }

    onMessageReactionAdd(reaction, user) {
        this.Activityboard.onMessageReactionAdd(reaction, user);
    }

    onMessageCreate(msg) {
        this.Leaderboard.onMessageCreate(msg);
        this.Activityboard.onMessageCreate(msg);

        if (msg.content === "r/leaderboard") {
            this.Leaderboard.interceptLeaderBoardCommand({
                msg: msg, 
                page: 1, 
                isNewMessage: true
            });
        } else if (msg.content === "r/leastactive") {
            this.Activityboard.interceptLeastActiveUsersBoardCommand({
                msg: msg,
                page: 1,
                isNewMessage: true
            });
        } else if (msg.content === "r/help") {
            console.log("boink");
        }
    }
}

module.exports = Rank;