class ActivityboardProvider {

    constructor(guild, DAL) {
        this.DAL = DAL;
        this.guild = guild;
    }

    _compareLeastActiveMembers(m1, m2) {
        if (m1.user.activity && m2.user.activity) {
            return m1.user.activity.latestActivityTimestamp - m2.user.activity.latestActivityTimestamp;
        } else if (m1.user.activity) {
            return 1;
        } else if (m2.user.activity) {
            return -1;
        } else {
            return 0;
        }
    }

    _enrichRealMembers(realMembers, user) {
        const member = realMembers.get(user.user_id);

        if (member) {
            member.user.activity = {};
            member.user.activity.lastMessageTimestamp = user.last_message_ts;
            member.user.activity.lastReactionTimestamp = user.last_reaction_ts;
            member.user.activity.lastVoiceActiveTimestamp = user.last_voice_active_ts;
            member.user.activity.latestActivityTimestamp = user.latest_activity_ts;

            realMembers.set(user.user_id, member);
        }
    }

    _getRealMembers(guildMembers, leastActiveUsers) {
        const realMembers = new Map();

        guildMembers.forEach((member, key) => {
            if (!member.user.bot) {
                realMembers.set(key, member);
            }
        });

        leastActiveUsers.forEach(
            user => this._enrichRealMembers(realMembers, user)
        );

        return realMembers;
    }


    _getLeastActiveRealMembers(leastActiveUsers) {
        return this.guild.members.fetch().then(guildMembers => {
            const realMembers = this._getRealMembers(guildMembers, leastActiveUsers);

            const leastActiveMembers = [];

            realMembers.forEach(
                member => leastActiveMembers.push(member)
            );

            leastActiveMembers.sort(
                (m1, m2) => this._compareLeastActiveMembers(m1, m2)
            );
            
            return leastActiveMembers;
        });
    }

    getLeastActiveRealMembers(activityBoardId) {
        return this.DAL.Activityboard.getLeastActiveUsers(activityBoardId).then(
            leastActiveUsers => this._getLeastActiveRealMembers(leastActiveUsers)
        );
    }

}

module.exports = ActivityboardProvider;