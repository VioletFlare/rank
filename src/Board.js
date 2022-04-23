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

    navigate(interaction, isNextPage, callback) {
        const messageId = interaction.message.reference.messageId;
        const currentPage = this.messagePage[messageId];
 
        if (currentPage < 10 && isNextPage) {
         this.messagePage[messageId] = currentPage + 1;
        } else if (currentPage > 1 && !isNextPage) {
         this.messagePage[messageId] = currentPage - 1;
        }

        if (currentPage) {
            const params = {
                msg: interaction.message, 
                page: this.messagePage[messageId], 
                isNewMessage: false
            }

            callback(params).then(
                () => interaction.deferUpdate().catch(
                    error => console.error(error)
                )
            );
        }
    }

}

module.exports = Board;