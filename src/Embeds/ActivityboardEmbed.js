const Discord = require("discord.js");

class ActivityboardEmbed {

    send(model) {
        if (!model.userListRepresentation) {
            model.userListRepresentation = "The board just resetted. Try again later!"
        }

        const timezone = new Date().toString().match(/([A-Z]+[\+-][0-9]+.*)/)[1];
        const footer = `
⌛ Time the user was last active.
🌐 Timezone: ${timezone}
        `
        const embed = new Discord.MessageEmbed()
            .setColor('#DAA520')
            .setTitle("🕒 Activity Board                 ")
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
                            custom_id: "ActivityboardEmbed::PrevPage"
                        },
                        {
                            type: 2,
                            style: 2,
                            label: ">>>",
                            // Our button id, we can use that later to identify,
                            // that the user has clicked this specific button
                            custom_id: "ActivityboardEmbed::NextPage"
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

module.exports = new ActivityboardEmbed();