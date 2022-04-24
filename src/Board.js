class Board {

    constructor() {
        this.messagePage = {};
    }

    calculateOffset(page) {
        const isFirstPage = !page || page <= 1;
        let offset;

        if (isFirstPage) {
            offset = 0;
        } else {
            offset = 10 * (page - 1);
        }

        return offset;
    }

    navigate(interaction, callback) {
        const event = interaction.customId.split("::")[1];

        const navigationParams = {
            interaction: interaction,

        }

        switch(event) {
            case 'NextPage':
                navigationParams.isNextPage = true;
                this._navigateTo(navigationParams, callback);
            break;
            case 'PrevPage':
                navigationParams.isNextPage = false;
                this._navigateTo(navigationParams, callback);
            break;
        }

    }

    _executeCommand(params) {
        if (params.isNewMessage) {
            this.messagePage[params.msg.id] = params.page;
        }
    }

    _getCurrentPage(navigationParams) {
        let currentPage = this.messagePage[navigationParams.interaction.message.reference.messageId];
 
        if (navigationParams.isNextPage) {
         currentPage = currentPage + 1;
        } else if (!navigationParams.isNextPage && currentPage >= 0) {
         currentPage = currentPage - 1;
        }

        return currentPage;
    }

    _handleInteraction(result, navigationParams) {
        navigationParams.interaction.deferUpdate().catch(
            error => console.error(error)
        )

        if (result) {
            this.messagePage[navigationParams.interaction.message.reference.messageId] = this._getCurrentPage(navigationParams);
        }
    }

    _navigateTo(navigationParams, callback) {
        const currentPage = this._getCurrentPage(navigationParams)

        if (currentPage >= 0) {
            const params = {
                msg: navigationParams.interaction.message, 
                page: currentPage, 
                isNewMessage: false
            }

            callback(params).then(
                (result) => this._handleInteraction(result, navigationParams)
            );
        }
    }

}

module.exports = Board;