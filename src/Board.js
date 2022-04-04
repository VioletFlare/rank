class Board {

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

}

module.exports = Board;