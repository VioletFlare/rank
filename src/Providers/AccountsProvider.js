class AccountsProvider {

    constructor(guild, DAL) {
        this.DAL = DAL;
        this.guild = guild;
    }

    incrementCookies(guildId, userId, value) {
        this.DAL.Accounts.getCookies(guildId, userId).then((cookies) => {
            let newCookiesAmount;

            if (cookies) {
                newCookiesAmount = cookies.cookies + value;
            } else {
                newCookiesAmount = value;
            }

            try {
                this.guild.members.fetch(userId).then(user => {
                    this.DAL.Accounts.insertCookies(guildId, newCookiesAmount, userId, user.user.username);
                })
                .catch(
                    error => console.error(error)
                );
            } catch (e) {
                console.error("Couldn't Increment Cookies \n", e);
            }
        });
    }

    getCookies(guildId, userId) {
        return this.DAL.Accounts.getCookies(guildId, userId).then(cookies => {
            if (cookies && cookies.cookies) {
                return cookies.cookies;
            } else {
                return 0;
            }
        });
    }

    isEconomyEnabled() {
        return this.DAL.Accounts.isAccountsTableInDatabase().then((result) => {
            const isEnabled = Object.values(result)[0];
            
            if (isEnabled === 1) {
                return true;
            } else {
                return false;
            }

        });
    }

}

module.exports = AccountsProvider;