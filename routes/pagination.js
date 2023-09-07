class Pagination {
    constructor(total, page, pagelist=10) {
        this.page_list  = pagelist,
        this.total      = parseInt(total),
        this.page       = parseInt(page),
        this.prev_page  = this.page - 1,
        this.next_page  = this.page + 1,
        this.page_count = Math.ceil(this.total / this.page_list),
        this.offset     = this.page > 1 ? this.prev_page * this.page_list : 0,
        this.side_pages = 4,
        this.pages      = false;
    }

    links() {
        let x = 0;
        this.pages = '<ul class="pagination">';

        if(this.prev_page > 0) {
            this.pages += '<li class="page-item" data-page="'+ this.prev_page +'"><</li>';
        }

        if(this.page > 1) {
            for(x = this.page - this.side_pages; x < this.page; x++) {
                if(x > 0) {
                    this.pages += '<li class="page-item" data-page="'+ x +'">'+ x +'</li>';
                }
            }
        }

        this.pages += '<li class="page-item on">'+ this.page +'</li>';

        for(x = this.next_page; x <= this.page_count; x++) {
            this.pages += '<li class="page-item" data-page="'+ x +'">'+ x +'</li>';

            if(x >= this.page + this.side_pages) {
                break;
            }
        }

        if(this.page + 1 <= this.page_count) {
            this.pages += '<li class="page-item" data-page="'+ this.next_page +'">></li>';
        }

        this.pages += '</ul>';

        return this.pages;
    }
}

module.exports = Pagination;