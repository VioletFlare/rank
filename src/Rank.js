class Rank {

    constructor(guild) {
        this.mainStack = [];
        this.trackStack = [];
        this.guild = guild;
        this.ledger = new Map();
        this.hasTopUserChanged = false;
    }

    _setActivity(username) {

        this.client.user.setActivity(
            `🐖 ${username}`, {type: 'PLAYING'}
        );
    }

    _updateLedger(userId) {
        const userExists = this.ledger.get(userId);

        if (userExists) {
            this.ledger.set(
                userId, map.set(userId, map.get(userId) + 1)
            );
        } else {
            this.ledger.set(userId, 1);
        }
    }

    _getUserMessageCount(userId) {
        return this.ledger.get(userId);
    }

    _saveLedger() {
        
    }

    _sendPiggyMessage() {
        const mention = this.msg.author.toString();

        const message = `
🇮🇹:     ${mention} è un maiale! 🐽 
🇬🇧:     ${mention} is a piggy! 🐽
`;

        this.msg.channel.send(message);
    }

    _handleTopUser() {
        this._sendPiggyMessage();
        
        this.hasTopUserChanged = false;
    }

    _updateTrackStack(user) {
        this.mainStack.push(user);

         if (this.mainStack.length == 1)
         {
             this.trackStack.push(user);
             this.hasTopUserChanged = true;
             return;
         }
    
         // If current user message count is greater than
         // the top user's of track stack, push
         // the current user to track stack
         // otherwise push the user at top of
         // track stack again into it.
         const topUser = this.trackStack[this.trackStack.length - 1];

         if (user.msgCount > topUser.msgCount) {
            this.trackStack.push(user);
            this.hasTopUserChanged = true;
         } else {
            this.trackStack.push(topUser);
         }
    }
    
     _getTopUser() {
         return this.trackStack[this.trackStack.length - 1];
     }

    onMessage(msg) {
        this.msg = msg;

        if(!this.msg.author.bot) {
            const userId = this.msg.author.id;
            this._updateLedger(userId);
            const msgCount = this._getUserMessageCount(userId);
            
            const user = {
                id: userId,
                msgCount: msgCount
            }
    
            this._updateTrackStack(user);
            
            if (this.hasTopUserChanged) this._handleTopUser();
        }
    }
}

module.exports = Rank;