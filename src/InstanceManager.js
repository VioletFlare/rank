const Instance = require('./Instance.js');
const config = require('../config.js');
const Discord = require("discord.js");
const DAL = require("./DAL/DataLayer.js");
const CommandParser = require("./CommandParser.js");

class InstanceManager {
    
    constructor() {
        this.isDev = process.argv.includes("--dev");
        this.client = new Discord.Client({ 
            partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
            intents: ['DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILDS', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES']
        });

        this.sessions = new Map();
        this.commandParser = new CommandParser("r");
    }

    _onMessageCreate(msg) {
        const guildId = msg.guild.id;
        const instance = this.sessions.get(guildId);
        
        if (instance) {
            const command = this.commandParser.parse(msg);

            instance.onMessageCreate(msg, command)
        }
    }

    _onMessageReactionAdd(reaction, user) {
        const guildId = reaction.message.guildId;
        const instance = this.sessions.get(guildId);

        if (instance) {
            instance.onMessageReactionAdd(reaction, user);
        }
    }

    _onInteractionCreate(interaction) {
        const guildId = interaction.guildId;
        const instance = this.sessions.get(guildId);

        if (instance) {
            instance.onInteractionCreate(interaction);
        }
    }

    _onVoiceStateUpdate(oldVoiceState, newVoiceState) {
        const guildId = newVoiceState.guild.id;
        const instance = this.sessions.get(guildId);

        if (instance) {
            instance.onVoiceStateUpdate(oldVoiceState, newVoiceState);
        }
    }

    _initSessions() {
        if (!this.sessions.size) {
            for (const [guildId, guild] of this.client.guilds.cache.entries()) {
                const instance = new Instance(guild, DAL);
                instance.init();
                this.sessions.set(guildId, instance);
            }
        }
    }

    _initSession(guild) {
        const instance = new Instance(guild, DAL);
        instance.init();
        this.sessions.set(guild.id, instance);
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


