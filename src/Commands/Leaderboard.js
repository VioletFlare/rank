const Board = require("./Board.js");
const LeaderBoardHelper = require("../Helpers/LeaderboardHelper.js");
const LeaderboardEmbed = require("../Embeds/LeaderboardEmbed.js");
const AccountsProvider = require("../Providers/AccountsProvider");

/*
    Three roles containing respectively "Famous", "Veteran" and "Advanced" should be present in the server;
    
    1. Famous
    2. Veteran
    3. Advanced

    Are roles assigned respecitvely to the position in the leaderboard every.
*/

class Leaderboard extends Board {

    constructor(guild, DAL, storage) {
        super();
        this.guild = guild;
        this.DAL = DAL;
        this.storage = storage;
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
            }).catch(
                error => console.error(error)
            );
        }
    }

    _awardCookie(leaderBoard, cookies, position) {
        const shouldAwardCookies = leaderBoard[position] && leaderBoard[position].score != 0;

        if (shouldAwardCookies) {
            const userId = leaderBoard[position].user_id;

            this.AccountsProvider.incrementCookies(this.guild.id, userId, cookies);
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

    _resetRoles() {
        const promise = this.guild.members.fetch().then(() => {
            this._clearRole("Famous");
            this._clearRole("Veteran");
            this._clearRole("Advanced");
        });

        return promise;
    }

    _assingRoles(leaderboard) {
        this._assignRole(leaderboard, "Famous", 0);
        this._assignRole(leaderboard, "Veteran", 1);
        this._assignRole(leaderboard, "Advanced", 2);
    }

    _awardCookies(leaderboard) {
        if (this.storage.isEconomyEnabled) {
            this._awardCookie(leaderboard, 15, 0);
            this._awardCookie(leaderboard, 10, 1);
            this._awardCookie(leaderboard, 5, 2);
        }
    }

    _applyChanges() {
        const promise = this.DAL.Leaderboard.getFirstThreePositions(this.storage.leaderBoardData.id).then(leaderboard => {
            this._assingRoles(leaderboard);
            this._awardCookies(leaderboard);

            this.DAL.Leaderboard.resetLeaderBoard(this.storage.leaderBoardData.id).then(result => {
                //updating leaderboard with fresh data
                this.storage.leaderBoardData = result[0];
            })
        });

        return promise;
    }

    _handleReset() {
        this._resetRoles()
            .then(
                () => this._applyChanges()
            )

        this.messagePage = {};
    }

    _sendLeaderBoardEmbed(userListRepresentation, params) {
        const model = {
            msg: params.msg,
            userListRepresentation: userListRepresentation,
            leaderBoardData: this.storage.leaderBoardData,
            isNewMessage: params.isNewMessage,
            numberOfPages: params.numberOfPages,
            page: params.page
        }
        
        LeaderboardEmbed.send(model);
        
    }

    _handleValidRequest(params) {
        const offset = super.calculateOffset(params.page);
    
        this.DAL.Leaderboard.getLeaderBoard(this.storage.leaderBoardData.id, offset)
        .then(
            leaderboard => this.leaderBoardHelper.requestUserListRepresentation(leaderboard, offset)
        ).then(
            userListRepresentation => this._sendLeaderBoardEmbed(userListRepresentation, params)
        );
    }

    _executeCommand(params) {
        super._executeCommand(params);

        const command = this.DAL.Leaderboard.getNumberOfPages(this.storage.leaderBoardData.id).then((numberOfPages) => {
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
        const command = this._executeCommand(params);

        return command;
    }

    _updateLeaderBoardData() {
        this.DAL.Leaderboard.getLeaderBoardData(this.guild.id).then(
            leaderBoardData => {
                this.storage.leaderBoardData = leaderBoardData;
            } 
        );
    }

    _startWatcher() {
        //3600000 ms - 1 Hour
        //600000 ms - 10 minutes

        setInterval(() => {
            // 2592000000 ms - 1 Month
            // 604800000 ms - 1 Week
            const shouldReset = Date.now() - this.storage.leaderBoardData.last_reset_ts >= this.storage.leaderBoardData.next_reset_time_offset;
            
            if (shouldReset) {
                this._handleReset();
            } else {
                this._updateLeaderBoardData();
            }
        }, 600000);
    }

    _updateScore() {
        const userId = this.msg.author.id;

        this.DAL.Leaderboard.getScore(this.storage.leaderBoardData.id, userId).then((score) => {
            let newScore;

            if (score) {
                newScore = score.score + 1;
            } else {
                newScore = 1;
            }
            
            this.DAL.Leaderboard.insertScore(this.storage.leaderBoardData.id, newScore, userId, this.msg.author.username);
        });
    }

    onMessageCreate(msg) {
        this.msg = msg;

        if (!this.msg.author.bot) {
            this._updateScore();
        }
    }

    onInteractionCreate(interaction) {
        super.navigate(
            interaction,
            params => this.interceptLeaderBoardCommand(params)
        );
    }

    init() {
        this.DAL.Leaderboard.insertChatLeaderBoard(this.guild.id);
        this.DAL.Leaderboard.getLeaderBoardData(this.guild.id).then(
            leaderBoardData => {
                this.storage.leaderBoardData = leaderBoardData;

                this._startWatcher();
            } 
        );

        this.leaderBoardHelper = new LeaderBoardHelper(this.guild);
        this.AccountsProvider = new AccountsProvider(this.guild, this.DAL);

        this.AccountsProvider.isEconomyEnabled().then(isEnabled => {
            this.storage.isEconomyEnabled = isEnabled;
        });
    }
}

module.exports = Leaderboard;