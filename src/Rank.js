const Leaderboard = require("./Leaderboard.js");
const Activityboard = require("./Activityboard.js");

class Rank {
    constructor(guild, DAL) {
        this.guild = guild;
        this.DAL = DAL;
        this.Leaderboard = new Leaderboard(guild, DAL);
        this.Activityboard = new Activityboard(guild, DAL);
    }
    
    init() {
        this.DAL.insertGuild(this.guild.id, this.guild.name);
        this.Leaderboard.init();
        this.Activityboard.init();
    }

    onVoiceStateUpdate(oldVoiceState, newVoiceState) {
        this.Activityboard.onVoiceStateUpdate(oldVoiceState, newVoiceState);
    }

    onInteractionCreate(interaction) {
        switch (interaction.customId) {
            case 'LeaderboardEmbed::NextPage':
                
            break;
            case 'LeaderboardEmbed::PrevPage':

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
            this.Leaderboard.printLeaderBoard();
        } else if (msg.content === "r/leastactive") {
            this.Activityboard.printLeastActiveUsersBoard();
        } else if (msg.content === "r/help") {
            console.log("boink");
        }
    }
}

module.exports = Rank;