const Discord = require("discord.js");

class LeaderboardEmbed {

    send(model) {
        if (!model.userListRepresentation) {
            model.userListRepresentation = "The board just resetted. Try again later!"
        }

        const footer = `
⭐ Number of messages committed.
🏆 Next Awards: ${new Date(model.leaderBoardData.last_reset_ts + model.leaderBoardData.next_reset_time_offset)}
        `
        const embed = new Discord.MessageEmbed()
            .setColor('#DAA520')
            .setTitle("👑 Leader Board                 ")
            .setDescription(model.userListRepresentation)
            .setThumbnail('https://i.imgur.com/v5RR3ro.png')
            .setFooter({ text: footer, iconURL: "" })

        const embedContainer = { 
            embeds: [embed],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 2,
                            label: "<<<",
                            // Our button id, we can use that later to identify,
                            // that the user has clicked this specific button
                            custom_id: "LeaderboardEmbed::PrevPage"
                        },
                        {
                            type: 2,
                            style: 2,
                            label: ">>>",
                            // Our button id, we can use that later to identify,
                            // that the user has clicked this specific button
                            custom_id: "LeaderboardEmbed::NextPage"
                        }
                    ]
                }
            ],
        }

        if (model.isNewMessage) {
            model.msg.reply(embedContainer).catch(
                error => console.error(error)
            );
        } else {
            model.msg.edit(embedContainer).catch(
                error => console.error(error)
            )
        }

    }

}

module.exports = new LeaderboardEmbed();
