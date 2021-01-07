import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class ProtectAuth extends Component {
  render() {
    const { authenticated, goToState } = this.props;

    if (authenticated) {
      return this.props.children;
    } else {
      //return <div>Unauthorized</div>;
      goToState();
    }
  }
}
ProtectAuth.propTypes = {
  authenticated: PropTypes.object,
  goToState:PropTypes.func,
  children: PropTypes.object
  };
function mapStateToProps(state, ownProps) {
  return {
    authenticated: ownProps.formio.auth.selectors.getAuthenticated(state),
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    goToState: () =>
      dispatch(ownProps.router.go('/' + ownProps.formio.auth.config.anonState)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ProtectAuth);
