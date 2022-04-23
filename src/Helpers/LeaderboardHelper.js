class LeaderboardHelper {

    constructor(guild) {
        this.guild = guild;
    }

    _buildUserListRepresentation(users, leaderboard, offset) {
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

            const position = index + 1; 
            const positionUsername = `${offset + position}. ${username}`.padEnd(32, " ");
            const msgCount = leaderboard[index].score.toString().padEnd(6, " ");
            
            leaderBoardRepresentation += `\`${positionUsername} ⭐ ${msgCount}\`\n`;
        })

        return leaderBoardRepresentation;
    }


    requestUserListRepresentation(leaderboard, offset) {
        let usersPromises = [];

        leaderboard.forEach(record => {
            usersPromises.push(this.guild.client.users.fetch(record.user_id));
        })

        const userListRepresentation = Promise.all(usersPromises).then(
            users => this._buildUserListRepresentation(users, leaderboard, offset)
        );

        return userListRepresentation;
    } 

}

module.exports = LeaderboardHelper;