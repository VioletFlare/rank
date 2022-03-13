const Rank = require('./Rank.js');
const config = require('../config.js');
const Discord = require("discord.js");
const DAL = require("./DAL/DataLayer.js");

class InstanceManager {
    
    constructor() {
        this.isDev = process.argv.includes("--dev");
        this.client = new Discord.Client({ 
            partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
            intents: ['DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILDS', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES']
        });

        this.sessions = new Map();
    }

    _onMessageCreate(msg) {
        const guildId = msg.guild.id;
        const rank = this.sessions.get(guildId);
        
        if (rank) {
            rank.onMessageCreate(msg)
        }
    }

    _onMessageReactionAdd(reaction, user) {
        const guildId = reaction.message.guildId;
        const rank = this.sessions.get(guildId);

        if (rank) {
            rank.onMessageReactionAdd(reaction, user);
        }
    }

    _onInteractionCreate(interaction) {
        const guildId = interaction.guildId;
        const rank = this.sessions.get(guildId);

        if (rank) {
            rank.onInteractionCreate(interaction);
        }
    }

    _onVoiceStateUpdate(oldVoiceState, newVoiceState) {
        const guildId = newVoiceState.guild.id;
        const rank = this.sessions.get(guildId);

        if (rank) {
            rank.onVoiceStateUpdate(oldVoiceState, newVoiceState);
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
        const rank = new Rank(guild, DAL);
        rank.init();
        this.sessions.set(guild.id, rank);
    }

    _setEvents() {
        this.client.on("ready", () => {
            console.log(`Logged in as ${this.client.user.tag}, id ${this.client.user.id}!`);
            
            this._initSessions();
        });
          
        this.client.on(
            "messageCreate", msg => this._onMessageCreate(msg)
        );

        this.client.on(
            "messageReactionAdd", (reaction, user) => this._onMessageReactionAdd(reaction, user)
        )

        this.client.on(
            "voiceStateUpdate", (oldVoiceState, newVoiceState) => this._onVoiceStateUpdate(oldVoiceState, newVoiceState)
        )

        this.client.on(
            'interactionCreate', interaction => this._onInteractionCreate(interaction)
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


