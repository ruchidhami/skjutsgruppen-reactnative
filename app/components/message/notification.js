import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import { withNotification } from '@services/apollo/notification';
import { compose } from 'react-apollo';
import PropTypes from 'prop-types';
import Colors from '@theme/colors';
import { AppText } from '@components/utils/texts';
import MesssageItem from '@components/message/item';
import DataList from '@components/dataList';
import { connect } from 'react-redux';
import { trans } from '@lang/i18n';
import { withNavigation, NavigationActions } from 'react-navigation';
import LoadMore from '@components/message/loadMore';
import AuthService from '@services/auth';
import AuthAction from '@redux/actions/auth';
import { LoginManager } from 'react-native-fbsdk';
import firebase from 'react-native-firebase';
import { resetLocalStorage } from '@services/apollo/dataSync';
import { NOT_AUTHORIZED_ERROR, JWT_MALFORMED_ERROR } from '@config/constant';

const styles = StyleSheet.create({
  section: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.lightGray,
    paddingVertical: 16,
  },
  sectionTitle: {
    marginTop: 16,
    marginHorizontal: 24,
  },
  emptyMessage: {
    opacity: 0.5,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  spacedWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 16,
    lineHeight: 32,
    color: Colors.text.gray,
    textAlign: 'center',
  },
});

class NewNotification extends PureComponent {
  componentWillMount() {
    const { subscribeToNotification, user, filters, notifications } = this.props;

    if (filters === 'new') {
      subscribeToNotification({ userId: user.id });
      //   notifications.startPolling(15000);
    }
  }

  async componentWillReceiveProps({ notifications: { error, loading }, logout }) {
    if (!loading && error) {
      const { graphQLErrors } = error;
      if (graphQLErrors && graphQLErrors.length > 0) {
        const notAuthroized = graphQLErrors.filter(gError =>
          (gError.code === NOT_AUTHORIZED_ERROR || gError.code === JWT_MALFORMED_ERROR));
        if (notAuthroized.length > 0) {
          await firebase.notifications().cancelAllNotifications();
          logout()
            .then(() => LoginManager.logOut())
            .then(() => this.reset())
            .catch(() => this.reset());
        }
      }
    }
  }

  reset = async () => {
    const { navigation } = this.props;
    await resetLocalStorage();
    const resetAction = NavigationActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: 'Splash' })],
    });
    navigation.dispatch(resetAction);
  }

  loadMore = (onPress) => {
    const { notifications } = this.props;
    if (notifications.loading) return null;

    const remaining = notifications.count - notifications.rows.length;
    if (remaining < 1) return null;

    return <LoadMore onPress={onPress} remainingCount={remaining} />;
  }

  renderNotification = () => {
    const { notifications, filters } = this.props;

    return (
      <DataList
        data={notifications}
        renderItem={({ item }) => (
          item.Notifiable ?
            <MesssageItem
              key={item.id}
              filters={filters}
              notification={item}
            /> : null
        )}
        infinityScroll={false}
        loadMoreButton={this.loadMore}
        loadMorePosition="bottom"
        fetchMoreOptions={{
          variables: { offset: notifications.rows.length },
          updateQuery: (previousResult, { fetchMoreResult }) => {
            if (!fetchMoreResult || fetchMoreResult.notifications.rows.length === 0) {
              return previousResult;
            }

            const rows = previousResult.notifications.rows
              .concat(fetchMoreResult.notifications.rows);

            return { notifications: { ...previousResult.notifications, ...{ rows } } };
          },
        }}
      />
    );
  }

  render() {
    const { notifications, filters } = this.props;
    if (notifications.count < 1) return null;

    return (
      <View style={styles.section}>
        <AppText size={12} color={Colors.text.blue} style={styles.sectionTitle}>
          {trans(`message.${filters}`)} {filters !== 'new' && trans('message.messages')}
        </AppText>
        {this.renderNotification()}
      </View>
    );
  }
}

NewNotification.propTypes = {
  filters: PropTypes.string.isRequired,
  notifications: PropTypes.shape({
    refetch: PropTypes.func.isRequired,
    rows: PropTypes.arrayOf(PropTypes.object),
    count: PropTypes.numeric,
    error: PropTypes.object,
  }).isRequired,
  subscribeToNotification: PropTypes.func.isRequired,
  user: PropTypes.shape({
    id: PropTypes.numeric,
  }).isRequired,
  logout: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({ user: state.auth.user });

const mapDispatchToProps = dispatch => ({
  logout: () => AuthService.logout()
    .then(() => dispatch(AuthAction.logout()))
    .catch(error => console.warn(error)),
});

export default compose(
  withNotification,
  withNavigation,
  connect(mapStateToProps, mapDispatchToProps),
)(NewNotification);
