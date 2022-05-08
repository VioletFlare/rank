const HelpEmbed = require("../Embeds/HelpEmbed.js");

class Help {

    _sendHelpEmbed(params) {
        const model = {
            msg: params.msg
        }

        HelpEmbed.send(model);
    }

    _executeCommand(params) {
        this._sendHelpEmbed(params);
    }

    interceptHelpCommand(params) {
        this._executeCommand(params);
    }

}

module.exports = Help;