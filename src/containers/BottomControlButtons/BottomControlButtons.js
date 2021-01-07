import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { PropTypes } from 'prop-types';
import { i18next } from '../../i18n';
import { PageTexts } from '../../config';

export default class extends Component {
  static propTypes = {
    isPrimaryButtonDisabled: PropTypes.bool,
    currentPage: PropTypes.any,
    isDeletion: PropTypes.bool,
    isDeletionButtonPath: PropTypes.string,
    secondaryButtonPath: PropTypes.string,
    secondaryButtonText: PropTypes.string,
    nodata: PropTypes.bool,
    isSectionEmpty: PropTypes.bool,
    isPrimaryButtonLoading: PropTypes.bool,
    primaryButtonAction:PropTypes.func,
    primaryButtonText: PropTypes.string
  };
  constructor(props) {
    super(props);

    this.state = {
      isPrimaryButtonDisabled: this.props.isPrimaryButtonDisabled,
    };
  }

  shouldComponentUpdate(nextProps) {
    if (
      nextProps.isPrimaryButtonDisabled !== this.state.isPrimaryButtonDisabled
    ) {
      this.setState({
        isPrimaryButtonDisabled: nextProps.isPrimaryButtonDisabled,
      });
    }
    return true;
  }

  render() {
    /****Fixed applied for Task 322445*******/

    /*** This code will check the Current page numbe to disable back button for first Tab */
    let hideBackBtn = false;
    // if ((this.props.currentPage == "0" || this.props.currentPage === 0 ))
    /* converted input 0 to string & compared the value for console warnings */
    if (this.props.currentPage && parseInt(this.props.currentPage) === 0) {
      hideBackBtn = true;
    }
    /**** End Task 322445*******/

    return (
        <div className="bottom-control-buttons">
            {this.props.isDeletion && (
                <Link
                  className="btn btn-danger btn-delete"
                  to={ this.props.isDeletionButtonPath }
                >
                    {i18next.t(PageTexts.DELETE_BUTTON_TEXT)}
                </Link>
            )}
             {this.props.isReject && (	
                <Link	
                  className="btn btn-danger btn-delete"	
                  to={ this.props.isRejectButtonPath }	
                >	
                    {i18next.t(PageTexts.REJECT_BUTTON_TEXT)}	
                </Link>	
            )}
            {!hideBackBtn ? (
                <Link className="btn pep-btn" to={ this.props.secondaryButtonPath }>
                    {i18next.t(this.props.secondaryButtonText)}
                </Link>
            ) : null}

            <button
              className="btn pep-btn-h"
              disabled={
                !!this.state.isPrimaryButtonDisabled ||
                this.props.isSectionEmpty ||
                this.props.nodata ||
                this.props.isPrimaryButtonLoading
              }
              onClick={ this.props.primaryButtonAction }
            >
                {this.props.isPrimaryButtonLoading && <div className="pep-c-iload"></div>}

                {i18next.t(this.props.primaryButtonText)}
            </button>
        </div>
    );
  }
}
