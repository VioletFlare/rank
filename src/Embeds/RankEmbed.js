const Discord = require("discord.js");

class RankEmbed {

    send(model) {
        const userMention = `<@${model.userId}>`;
        let userAvatarURL = "";
        const mentionedUsers = model.msg.mentions.users;

        if (mentionedUsers.size) {
            const userAvatarId = mentionedUsers.first().avatar;

            userAvatarURL = `https://cdn.discordapp.com/avatars/${model.userId}/${userAvatarId}.webp?size=256`;
        } else {
            userAvatarURL = `https://cdn.discordapp.com/avatars/${model.userId}/${model.msg.author.avatar}.webp?size=256`;
        }
       
        const embed = new Discord.MessageEmbed()
            .setColor('#DAA520')
            .setTitle('Rank')
            .setDescription(`${userMention}`)
            .setThumbnail(userAvatarURL)
        
        let score = "" 
        let rank = ""

        if (!model.rank) {
            score = "No score";
            rank = "No position";
        } else {
            score = String(model.rank.score) + " ⭐";
            rank = String(model.rank.rank);
        }

        embed.addFields(
            { name: 'position', value: rank, inline: true },
            { name: 'score', value: score, inline: true },
        )

        const embedContainer = { 
            embeds: [embed],
        }

        model.msg.reply(embedContainer).catch(
            error => console.error(error)
        );
    }

}

module.exports = new RankEmbed();