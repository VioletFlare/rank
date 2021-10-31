const lockFile = require('proper-lockfile');
const fs = require('fs');
const path = require('path');

class Rank {

    constructor(guild) {
        this.mainStack = [];
        this.trackStack = [];
        this.guild = guild;
        this.ledger = new Map();
        this.hasTopUserChanged = false;
    }

    _setActivity(username) {
        this.guild.client.user.setActivity(
            `🐖 ${username}`, {type: 'PLAYING'}
        );
    }

    _debounce(func, timeout = 10000) {
        let timer;
        return (...args) => {
          clearTimeout(timer);
          timer = setTimeout(
            () => { func.apply(this, args); }, timeout
          );
        };
      }

    _updateLedger(userId) {
        const userExists = this.ledger.get(userId);

        if (userExists) {
            this.ledger.set(
                userId, this.ledger.get(userId) + 1
            );
        } else {
            this.ledger.set(userId, 1);
        }
    }

    _getUserMessageCount(userId) {
        return this.ledger.get(userId);
    }

    _saveLedger() {
        const fileName = path.join(".", "data", `${this.guild.id}_ledger.json`);
        
        lockFile
            .lock(fileName)
            .then(
                () => {
                    const ledgerObj = Object.fromEntries(this.ledger);
                    const json = JSON.stringify(ledgerObj);
                    fs.writeFile(fileName, json, () => {});

                    return lockFile.unlock(fileName);
                }
            );
           
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
        this._setActivity(this.msg.author.username);
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

         if (user.msgCount > topUser.msgCount && topUser.id != user.id) {
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

            const _dbSaveLedger = this._debounce(
                () => this._saveLedger()
            );

            _dbSaveLedger();
        }
    }
}

module.exports = Rank;