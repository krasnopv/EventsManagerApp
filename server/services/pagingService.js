import * as mailTemplate from '../config/mail-template';

/**
 * @class
 *
 * @exports
*/
export default class Pagination {
  /**
   * @param {number} currentPage
   *
   * @param {number} totalPage
   *
   * @param {object} pagingData
   *
   * @returns {object} Generate links for next and previous page
   * and dynamic keys respectively for paging metaData
   */
  static generateLinks(currentPage, totalPage, pagingData) {
    let pageData = {};
    const next = `${mailTemplate.getHostname()}/api/v1/centers?page=${currentPage + 1}&limit=${pagingData.limit}`;
    const previous = `${mailTemplate.getHostname()}/api/v1/centers?page=${currentPage - 1}&limit=${pagingData.limit}`;

    if (currentPage === 1) {
      pageData = { ...pagingData, next };
    }
    if (currentPage > 1 && currentPage < totalPage) {
      pageData = { ...pagingData, next, previous };
    }
    if (currentPage === totalPage) {
      pageData = { ...pagingData, previous };
    }
    return pageData;
  }

  /**
   *
   * @param {object} param0
   *
   * @param {array} param0.rows
   *
   * @param {number} param0.count
   *
   * @param {number} limit
   *
   * @param {number} offset
   *
   * @param {number} page
   *
   * @returns {object} meta data for pagination
   */
  static createPagingData({ rows, count }, limit, offset, page) {
    const pages = Math.ceil(count / limit);
    const pagingData = {
      limit,
      offset,
      page,
      pages,
      count,
      currentPageSize: rows.length
    };
    return Pagination.generateLinks(page, pages, pagingData);
  }
}
