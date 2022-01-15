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
        this.guild = guild;
        this.DAL = DAL;
        this.leaderBoardData = {};
        this.topUser = {};
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
            .setFooter({ text: "⭐ Number of messages committed.", iconURL: "" })
    
        this.msg.reply({ 
            embeds: [embed] 
        });
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

    _clearData() {

    }

    _assignRole(leaderBoard, roleName, position) {
        const role = this.guild.roles.cache.find(
            role => role.name.includes(roleName)
        );

        if (role && leaderBoard[position]) {
            this.guild.members.fetch(leaderBoard[position].user_id).then((member) => {
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
        this._clearRole("Famous");
        this._clearRole("Veteran");
        this._clearRole("Advanced");

        /*
        this.DAL.getFirstThreePositions(this.leaderBoardData.id).then(leaderboard => {
            this._assignRole(leaderboard, "Famous", 0);
            this._assignRole(leaderboard, "Veteran", 1);
            this._assignRole(leaderboard, "Advanced", 2);
        });
        */
    }

    _saveDate() {

    }

    _checkIfShouldReset() {
        // 2592000000 ms - 1 Month
        // 604800000 ms - 1 Week
        const shouldReset = Date.now() - this.leaderBoardData.last_reset_ts >= this.leaderBoardData.next_reset_time_offset;
        
        if (true) {
            this._manageRoles();
            this._clearData();
            this._saveDate();
        }
    }

    _watchForResetTime() {
        //3600000 ms - 1 Hour
        //600000 ms - 10 minutes

        setInterval(() => {
            this._checkIfShouldReset();
        }, 5000);
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

                this._watchForResetTime();
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