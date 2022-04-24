class ActivityboardHelper {

    constructor (guild) {
        this.guild = guild;
    }

    _constructLeastActiveUsersBoardTable(leastActiveMembers) {
        let userListRepresentation = "";

        leastActiveMembers = leastActiveMembers.slice(0, 10);

        leastActiveMembers.forEach((member, index) => {
            const mention = `<@${member.user.id}>`;

            let lastActive = "";

            if (member.user.activity) {
                lastActive = new Date(member.user.activity.latestActivityTimestamp).toLocaleString("en-GB"); 
            } else {
                lastActive = "Never";
            }

            lastActive = lastActive.padEnd(20, " ");

            userListRepresentation += `\`${lastActive} ⌛ \`${mention}\n`;
        });

        return userListRepresentation;
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

    prepareLeastActiveUsersBoard(leastActiveUsers) {
        return this.guild.members.fetch().then(allMembers => {
            const realMembers = new Map();

            allMembers.forEach((member, key) => {
                if (!member.user.bot) {
                    realMembers.set(key, member);
                }
            });

            leastActiveUsers.forEach(
                user => this._enrichRealMembers(realMembers, user)
            );

            const leastActiveMembers = [];

            realMembers.forEach(
                member => leastActiveMembers.push(member)
            );

            leastActiveMembers.sort(
                (m1, m2) => this._compareLeastActiveMembers(m1, m2)
            );

            return this._constructLeastActiveUsersBoardTable(leastActiveMembers);
        });
    }

}

module.exports = ActivityboardHelper;