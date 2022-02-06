const Discord = require("discord.js");

class Activityboard {
    constructor(guild, DAL) {
        this.guild = guild;
        this.DAL = DAL;
        this.activityBoardData = {};
    }

    init() {
        this.DAL.Activityboard.insertActivityBoard(this.guild.id);
        this.DAL.Activityboard.getActivityBoardData(this.guild.id).then(
            activityBoardData => {
                this.activityBoardData = activityBoardData;
            } 
        );
    }

    onMessageCreate(msg) {
        this.msg = msg;

        if (!msg.author.bot) {
            this.DAL.Activityboard.insertLastMessageRecord(
                this.activityBoardData.id, 
                msg.author.id, 
                msg.author.username
            );
        }
    }

    onMessageReactionAdd(reaction, user) {
        if (!user.bot) {
            this.DAL.Activityboard.insertLastReactionRecord(
                this.activityBoardData.id, 
                user.id, 
                user.username
            )
        }
    }

    onVoiceStateUpdate(oldVoiceState, newVoiceState) {
        if (!newVoiceState.member.user.bot) {
            this.DAL.Activityboard.insertLastVoiceActivityRecord(
                this.activityBoardData.id, 
                newVoiceState.member.user.id, 
                newVoiceState.member.user.username
            )
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

    _sendLeastActiveUsersBoardEmbed(leaderBoardRepresentation) {
        if (!leaderBoardRepresentation) {
            leaderBoardRepresentation = "The board just resetted. Try again later!"
        }

        const timezone = new Date().toString().match(/([A-Z]+[\+-][0-9]+.*)/)[1];
        const footer = `
⌛ Time the user was last active.
🌐 Timezone: ${timezone}
        `
        const embed = new Discord.MessageEmbed()
            .setColor('#DAA520')
            .setTitle("🕒 Activity Board                 ")
            .setDescription(leaderBoardRepresentation)
            .setThumbnail('https://i.imgur.com/v5RR3ro.png')
            .setFooter({ text: footer, iconURL: "" })
    
        this.msg.reply({ 
            embeds: [embed] 
        }).catch(
            error => console.error(error)
        );
    }

    _constructLeastActiveUsersBoardTable(leastActiveMembers) {
        let leaderBoardRepresentation = "";

        leastActiveMembers = leastActiveMembers.slice(0, 10);

        leastActiveMembers.forEach((member, index) => {
            let mention =  `<@${member.user.id}>`;

            let lastActive = "";

            if (member.user.activity) {
                lastActive = new Date(member.user.activity.latestActivityTimestamp).toLocaleString("en-GB"); 
            } else {
                lastActive = "Never";
            }

            lastActive = lastActive.padEnd(20, " ");

            leaderBoardRepresentation += `\`${lastActive} ⌛ \`${mention}\n`;
        });

        this._sendLeastActiveUsersBoardEmbed(leaderBoardRepresentation);
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

    _prepareLeastActiveUsersBoard(leastActiveUsers) {
        this.guild.members.fetch().then(allMembers => {
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

            this._constructLeastActiveUsersBoardTable(leastActiveMembers);
        });
    }

    printLeastActiveUsersBoard() {
        this.DAL.Activityboard.getLeastActiveUsers(this.activityBoardData.id).then(
            leastActiveUsers => {
                this._prepareLeastActiveUsersBoard(leastActiveUsers)
            }
        )
    }
}

module.exports = Activityboard;