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
        } else if (currentPage >= 1 && !isNextPage) {
         this.messagePage[messageId] = currentPage - 1;
        }

        if (currentPage) {
            interaction.deferUpdate();
            callback(
                    this.messagePage[messageId],
                    interaction.message,
                    false
            );
        }
    }

}

module.exports = Board;