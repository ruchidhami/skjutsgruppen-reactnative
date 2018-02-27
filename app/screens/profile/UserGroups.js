import React, { Component } from 'react';
import ToolBar from '@components/utils/toolbar';
import GroupsList from '@components/profile/groupsList';
import { withMyGroups } from '@services/apollo/group';
import PropTypes from 'prop-types';
import { Wrapper } from '@components/common';
import Colors from '@theme/colors';
import { connect } from 'react-redux';

const Groups = withMyGroups(GroupsList);

class UserGroups extends Component {
  static navigationOptions = {
    header: null,
  };

  render() {
    const { userId, username } = this.props.navigation.state.params || this.props.user.id;

    return (
      <Wrapper bgColor={Colors.background.creme}>
        <ToolBar title={`${username}'s Group`} />
        <Groups id={userId} />
      </Wrapper>
    );
  }
}

UserGroups.propTypes = {
  navigation: PropTypes.shape({
    state: PropTypes.object,
    navigate: PropTypes.func,
    goBack: PropTypes.func,
  }).isRequired,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
  }).isRequired,
};

const mapStateToProps = state => ({ user: state.auth.user });

export default connect(mapStateToProps)(UserGroups);
