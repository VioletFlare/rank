const lockFile = require('proper-lockfile');
const fs = require('fs');
const path = require('path');
const Discord = require("discord.js");
const Client  = new Discord.Client();

class Rank {

    constructor(guild) {
        this.leaderBoard = [];
        this.guild = guild;
        this.ledger = new Map();
        this.hasTopUserChanged = false;
    }

    _setActivity(username) {
        this.guild.client.user.setActivity(
            `🐖 ${username}`, { type: 'PLAYING' }
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
                    fs.writeFile(fileName, json, () => { });

                    return lockFile.unlock(fileName);
                }
            );

    }

    _sendPiggyMessage() {
        const mention = this.msg.author.toString();

        const message = `
🇮🇹:     ${mention} è un maiale 🐽 
🇬🇧:     ${mention} is a piggy 🐽
`;

        this.msg.channel.send(message);
    }

    _handleTopUser() {
        this._sendPiggyMessage();
        this._setActivity(this.msg.author.username);
        this.hasTopUserChanged = false;
    }

    _removeDuplicate(user) {
        for (let i = 0; i < this.leaderBoard.length; i++) {
            if (this.leaderBoard[i].id === user.id) {
                this.leaderBoard.splice(i, 1);
            }
        }
    }

    _switchTopUser(user) {
        this._removeDuplicate(user);
        this.leaderBoard.push(user);
    }

    _updateUserMsgCount(user) {
        for (let i = 0; i < this.leaderBoard.length; i++) {
            if (this.leaderBoard[i].id === user.id) {
                this.leaderBoard[i].msgCount = user.msgCount;
            }
        }
    }

    _removeExcessiveTrackStackEntry() {
        if (this.leaderBoard.length > 10) {
            this.leaderBoard.splice(0, 1);
        }
    }

    _appendAtProperIndex(user) {
        const leaderBoard = this.leaderBoard.filter(
            record => record.id === user.id
        );

        if (!leaderBoard.length) {
            for (let i = 0; i < this.leaderBoard.length; i++) {
                const isLesserThanCurrent = 
                    this.leaderBoard[i].msgCount > user.msgCount
    
                if (isLesserThanCurrent) {
                    const firstPart = this.leaderBoard.slice(0, i);
                    const secondPart = this.leaderBoard.slice(i);
                    
                    firstPart.push(user);
    
                    this.leaderBoard = firstPart.concat(secondPart);
                    
                    break;
                };
            }
        }
    }

    _updateLeaderBoard(user, isLoading) {
        if (this.leaderBoard.length === 0) {
            this.leaderBoard.push(user);
            this.hasTopUserChanged = !isLoading;
            return;
        }

        const topUser = this.leaderBoard[this.leaderBoard.length - 1];
        const hasMoreMessagesThanTopUser = user.msgCount > topUser.msgCount;
        const isNotTopUser = topUser.id != user.id;

        if (hasMoreMessagesThanTopUser && isNotTopUser) {
            this._switchTopUser(user);
            this.hasTopUserChanged = !isLoading;
        } else {
            this._appendAtProperIndex(user);
            this._updateUserMsgCount(user);
        }

        this._removeExcessiveTrackStackEntry();
    }

    _getTopUser() {
        return this.leaderBoard[this.leaderBoard.length - 1];
    }

    loadGuildDataFile() {
        const ledgerPath = path.join("./data", `${this.guild.id}_ledger.json`);
        const data = fs.readFileSync(ledgerPath, 'utf8')

        if (data) {
            const ledgerObj = JSON.parse(data);
            const entries = Object.entries(ledgerObj);
            this.ledger = new Map(entries);

            for (const [id, msgCount] of entries) {
                const user = {
                    id: id,
                    msgCount: msgCount
                }
                this._updateLeaderBoard(user, true);
            }

            const topUser = this.leaderBoard[this.leaderBoard.length - 1];

            this.guild.client.users.fetch(topUser.id).then((user) => {
                this._setActivity(user.username);
            });
        }
    }

    onMessage(msg) {
        this.msg = msg;

        if (!this.msg.author.bot) {
            const userId = this.msg.author.id;
            this._updateLedger(userId);
            const msgCount = this._getUserMessageCount(userId);

            const user = {
                id: userId,
                msgCount: msgCount
            }

            this._updateLeaderBoard(user);

            if (this.hasTopUserChanged) this._handleTopUser();

            const _dbSaveLedger = this._debounce(
                () => this._saveLedger()
            );

            _dbSaveLedger();
        }
    }
}

module.exports = Rank;