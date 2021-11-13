const lockFile = require('proper-lockfile');
const fs = require('fs');
const path = require('path');
const Discord = require("discord.js");

/*
    Three roles containing respectively "Famous", "Veteran" and "Advanced" should be present in the server;
    
    1. Famous
    2. Veteran
    3. Advanced

    Are roles assigned respecitvely to the position in the leaderboard every.
*/

class Rank {

    constructor(guild) {
        this.leaderBoard = [];
        this.guild = guild;
        this.ledger = new Map();
        this.hasTopUserChanged = false;
        this.date = {};
    }

    _setActivity(username) {
        this.guild.client.user.setActivity(
            `🏆 ${username}`, { type: 'PLAYING' }
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

    _handleTopUser() {
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

    _removeExcessiveLeaderBoardEntry() {
        if (this.leaderBoard.length > 10) {
            this.leaderBoard.splice(0, 1);
        }
    }

    _appendAtProperIndex(user) {
        const leaderBoard = this.leaderBoard.filter(
            record => record.id !== user.id
        );

        for (let i = 0; i < leaderBoard.length; i++) {
            const shouldAddUser = 
                leaderBoard[i].msgCount > user.msgCount
    
            if (shouldAddUser) {

                const firstPart = leaderBoard.slice(0, i);
                const secondPart = leaderBoard.slice(i);
                firstPart.push(user);
                this.leaderBoard = firstPart.concat(secondPart);
                    
                break;
            };
        }
    }

    _updateLeaderBoard(user, isLoading) {
        if (this.leaderBoard.length === 0) {
            this.leaderBoard.push(user);
            this.hasTopUserChanged = !isLoading;

            console.log(`${user.id} added to leaderboard.`);
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

            console.log(`${user.id} added to leaderboard.`);
        }

        this._removeExcessiveLeaderBoardEntry();
    }

    _getTopUser() {
        return this.leaderBoard[this.leaderBoard.length - 1];
    }

    loadLedger() {
        const ledgerPath = path.join("./data", `${this.guild.id}_ledger.json`);
        
        lockFile
            .lock(ledgerPath)
            .then(
                () => {
                    const data = fs.readFileSync(ledgerPath, 'utf8');

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

                    return lockFile.unlock(ledgerPath);
                }
            );
    }

    _sendLeaderBoardEmbed(leaderBoardRepresentation) {
        const embed = new Discord.MessageEmbed()
            .setColor('#DAA520')
            .setTitle("👑 Leader Board                 ")
            .setDescription(leaderBoardRepresentation)
            .setThumbnail('https://i.imgur.com/v5RR3ro.png')
            .setFooter("⭐ Number of messages committed.")
    
        this.msg.reply(embed);
    }


    _printLeaderBoard() {
        const leaderBoardTopBottom = this.leaderBoard.slice().reverse();
        let leaderBoardRepresentation = "";
        let usersPromises = [];

        leaderBoardTopBottom.forEach((record) => {
            usersPromises.push(this.guild.client.users.fetch(record.id));
        })

        Promise.all(usersPromises).then(
            (users) => {
                users.forEach((user, index) => {
                    const username = user.username.padEnd(32, " ");
                    const msgCount = leaderBoardTopBottom[index].msgCount.toString().padEnd(6, " ");
                    const position = index + 1; 

                    leaderBoardRepresentation += `\`${position}. ${username} ⭐ ${msgCount}\`\n`;
                })

                this._sendLeaderBoardEmbed(leaderBoardRepresentation);
            }
        );

    }

    _getDate() {
        const fileName = path.join(".", "data", `${this.guild.id}_date.json`);
        const data = fs.readFileSync(fileName, 'utf8');
        let config = null;

        if (data) {
            config = JSON.parse(data);
        } 

        return config;
    }

    _saveDate() {
        if (!this.date) {
            const fileName = path.join(".", "data", `${this.guild.id}_date.json`);

            lockFile
                .lock(fileName)
                .then(
                    () => {
                        this.date = {
                            then: Date.now()
                        }
                        const json = JSON.stringify(this.date.then);
                        
                        fs.writeFile(fileName, json, () => { });
    
                        return lockFile.unlock(fileName);
                    }
                );
        }
    }

    _clearData() {
        const ledgerPath = path.join("./data", `${this.guild.id}_ledger.json`)
        const dateFileName = path.join(".", "data", `${this.guild.id}_date.json`);

        this.date = null;
        this.leaderBoard = [];
        this.ledger = new Map()

        fs.writeFile(ledgerPath, "", () => { });
        fs.writeFile(dateFileName, "", () => { });
    }

    _assignRole(leaderBoard, roleName, position) {
        const role = this.guild.roles.cache.find(
            role => role.name.includes(roleName)
        );

        if (role && leaderBoard[position]) {
            this.guild.members.fetch(leaderBoard[position].id).then((member) => {
                member.roles.add(role);
            });
        }
    }

    _clearRole(roleName) {
        const role = this.guild.roles.cache.find(
            role => role.name.includes(roleName)
        );

        role.members.forEach(user => {
            user.roles.remove(role);
        });
    }

    _manageRoles() {
        const leaderBoardTopBottom = this.leaderBoard.slice().reverse();

        this._clearRole("Famous");
        this._clearRole("Veteran");
        this._clearRole("Advanced");

        this._assignRole(leaderBoardTopBottom, "Famous", 0);
        this._assignRole(leaderBoardTopBottom, "Veteran", 1);
        this._assignRole(leaderBoardTopBottom, "Advanced", 2);
    }

    _checkIfMonthHasPassed() {
        // 2592000000 ms - 1 Month
        // 604800000 ms - 1 Week
        
        let hasAMonthPassed;

        if (this.date) {
            hasAMonthPassed = Date.now() - this.date.then >= 604800000;
        } else {
            hasAMonthPassed = true;
        }
        
        if (hasAMonthPassed) {
            this._manageRoles();
            this._clearData();
        }
    }

    loadDate() {
        //3600000 ms - 1 Hour

        this.date = {
            then: this._getDate()
        };

        setInterval(() => {
            this._checkIfMonthHasPassed();
            this._saveDate();
        }, 3600000);
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

        if (this.msg.content === "r/leaderboard") {
            this._printLeaderBoard();
        }
    }
}

module.exports = Rank;