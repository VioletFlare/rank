class CommandParser {

    parse(command) {
        let splittedCommand = this._splitCommand(msg);
        splittedCommand = splittedCommand.filter(string => string !== "" && string !== " ");
        const prefix = splittedCommand[0] ? splittedCommand[0].toLowerCase() : "";
        
        let result = {};

        if (prefix.includes(this.prefix)) {
          const commandNameSplitted = splittedCommand[0].split("/");
          result.command = commandNameSplitted[1] ? commandNameSplitted[1].toLowerCase() : "";
        }
    }
}