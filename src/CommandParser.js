class CommandParser {

    constructor(prefix) {
        this.prefix = prefix;
    }

    _splitCommand(msg) {
        const indexOfFirstSpaceOccurrence = msg.content.indexOf(" ");
        const firstPartOfCommand = msg.content.substring(0, indexOfFirstSpaceOccurrence);
        const lastPartOfCommand = msg.content.substring(indexOfFirstSpaceOccurrence + 1, msg.content.length);
        const splittedCommand = [firstPartOfCommand, lastPartOfCommand];
    
        return splittedCommand;
    }

    _replaceMentions(splittedCommand) {
        const matchUserMention = /<@([0-9])+>/g;

        splittedCommand.forEach((el, index) => {
            const isUserMention = el.match(matchUserMention);

            if (isUserMention) {
                splittedCommand[index] = 
                    splittedCommand[index]
                        .replace("<@", "")
                        .replace(">", "");
            }
        })
    }

    parse(msg) {
        let splittedCommand = this._splitCommand(msg);
        splittedCommand = splittedCommand.filter(string => string !== "" && string !== " ");
        const prefix = splittedCommand[0] ? splittedCommand[0].toLowerCase() : "";
        
        let result;

        if (prefix.includes(this.prefix)) {
          result = {};
          const commandNameSplitted = splittedCommand[0].split("/");
          splittedCommand.shift();
          this._replaceMentions(splittedCommand);

          result.command = commandNameSplitted[1] ? commandNameSplitted[1].toLowerCase() : "";
          result.args = splittedCommand;
        } else {
            result = null;
        }

        return result;
    }
}

module.exports = CommandParser;