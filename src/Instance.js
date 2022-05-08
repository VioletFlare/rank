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
        this.prefix = "r";
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

    _splitCommand(msg) {
        const indexOfFirstSpaceOccurrence = msg.content.indexOf(" ");
        const firstPartOfCommand = msg.content.substring(0, indexOfFirstSpaceOccurrence);
        const lastPartOfCommand = msg.content.substring(indexOfFirstSpaceOccurrence + 1, msg.content.length);
        const splittedCommand = [firstPartOfCommand, lastPartOfCommand];
    
        return splittedCommand;
    }

    _parseCommand(msg) {
        let splittedCommand = this._splitCommand(msg);
        splittedCommand = splittedCommand.filter(string => string !== "" && string !== " ");
        const prefix = splittedCommand[0] ? splittedCommand[0].toLowerCase() : "";
        
        if (prefix.includes(this.prefix)) {
          const commandNameSplitted = splittedCommand[0].split("/");
          const command = commandNameSplitted[1] ? commandNameSplitted[1].toLowerCase() : "";
    
          switch (command) {
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
            case "help":
                this.Help.interceptHelpCommand({
                    msg: msg
                });
            break;
          }
        }
    }

    onMessageCreate(msg) {
        this.Leaderboard.onMessageCreate(msg);
        this.Activityboard.onMessageCreate(msg);
    }
}

module.exports = Instance;