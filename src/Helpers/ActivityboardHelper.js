class ActivityboardHelper {

    constructor (guild) {
        this.guild = guild;
    }

    requestUserListRepresentation(leastActiveMembers) {
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

}

module.exports = ActivityboardHelper;