const Board = require("./Board.js");
const LeaderBoardHelper = require("./Helpers/LeaderboardHelper.js");
const LeaderboardEmbed = require("./Embeds/LeaderboardEmbed.js");

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

        this.messagePage = {};
    }

    _sendLeaderBoardEmbed(userListRepresentation, params) {
        const model = {
            msg: params.msg,
            userListRepresentation: userListRepresentation,
            leaderBoardData: this.leaderBoardData,
            isNewMessage: params.isNewMessage,
            numberOfPages: params.numberOfPages,
            page: params.page
        }
        
        LeaderboardEmbed.send(model);
        
    }

    _handleValidRequest(params) {
        const offset = super.calculateOffset(params.page);
    
        this.DAL.Leaderboard.getLeaderBoard(this.leaderBoardData.id, offset)
        .then(
            leaderboard => this.leaderBoardHelper.requestUserListRepresentation(leaderboard, offset)
        ).then(
            userListRepresentation => this._sendLeaderBoardEmbed(userListRepresentation, params)
        );
    }

    _executeCommand(params) {
        const command = this.DAL.Leaderboard.getNumberOfPages(this.leaderBoardData.id).then((numberOfPages) => {
            let result;

            if (numberOfPages === 0) numberOfPages = 1;

            const isRequestedPageValid = params.page <= numberOfPages && params.page >= 1;

            if (isRequestedPageValid) {
                params.numberOfPages = numberOfPages; 
                this._handleValidRequest(params);
                result = Promise.resolve(true);
            } else {
                result = Promise.resolve(false);
            }

            return result;
        })

        return command;
    }

    interceptLeaderBoardCommand(params) {
        if (params.isNewMessage) {
            this.messagePage[params.msg.id] = params.page;
        }

        const command = this._executeCommand(params);

        return command;
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

    onMessageCreate(msg) {
        this.msg = msg;

        if (!this.msg.author.bot) {
            this._updateScore();
        }
    }

    _navigate(interaction) {
        super.navigate(
            interaction,
            params => this.interceptLeaderBoardCommand(params)
        );
    }

    onInteractionCreate(interaction) {
        const scope = interaction.customId.split("::")[0];

        if (scope === "LeaderboardEmbed") {
            this._navigate(interaction);
        }
    }

    init() {
        this.DAL.Leaderboard.insertChatLeaderBoard(this.guild.id);
        this.DAL.Leaderboard.getLeaderBoardData(this.guild.id).then(
            leaderBoardData => {
                this.leaderBoardData = leaderBoardData;

                this._startWatcher();
            } 
        );

        this.leaderBoardHelper = new LeaderBoardHelper(this.guild);
    }
}

module.exports = Leaderboard;