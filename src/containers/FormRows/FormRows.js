import PropTypes from 'prop-types';
import React, { Component } from 'react';


import FormRow from './FormRow';
export default class FormRows extends Component {
  static propTypes = {
    rows: PropTypes.array,
    formAccess: PropTypes.func,
    forms: PropTypes.object.isRequired,
    getForms: PropTypes.func,
    onAction: PropTypes.func,
    onPageSizeChanged: PropTypes.func,
    isApprover: PropTypes.bool
  };

  getRowForms = (type) => {
    const {
      forms: { forms },
    } = this.props;

    return forms.filter(
      (form) => form.dropDownName && form.dropDownName.toLowerCase() === type
    );
  };

  render() {
    const { rows, isApprover} = this.props;
 
    const formRows = rows.map((row, index) => {
      return (
          <FormRow
          forms={ this.getRowForms(row.key) }
          title={ row.title }
          isApprover={ isApprover }
          /* key should not have index so added unique value as Math.random() */
          key={ `row_wrapper_${ Math.random() }` }
        />
      );
    });

    return <div>
      
<div>{formRows}</div></div>;
  }
}
