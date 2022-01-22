const Discord = require("discord.js");

/*
    Three roles containing respectively "Famous", "Veteran" and "Advanced" should be present in the server;
    
    1. Famous
    2. Veteran
    3. Advanced

    Are roles assigned respecitvely to the position in the leaderboard every.
*/

class Leaderboard {

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
        if (!leaderBoardRepresentation) {
            leaderBoardRepresentation = "The board just resetted. Try again later!"
        }

        const footer = `
⭐ Number of messages committed.
🏆 Next Awards: ${new Date(this.leaderBoardData.last_reset_ts + this.leaderBoardData.next_reset_time_offset)}
        `
        const embed = new Discord.MessageEmbed()
            .setColor('#DAA520')
            .setTitle("👑 Leader Board                 ")
            .setDescription(leaderBoardRepresentation)
            .setThumbnail('https://i.imgur.com/v5RR3ro.png')
            .setFooter({ text: footer, iconURL: "" })
    
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

    printLeaderBoard() {
        this.DAL.Leaderboard.getLeaderBoard(this.leaderBoardData.id).then(leaderboard => {
            let usersPromises = [];

            leaderboard.forEach(record => {
                usersPromises.push(this.guild.client.users.fetch(record.user_id));
            })

            Promise.all(usersPromises).then(
                users => this._prepareLeaderboard(users, leaderboard)
            );
        });
    }

    _assignRole(leaderBoard, roleName, position) {
        const role = this.guild.roles.cache.find(
            role => role.name.includes(roleName)
        );

        const shouldAssignRole = role && leaderBoard[position] && leaderBoard[position].score != 0;

        if (shouldAssignRole) {
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

    _handleReset() {
        this._clearRole("Famous");
        this._clearRole("Veteran");
        this._clearRole("Advanced");

        this.DAL.Leaderboard.getFirstThreePositions(this.leaderBoardData.id).then(leaderboard => {
            this._assignRole(leaderboard, "Famous", 0);
            this._assignRole(leaderboard, "Veteran", 1);
            this._assignRole(leaderboard, "Advanced", 2);

            this.DAL.Leaderboard.resetLeaderBoard(this.leaderBoardData.id).then(result => {
                //updating leaderboard with fresh data
                this.leaderBoardData = result[0];
            })
        });
    }

    _updateLeaderBoardData() {
        this.DAL.Leaderboard.getLeaderBoardData(this.guild.id).then(
            leaderBoardData => {
                this.leaderBoardData = leaderBoardData;
            } 
        );
    }

    _startWatcher() {
        //3600000 ms - 1 Hour
        //600000 ms - 10 minutes

        setInterval(() => {
            // 2592000000 ms - 1 Month
            // 604800000 ms - 1 Week
            const shouldReset = Date.now() - this.leaderBoardData.last_reset_ts >= this.leaderBoardData.next_reset_time_offset;
            
            if (shouldReset) {
                this._handleReset();
            } else {
                this._updateLeaderBoardData();
            }
        }, 600000);
    }

    init() {
        this.DAL.Leaderboard.insertGuild(this.guild.id, this.guild.name);
        this.DAL.Leaderboard.insertChatLeaderBoard(this.guild.id);
        this.DAL.Leaderboard.getLeaderBoardData(this.guild.id).then(
            leaderBoardData => {
                this.leaderBoardData = leaderBoardData;

                this.DAL.Leaderboard.getTopUser(this.leaderBoardData.id).then(
                    topUser => {
                        if (topUser) {
                            this.topUser = topUser;
                            this._setActivity(this.topUser.user_id);
                        }   
                    } 
                );

                this._startWatcher();
            } 
        );
    }

    onMessageCreate(msg) {
        this.msg = msg;

        if (!this.msg.author.bot) {
            const userId = this.msg.author.id;

            this.DAL.Leaderboard.getScore(this.leaderBoardData.id, userId).then((score) => {
                let newScore;

                if (score) {
                    newScore = score.score + 1;
                } else {
                    newScore = 1;
                }
                
                this.DAL.Leaderboard.insertScore(this.leaderBoardData.id, newScore, userId, this.msg.author.username);
            });

            this.DAL.Leaderboard.getTopUser(this.leaderBoardData.id).then(topUser => {
                const hasTopUserChanged = this.topUser && topUser && this.topUser.user_id != topUser.user_id;

                if (hasTopUserChanged) {
                    this.topUser.user_id = topUser.user_id;

                    this._setActivity(topUser.user_id); 
                }
            })
        }
    }
}

module.exports = Leaderboard;