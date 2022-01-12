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

    constructor(guild, DAL) {
        this.leaderBoard = [];
        this.guild = guild;
        this.ledger = new Map();
        this.DAL = DAL;
        this.leaderBoardData = {};
        this.topUser = {};
        this.date = {};
    }

    _setActivity(userId) {
        const member = this.guild.members.cache.find(
            member => member.user.id === userId
        );

        if (member && member.nickname) {
            this.guild.client.user.setActivity(
                `🏆 ${member.nickname}`, { type: 'PLAYING' }
            );
        } else {
            this.guild.client.users.fetch(userId).then(user => {
                this.guild.client.user.setActivity(
                    `🏆 ${user.username}`, { type: 'PLAYING' }
                );
            });
        }
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

    _sendLeaderBoardEmbed(leaderBoardRepresentation) {
        const embed = new Discord.MessageEmbed()
            .setColor('#DAA520')
            .setTitle("👑 Leader Board                 ")
            .setDescription(leaderBoardRepresentation)
            .setThumbnail('https://i.imgur.com/v5RR3ro.png')
            .setFooter("⭐ Number of messages committed.")
    
        this.msg.reply(embed);
    }

    _prepareLeaderboard(users, leaderboard) {
        let leaderBoardRepresentation = "";

        users.forEach((user, index) => {
            const member = this.guild.members.cache.find(
                member => member.user.id === user.id 
            );

            let username;

            if (member && member.nickname) {
                username = member.nickname.padEnd(32, " ");
            } else {
                username = user.username.padEnd(32, " ");
            }

            const msgCount = leaderboard[index].score.toString().padEnd(6, " ");
            const position = index + 1; 

            leaderBoardRepresentation += `\`${position}. ${username} ⭐ ${msgCount}\`\n`;
        })

        this._sendLeaderBoardEmbed(leaderBoardRepresentation);
    }

    _printLeaderBoard() {
        this.DAL.getLeaderBoard(this.leaderBoardData.id).then(leaderboard => {
            let usersPromises = [];

            leaderboard.forEach(record => {
                usersPromises.push(this.guild.client.users.fetch(record.user_id));
            })

            Promise.all(usersPromises).then(
                users => this._prepareLeaderboard(users, leaderboard)
            );
        });
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
        if (!this.date || !this.date.then) {
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

    _checkIfShouldReset() {
        // 2592000000 ms - 1 Month
        // 604800000 ms - 1 Week

        let shouldReset;

        if (this.date) {
            shouldReset = Date.now() - this.date.then >= 604800000;
        } else {
            shouldReset = true;
        }
        
        if (shouldReset) {
            this._manageRoles();
            this._clearData();
            this._saveDate();
        }
    }

    loadDate() {
        //3600000 ms - 1 Hour

        this.date = {
            then: this._getDate()
        };

        this._saveDate();

        setInterval(() => {
            this._checkIfShouldReset();
        }, 3600000);
    }

    init() {
        this.DAL.insertGuild(this.guild.id, this.guild.name);
        this.DAL.insertChatLeaderBoard(this.guild.id);
        this.DAL.getLeaderBoardData(this.guild.id).then(
            leaderBoardData => {
                this.leaderBoardData = leaderBoardData;

                this.DAL.getTopUser(this.leaderBoardData.id).then(
                    topUser => {
                        this.topUser = topUser;
                        this._setActivity(this.topUser.user_id);
                    } 
                );
            } 
        );
    }

    onMessage(msg) {
        this.msg = msg;

        if (!this.msg.author.bot) {
            const userId = this.msg.author.id;

            this.DAL.getScore(this.leaderBoardData.id, userId).then((score) => {
                let newScore;

                if (score) {
                    newScore = score.score + 1;
                } else {
                    newScore = 1;
                }
                
                this.DAL.insertScore(this.leaderBoardData.id, newScore, userId, this.msg.author.username);
            });

            this.DAL.getTopUser(this.leaderBoardData.id).then(topUser => {
                const hasTopUserChanged = this.topUser && this.topUser.user_id != topUser.user_id;

                if (hasTopUserChanged) {
                    this.topUser.user_id = topUser.user_id;

                    this._setActivity(topUser.user_id); 
                }
            })
        }

        if (this.msg.content === "r/leaderboard") {
            this._printLeaderBoard();
        }
    }
}

module.exports = Rank;