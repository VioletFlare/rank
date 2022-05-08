const Discord = require("discord.js");

class HelpEmbed {

    send(model) {
        const examples = `
\`\`\`
r/help
r/leaderboard
r/rank @mention
\`\`\`
`
        const embed = new Discord.MessageEmbed()
            .setColor('#DAA520')
            .setTitle("❓ Help             ")
            .addFields(
                { name: 'help', value: 'Show this message.', inline: true },
                { name: 'leaderboard', value: 'Show the top message writers on the server during the current period.', inline: true },
                { name: 'leastactive', value: 'Show who has been active in the server, starting from the least active.', inline: true },
                { name: 'rank', value: 'Show the rank of the mentioned user.', inline: true },
                { name: 'usage examples:', value: examples}
              )
            .setThumbnail('https://i.imgur.com/v5RR3ro.png')
            .setFooter({ text: 'Author: \\ (Barretta)', iconURL: 'https://i.imgur.com/lyv8H8C.png' });

        const embedContainer = { 
            embeds: [embed],
        }

        model.msg.reply(embedContainer).catch(
            error => console.error(error)
        );
    }

}

module.exports = new HelpEmbed();