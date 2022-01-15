const Rank = require('./Rank.js');
const config = require('../config.js');
const Discord = require("discord.js");
const DAL = require("./DataLayer.js");

class InstanceManager {
    
    constructor() {
        this.isDev = process.argv.includes("--dev");
        this.client = new Discord.Client({ 
            partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
            intents: ['DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILDS', 'GUILD_MEMBERS']
        });

        this.sessions = new Map();
    }

    _onMessage(msg) {
        const guildId = msg.guild.id;
        const rank = this.sessions.get(guildId);
        
        if (rank) {
            rank.onMessage(msg)
        }
    }

    _initSessions() {
        if (!this.sessions.size) {
            for (const [guildId, guild] of this.client.guilds.cache.entries()) {
                const rank = new Rank(guild, DAL);
                rank.init();
                this.sessions.set(guildId, rank);
            }
        }
    }

    _initSession(guild) {
        this.sessions.set(guild.id, new Rank(guild));
    }

    _setEvents() {
        this.client.on("ready", () => {
            console.log(`Logged in as ${this.client.user.tag}, id ${this.client.user.id}!`);
            
            this._initSessions();
        });
          
        this.client.on(
            "messageCreate", msg => this._onMessage(msg)
        );

        this.client.on(
            "guildCreate", guild => this._initSession(guild)
        );
    }

    init() {
        if (this.isDev) {
            this.client.login(config.TOKEN_DEV);
        } else {
            this.client.login(config.TOKEN_PROD);
        }

        this._setEvents();
    }

}

module.exports = InstanceManager;


