const Rank = require("./Commands/Rank.js");
const Leaderboard = require("./Commands/Leaderboard.js");
const Activityboard = require("./Commands/Activityboard.js");
const Help = require("./Commands/Help.js");

class Instance {
    constructor(guild, DAL) {
        this.guild = guild;
        this.DAL = DAL;
        
        this.storage = {
            leaderBoardData: {},
            activityBoardData: {}
        }

        this.Rank = new Rank(guild, DAL, this.storage);
        this.Leaderboard = new Leaderboard(guild, DAL, this.storage);
        this.Activityboard = new Activityboard(guild, DAL, this.storage);
        this.Help = new Help();
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

    _selectCommand(msg, command) {
        switch (command.command) {
            case "leaderboard":
                this.Leaderboard.interceptLeaderBoardCommand({
                    msg: msg, 
                    page: 1, 
                    isNewMessage: true
                });
            break;
            case "leastactive":
                this.Activityboard.interceptLeastActiveUsersBoardCommand({
                    msg: msg,
                    page: 1,
                    isNewMessage: true
                });
            break;
            case "rank":
                this.Rank.interceptRankCommand({
                    msg: msg,
                    args: command.args
                })
            break;
            case "help":
                this.Help.interceptHelpCommand({
                    msg: msg
                });
            break;
        }
    }

    onMessageCreate(msg, command) {
        this.Leaderboard.onMessageCreate(msg);
        this.Activityboard.onMessageCreate(msg);

        if (command) {
            this._selectCommand(msg, command);
        }
    }
}

module.exports = Instance;