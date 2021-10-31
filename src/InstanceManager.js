const Rank = require('./Rank.js');
const config = require('../config.js');
const Discord = require("discord.js");
const fs = require('fs');

class InstanceManager {
    
    constructor() {
        this.isDev = process.argv.includes("--dev");
        this.client = new Discord.Client();
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
            for (const [key, value] of this.client.guilds.cache.entries()) {
                this.sessions.set(key, new Rank(value));
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
            "message", msg => this._onMessage(msg)
        );

        this.client.on(
            "guildCreate", guild => this._initSession(guild)
        );
    }

    _createDataDir() {        
        const dir = './data';

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
    }

    init() {
        if (this.isDev) {
            this.client.login(config.TOKEN_DEV);
        } else {
            this.client.login(config.TOKEN_PROD);
        }

        this._setEvents();
        this._createDataDir();
    }

}

module.exports = InstanceManager;


