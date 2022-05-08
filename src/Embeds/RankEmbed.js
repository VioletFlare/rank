const Discord = require("discord.js");

class ActivityboardEmbed {

    send(model) {
        if (!model.userListRepresentation) {
            model. = "The board just resetted. Try again later!"
        }

        const embed = new Discord.MessageEmbed()
            .setColor('#DAA520')
            .setTitle("🕒 Activity Board                 ")
            .setDescription(model.userListRepresentation)
            .setThumbnail('https://i.imgur.com/v5RR3ro.png')
            .setFooter({ text: footer, iconURL: "" })

        const embedContainer = { 
            embeds: [embed],
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