const Leaderboard = require('./Leaderboard.js');
const DB = require('./DB.js');

class DataLayer {

    constructor() {
        this.Leaderboard = new Leaderboard(DB);
    }
    
}

module.exports = new DataLayer();