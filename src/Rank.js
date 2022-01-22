const Leaderboard = require("./Leaderboard.js");

class Rank {
    constructor(guild, DAL) {
        this.Leaderboard = new Leaderboard(guild, DAL);
    }
    
    init() {
        this.Leaderboard.init();
    }

    onMessageCreate(msg) {
        this.Leaderboard.onMessageCreate(msg);

        if (msg.content === "r/leaderboard") {
            this.Leaderboard.printLeaderBoard();
        } else if (msg.content === "r/leastactive") {
            
        } else if (msg.content === "r/help") {
            console.log("boink");
        }
    }
}

module.exports = Rank;