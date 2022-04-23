const LeaderboardEmbed = require("./Embeds/LeaderboardEmbed.js");
const Board = require("./Board.js");

/*
    Three roles containing respectively "Famous", "Veteran" and "Advanced" should be present in the server;
    
    1. Famous
    2. Veteran
    3. Advanced

    Are roles assigned respecitvely to the position in the leaderboard every.
*/

class Leaderboard extends Board {

    constructor(guild, DAL) {
        super();
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

    _prepareLeaderboard(users, leaderboard, page, msg, isNewMessage) {
        let leaderBoardRepresentation = "";

        users.forEach((user, index) => {
            const member = this.guild.members.cache.find(
                member => member.user.id === user.id 
            );

            let username;

            if (member && member.nickname) {
                username = member.nickname;
            } else {
                username = user.username;
            }

            const offset = this.calculateOffset(page);

            const position = index + 1; 
            const positionUsername = `${offset + position}. ${username}`.padEnd(32, " ");
            const msgCount = leaderboard[index].score.toString().padEnd(6, " ");
            
            leaderBoardRepresentation += `\`${positionUsername} ⭐ ${msgCount}\`\n`;
        })

        const model = {
            msg: msg,
            leaderBoardRepresentation: leaderBoardRepresentation,
            leaderBoardData: this.leaderBoardData,
            isNewMessage: isNewMessage
        }
        
        LeaderboardEmbed.send(model);
        
    }

    printLeaderBoard(page, msg, isNewMessage) {

        if (isNewMessage) {
            this.messagePage[msg.id] = page;
        }

        const offset = this.calculateOffset(page);
        
        this.DAL.Leaderboard.getLeaderBoard(this.leaderBoardData.id, offset).then(leaderboard => {
            let usersPromises = [];

            leaderboard.forEach(record => {
                usersPromises.push(this.guild.client.users.fetch(record.user_id));
            })

            Promise.all(usersPromises).then(
                users => this._prepareLeaderboard(users, leaderboard, page, msg, isNewMessage)
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
                member.roles
                .add(role)
                .catch(
                    error => console.error(error)
                );
            });
        }
    }

    _clearRole(roleName) {
        const role = this.guild.roles.cache.find(
            role => role.name.includes(roleName)
        );

        if (role) {
            role.members.forEach(user => {
                user.roles
                .remove(role)
                .catch(
                    error => console.error(error)
                );
            });
        }
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

    _updateScore() {
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
    }

    _updateStatus() {
        this.DAL.Leaderboard.getTopUser(this.leaderBoardData.id).then(topUser => {
            const hasTopUserChanged = this.topUser && topUser && this.topUser.user_id != topUser.user_id;

            if (hasTopUserChanged) {
                this.topUser.user_id = topUser.user_id;

                this._setActivity(topUser.user_id); 
            }
        })
    }

    onMessageCreate(msg) {
        this.msg = msg;

        if (!this.msg.author.bot) {
            this._updateScore();
            this._updateStatus();
        }
    }

    _navigate(interaction, isNextPage) {
       const messageId = interaction.message.reference.messageId;
       const currentPage = this.messagePage[messageId];

       if (currentPage < 10 && isNextPage) {
        this.messagePage[messageId] = currentPage + 1;
       } else if (currentPage >= 1 && !isNextPage) {
        this.messagePage[messageId] = currentPage - 1;
       }

       if (currentPage) {
        this.printLeaderBoard(super.messagePage[messageId], interaction.message, false)
        interaction.deferUpdate();
       } 
    }

    onInteractionCreate(interaction) {
        switch (interaction.customId) {
            case 'LeaderboardEmbed::NextPage':
                this._navigate(interaction, true);
            break;
            case 'LeaderboardEmbed::PrevPage':
                this._navigate(interaction, false);
            break;
        }
    }
}

module.exports = Leaderboard;