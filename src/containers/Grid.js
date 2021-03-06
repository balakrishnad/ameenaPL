/* eslint-disable react/prop-types */
import _get from 'lodash/get';
import _isObject from 'lodash/isObject';
import _isString from 'lodash/isString';
import PropTypes from 'prop-types';
import React from 'react';
import { i18next } from '../i18n';
import {
  defaultPageSizes,
  AllItemsPerPage,
  PageSizes,
  Pagination,
} from 'react-formio';
import { UserMessages } from '../config';

function normalizePageSize(pageSize) {
  if (_isObject(pageSize)) {
    return pageSize;
  }

  if (pageSize === AllItemsPerPage) {
    return {
      label: 'All',
      value: 999999,
    };
  }

  return {
    label: pageSize,
    value: pageSize,
  };
}

const renderPagination = ({ pages, onPage }) => pages && onPage;

const renderPageSizeSelector = ({ pageSize, pageSizes, onPageSizeChanged }) =>
  pageSize && pageSizes && pageSizes.length && onPageSizeChanged;

const renderItemCounter = ({ firstItem, lastItem, total }) =>
  firstItem && lastItem && total;

const renderFooter = (props) =>
  renderPagination(props) || renderItemCounter(props);

function Grid(props) {
  const {
    Cell,
    activePage,
    columns,
    emptyText,
    firstItem,
    items,
    lastItem,
    onAction,
    onPage,
    onPageSizeChanged,
    onSort,
    pageNeighbours,
    pageSize,
    pageSizes,
    pages,
    sortOrder,
    total,
  } = props;
  const normalizedPageSizes = pageSizes.map(normalizePageSize);

  return (
      <div className="pep-selectedItem">
          {items.length ? (
              <ul className="list-group list-group-striped">
                  <li className="list-group-item list-group-header hidden-xs hidden-md">
                      <div className="row">
                          {columns.map((column) => {
                const { key, sort = false, title = '', width } = column;
                const className = `col col-md-${ width }`;

                const columnProps = {
                  key,
                  className,
                };

                if (!title) {
                  return <div { ...columnProps } />;
                }

                if (!sort) {
                  return (
                      <div { ...columnProps }>
                          <strong>{i18next.t(title)}</strong>
                      </div>
                  );
                }

                const sortKey = _isString(sort) ? sort : key;
                const ascSort = sortKey;
                const descSort = `-${ sortKey }`;

                let sortClass = '';
                if (sortOrder === ascSort) {
                  sortClass = 'glyphicon glyphicon-triangle-top fa fa-caret-up';
                } else if (sortOrder === descSort) {
                  sortClass =
                    'glyphicon glyphicon-triangle-bottom fa fa-caret-down';
                }
                return (
                    <div { ...columnProps }>
                        <span
                      style={ { cursor: 'pointer' } }
                      onClick={ () => onSort(column) }
                    >
                            <strong>
                                {i18next.t(title)} <span className={ sortClass } />
                            </strong>
                        </span>
                    </div>
                );
              })}
                      </div>
                  </li>
                  {items.map((item) => {
            return (
                <li
                className={ `list-group-item ${
                  item.state && item.state === 'draft' ? 'draft-row' : ''
                }` }
                key={ item._id }
              >
                    <div className="row" onClick={ () => onAction(item, 'row') }>
                        {columns.map((column) => {
                    return (
                        <div
                        key={ column.key }
                        className={ `col col-md-${ column.width } ${
                          column.key === 'operations' ? 'align-center' : ''
                        }` }
                      >
                            <Cell row={ item } column={ column } />
                        </div>
                    );
                  })}
                    </div>
                </li>
            );
          })}
                  {renderFooter(props) ? (
                      <li className="list-group-item">
                          <div className="row align-items-center">
                              {renderPagination(props) ? (
                                  <div className="col-auto">
                                      <div className="row align-items-center">
                                          <div className="col-auto">
                                              <Pagination
                          pages={ pages }
                          activePage={ activePage }
                          pageNeighbours={ pageNeighbours }
                          prev={ i18next.t('Previous') }
                          next={ i18next.t('Next') }
                          onSelect={ onPage }
                        />
                                          </div>
                                          {renderPageSizeSelector(props) ? (
                                              <div className="col-auto">
                                                  <div className="row align-items-center">
                                                      <div className="col-auto">
                                                          <select
                                className="form-control"
                                value={ pageSize }
                                onChange={ (event) =>
                                  onPageSizeChanged(event.target.value)
                                }
                              >
                                                              {normalizedPageSizes.map(({ label, value }) => (
                                                                  <option key={ value } value={ value }>
                                                                      {i18next.t(label)}
                                                                  </option>
                                ))}
                                                          </select>
                                                      </div>
                                                      <span className="col-auto">
                                                          {i18next.t('items per page')}
                                                      </span>
                                                  </div>
                                              </div>
                      ) : null}
                                      </div>
                                  </div>
                ) : null}
                              {renderItemCounter(props) ? (
                                  <div className="col-auto ml-auto">
                                      <span className="item-counter pull-right">
                                          <span className="page-num">
                                              {firstItem} - {lastItem}
                                          </span>{' '}
                                          / {total} {i18next.t('total')}
                                      </span>
                                  </div>
                ) : null}
                          </div>
                      </li>
          ) : null}
              </ul>
      ) : (
          <div className="pep-norecords">{i18next.t(emptyText)}</div>
      )}
      </div>
  );
}

Grid.propTypes = {
  Cell: PropTypes.func,
  activePage: PropTypes.number,
  columns: PropTypes.array.isRequired,
  emptyText: PropTypes.string,
  firstItem: PropTypes.number,
  items: PropTypes.array.isRequired,
  lastItem: PropTypes.number,
  onAction: PropTypes.func,
  onPage: PropTypes.func,
  onPageSizeChanged: PropTypes.func,
  onSort: PropTypes.func,
  pageNeighbours: PropTypes.number,
  pageSize: PropTypes.number,
  pageSizes: PageSizes,
  pages: PropTypes.number,
  sortOrder: PropTypes.string,
  total: PropTypes.number
};

Grid.defaultProps = {
  Cell: ({ column, row }) => <span>{_get(row, column.key, '')}</span>,
  activePage: 1,
  emptyText: UserMessages.NO_RECORDS,
  firstItem: 0,
  lastItem: 0,
  onAction: () => {},
  onPage: () => {},
  onPageSizeChanged: () => {},
  onSort: () => {},
  pageNeighbours: 1,
  pageSize: 0,
  pageSizes: defaultPageSizes,
  pages: 0,
  sortOrder: '',
  total: 0,
};

export default Grid;
