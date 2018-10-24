import React, { Component } from 'react';
import { StyleSheet, View, Image, Modal, Alert, Platform, PermissionsAndroid, Linking, NativeModules, BackHandler, AlertIOS, Dimensions, PanResponder, LayoutAnimation, UIManager } from 'react-native';
import FeedItem from '@components/feed/feedItem';
import Filter from '@components/feed/filter';
import { Wrapper, Circle } from '@components/common';
import { Heading } from '@components/utils/texts';
import { withFeed } from '@services/apollo/trip';
import PropTypes from 'prop-types';
import Share from '@components/common/share';
import Colors from '@theme/colors';
import FeedIcon from '@assets/icons/ic_feed.png';
import FeedIconActive from '@assets/icons/ic_feed_active.png';
import { getCountryLocation, getCurrentLocation } from '@helpers/device';
import { trans } from '@lang/i18n';
import MapView from '@screens/Map';
import {
  FEEDABLE_TRIP,
  FEEDABLE_GROUP,
  FEED_FILTER_EVERYTHING,
  EXPERIENCE_FIRST_CARDS,
  EXPERIENCE_REPEAT_CARDS,
  EXPERIENCE_FETCH_LIMIT,
  FEEDABLE_PROFILE,
  FEEDABLE_NEWS,
  FEEDABLE_EXPERIENCE,
  FEED_FILTER_NEARBY,
  NOT_AUTHORIZED_ERROR,
  JWT_MALFORMED_ERROR,
} from '@config/constant';
import { withGetExperiences } from '@services/apollo/experience';
import List from '@components/experience/list';
import DataList from '@components/dataList';
import CoCreateModal from '@components/coCreateModal';
import Contacts from 'react-native-contacts';
import OpenSettings from 'react-native-open-settings';
import { withContactSync } from '@services/apollo/contact';
import { compose } from 'react-apollo';
import { connect } from 'react-redux';
import AuthService from '@services/auth';
import AuthAction from '@redux/actions/auth';
import { LoginManager } from 'react-native-fbsdk';
import firebase from 'react-native-firebase';
import { resetLocalStorage } from '@services/apollo/dataSync';
import { NavigationActions } from 'react-navigation';

const FeedExperience = withGetExperiences(List);

const winHeight = Dimensions.get('window').height;

const LayoutAnimationconfig = {
  duration: 300,
  update: {
    type: 'easeInEaseOut',
  },
  useNativeDriver: true,
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  menuWrapper: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 27,
    marginTop: 22,
    marginBottom: 4,
  },
  mapWrapper: {
    alignSelf: 'flex-end',
    opacity: 0,
  },
  mapImg: {
    resizeMode: 'contain',
  },
  menuIconWrapper: {
    height: 40,
    width: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 3,
  },
  menuIcon: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  permissionModal: {
    marginVertical: 20,
    paddingTop: 30,
    paddingBottom: 50,
    borderRadius: 20,
    backgroundColor: Colors.background.fullWhite,
    elevation: 5,
    marginHorizontal: 45,
  },
});

class Feed extends Component {
  static navigationOptions = {
    tabBarLabel: 'Feed',
    tabBarIcon: ({ focused }) => <Image source={focused ? FeedIconActive : FeedIcon} />,
    tabBarOnPress: ({ scene, jumpToIndex }) => {
      if (scene.focused) {
        const navigationInRoute = scene.route;
        if (!!navigationInRoute
          && !!navigationInRoute.params
          && !!navigationInRoute.params.scrollToTop) {
          navigationInRoute.params.scrollToTop();
        }
      }
      jumpToIndex(0);
    },
  };

  constructor(props) {
    super(props);
    this.state = ({
      refreshing: false,
      shareable: {},
      shareableType: '',
      showShareModal: false,
      filterOpen: false,
      filterType: FEED_FILTER_EVERYTHING,
      latitude: '',
      longitude: '',
      locationError: false,
      currentLocation: false,
      totalExperiences: 0,
      loading: false,
      showCoCreateModal: true,
      yPos: 0,
      mapView: false,
    });

    this.feedList = null;
    this.messageListener = null;
    this.backButtonPressed = false;

    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const { dy } = gestureState;
        if (this.state.yPos <= 0 && dy > 4) {
          this.feedList.setNativeProps({ scrollEnabled: false });
        } else {
          this.feedList.setNativeProps({ scrollEnabled: true });
        }

        return this.state.yPos <= 0 && dy > 4;
      },

      onPanResponderRelease: (evt, { dy, vy }) => {
        console.log('release +++++++++++++++++++');

        const duration = Math.abs(dy * vy * 10);
        // if (dy < 30) {
        //   duration = Math.abs(dy * 10);
        // }
        // this.feedList.setNativeProps({ scrollEnabled: true });

        if (dy > 150) {
          if (vy <= 0) {
            this.setFeedView(duration);
          } else {
            this.setMapView(duration);
          }
          // this.feedList.setNativeProps({ scrollEnabled: true });
          return null;
        }

        if (vy > 0.75) {
          this.setMapView(duration);
        } else {
          this.setFeedView(duration);
        }

        // this.feedList.setNativeProps({ scrollEnabled: true });
        return null;
      },

      onPanResponderTerminationRequest: () => {
        this.feedList.setNativeProps({ scrollEnabled: true });
      },

      onPanResponderTerminate: (evt, { dy, vy }) => {
        console.log('terminate -------------------');
        let duration = 300;
        if (dy < 150) {
          duration = Math.abs(dy * 2);
        }

        if (dy > 150) {
          if (vy <= 0) {
            this.setFeedView(duration);
          } else {
            this.setMapView(duration);
          }
          this.feedList.setNativeProps({ scrollEnabled: true });
          return null;
        }

        if (vy > 0.75) {
          this.setMapView(duration);
        } else {
          this.setFeedView(duration);
        }

        this.feedList.setNativeProps({ scrollEnabled: true });
        return null;
      },

      onPanResponderMove: (event, { dy }) => {
        this.setFeedWrapperOffset(dy);
      },
    });
  }

  async componentWillMount() {
    const { feeds, subscribeToFeed, navigation } = this.props;
    const { params } = navigation.state;

    navigation.setParams({ scrollToTop: this.scrollToTop });

    navigation.addListener('didBlur', e => this.tabEvent(e, 'didBlur'));

    if (!params || (params && !params.askContactPermission)) {
      this.contactPermission();
    }

    if (params && typeof params.refetch !== 'undefined') {
      feeds.refetch();
    }

    this.currentLocation();
    subscribeToFeed();

    this.messageListener = firebase.messaging().onMessage((message) => {
      const { _data: { custom_notification: customNotification } } = message;
      const payload = JSON.parse(customNotification);

      if (payload && payload.logout) {
        this.logoutActions();
      }
    });
  }

  componentDidMount() {
    const { navigation } = this.props;
    navigation.addListener('willFocus', () => {
      this.feedList.setNativeProps({ scrollEnabled: true });
    });

    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.onBackButtonPress);

      Linking.getInitialURL().then((url) => {
        if (url) {
          this.navigate(url);
        }
      });
    } else {
      Linking.getInitialURL().then((dynamicLink) => {
        const backupLink = dynamicLink;
        if (dynamicLink) {
          const queryString = {};
          dynamicLink.replace(
            new RegExp('([^?=&]+)(=([^&]*))?', 'g'),
            ($0, $1, $2, $3) => { queryString[$1] = $3; },
          );
          const link = queryString.link;
          if (link) {
            this.navigate(link);
          } else {
            NativeModules.Utilities.getUrlFromDynamicLink(backupLink, (error, url) => {
              this.navigate(url);
            });
          }
        }
      }).catch(err => console.warn('An error occurred', err));
      Linking.addEventListener('url', this.handleOpenURL);
    }
  }

  async componentWillReceiveProps({ feeds: { error, loading } }) {
    if (!loading && error) {
      const { graphQLErrors } = error;
      if (graphQLErrors && graphQLErrors.length > 0) {
        const notAuthroized = graphQLErrors.filter(gError =>
          (gError.code === NOT_AUTHORIZED_ERROR || gError.code === JWT_MALFORMED_ERROR));
        if (notAuthroized.length > 0) {
          await this.logoutActions();
        }
      }
    }
  }

  onBackButtonPress = () => {
    if (!this.backButtonPressed) {
      this.scrollToTop();
      this.backButtonPressed = true;

      return true;
    }

    return false;
  }

  onPress = (type, details) => {
    const { navigation } = this.props;
    const { id } = details;

    if (type === FEEDABLE_GROUP) {
      navigation.navigate('GroupDetail', { id });
    }

    if (type === FEEDABLE_TRIP) {
      navigation.navigate('TripDetail', { id });
    }

    if (type === FEEDABLE_PROFILE) {
      navigation.navigate('Profile', { profileId: id });
    }

    if (type === FEEDABLE_NEWS) {
      navigation.navigate('NewsDetail', { news: details });
    }

    if (type === FEEDABLE_EXPERIENCE) {
      navigation.navigate('ExperienceDetail', { id });
    }
  }

  onFilterChange = (type) => {
    const { filterType, longitude, latitude } = this.state;
    if (type === FEED_FILTER_NEARBY && (longitude === '' || latitude === '')) {
      this.currentLocation();
      Alert.alert('Location Error', 'Could not find your location. Please enable location service or try again.');
    } else if (type !== filterType) {
      this.setState({ filterType: type }, () => {
        const from = (longitude && longitude) ? [longitude, latitude] : [];
        this.props.feeds.refetch({ offset: 0, filter: { type, from } });
      });
    }
  }

  onScroll = (event) => {
    this.setState(() => ({ yPos: event }));
  }

  onScrollEndDrag = (event) => {
    if (event.nativeEvent.contentOffset.y < -100) {
      this.setMapView();
    } else {
      this.setFeedView();
    }
  }

  setMapView = (duration = 300) => {
    const LayoutAnimationconfigInner = {
      duration: parseInt(duration, 0),
      update: {
        type: 'easeInEaseOut',
      },
      useNativeDriver: true,
    };

    if (Platform.OS === 'ios') {
      LayoutAnimation.configureNext(LayoutAnimationconfigInner, () => this.setState({ mapView: true }));
    } else {
      LayoutAnimation.configureNext(LayoutAnimationconfig);
    }

    this.feedWraper.setNativeProps({ top: winHeight + 100 });

    if (Platform.OS === 'android') {
      setTimeout(() => this.setState({ mapView: true }), 600);
    }
  }

  setFeedView = (duration = 300) => {
    const LayoutAnimationconfigInner = {
      duration: parseInt(duration, 0),
      update: {
        type: 'easeInEaseOut',
      },
      useNativeDriver: true,
    };

    if (Platform.OS === 'ios') {
      LayoutAnimation.configureNext(LayoutAnimationconfigInner, () => this.setState({ mapView: false }));
    } else {
      LayoutAnimation.configureNext(LayoutAnimationconfig);
    }

    this.feedWraper.setNativeProps({ top: 0 });


    // if (Platform.OS === 'android') {
    //   this.setState({ mapView: false });
    // }

    if (Platform.OS === 'android') {
      setTimeout(() => this.setState({ mapView: false }), 600);
    }
  }

  setFeedWrapperOffset = (offset) => {
    if (offset > 0) {
      this.feedWraper.setNativeProps({ top: offset });
    }
  }

  setFilterVisibility = (visibility) => {
    this.setState({ filterOpen: visibility });
  }

  contactPermission = async () => {
    const { syncContacts } = this.props;
    try {
      if (Platform === 'android' || Platform.OS === 'android') {
        const permissions =
          await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);

        if (!permissions) {
          const response =
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
          if (response && response === 'granted') {
            syncContacts();
          }
          this.setState({ contactPermission: !(response === 'denied' || response === 'never_ask_again'), contactPermissionResponse: response });
        }
      } else {
        Contacts.checkPermission(async (err, permission) => {
          const iosPermission = await AuthService.getContactPermission();

          if (permission === 'authorized' && (iosPermission === null)) {
            await syncContacts();
            await AuthService.setContactPermission('synced');
          }

          if (err || permission !== 'authorized') {
            Contacts.requestPermission((contactErr, res) => {
              if (contactErr) {
                if (Platform === 'ios' || Platform.OS === 'ios') {
                  // Crashlytics.recordError(contactErr);
                }
              }
              if (res === 'authorized') {
                syncContacts();
              }
              // console.warn(err, res);
              this.setState({ contactPermission: false, contactPermissionResponse: permission });
            });

            if (permission === 'denied' && (!iosPermission)) {
              AlertIOS.alert(
                'Contacts Permission',
                trans('onboarding.contact_permission'),
                [
                  {
                    text: 'Open Settings',
                    onPress: () => OpenSettings.openSettings(),
                  },
                  {
                    text: 'Never ask again',
                    onPress: async () => { await AuthService.setContactPermission('denied'); },
                  },
                ],
              );
            }
          } else {
            this.setState({ contactPermission: true, contactPermissionResponse: permission });
          }
        });
      }
    } catch (err) {
      console.warn(err);
    }
  }

  logoutActions = async () => {
    const { logout } = this.props;
    await firebase.notifications().cancelAllNotifications();
    logout()
      .then(() => LoginManager.logOut())
      .then(() => this.reset())
      .catch(() => this.reset());
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

  handleOpenURL = (event) => {
    this.navigate(event.url);
  }

  navigate = (url) => {
    const { navigation } = this.props;
    const route = url.replace(/.*?:\/\//g, '');
    const routes = route.split('/');
    const id = routes[2];
    const routeName = routes[1];

    if (routeName === 't') {
      navigation.navigate('TripDetail', { id });
    }

    if (routeName === 'g') {
      navigation.navigate('GroupDetail', { id });
    }

    if (routeName === 'e') {
      navigation.navigate('ExperienceDetail', { id });
    }

    if (routeName === 'p') {
      navigation.navigate('Profile', { profileId: parseInt(id, 10) });
    }
  }

  askForPermission = async () => {
    try {
      if (Platform === 'android' || Platform.OS === 'android') {
        const response =
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);

        if (response === 'granted') {
          this.setState({ contactPermission: true });
          return;
        }

        if (this.state.contactPermissionResponse === 'never_ask_again') {
          OpenSettings.openSettings();
          return;
        }

        this.setState({ contactPermission: !(response === 'denied' || response === 'never_ask_again'), contactPermissionResponse: response });
      } else {
        Contacts.checkPermission((error, permission) => {
          if (error || permission === 'denied' || permission === 'undefined') OpenSettings.openSettings();
        });
      }
    } catch (e) {
      console.warn(e);
    }
  }

  tabEvent = (e, type) => {
    if (this.feedList && type === 'didBlur') {
      if (this.state.filterType === FEED_FILTER_EVERYTHING) {
        // this.feedList.getNode().scrollToOffset({ offset: 0, animated: true });
      } else {
        this.setState({ filterType: FEED_FILTER_EVERYTHING }, () => {
          this.props.feeds.refetch({ offset: 0, filter: { type: FEED_FILTER_EVERYTHING } });
          // this.feedList.getNode().scrollToOffset({ offset: 0, animated: true });
        });
      }
    }
  }

  scrollToTop = () => {
    if (this.feedList) {
      this.props.feeds.refetch();
      this.feedList.getNode().scrollToOffset({ offset: 0, animated: true });
    }
  }

  async currentLocation() {
    if (this.state.currentLocation) return;

    try {
      const res = await getCurrentLocation();
      this.setState({
        latitude: res.latitude,
        longitude: res.longitude,
        currentLocation: true,
        locationError: false,
      });
    } catch (error) {
      const { latitude, longitude } = getCountryLocation();
      if (latitude) {
        this.setState({ latitude, longitude, currentLocation: false, locationError: false });
      } else {
        this.setState({ locationError: true });
      }
    }
  }

  experienceAfterCards = (index) => {
    if (this.isFirstLimitCard(index)) {
      return EXPERIENCE_FIRST_CARDS;
    }

    return EXPERIENCE_REPEAT_CARDS;
  }

  isFirstLimitCard = index => index < EXPERIENCE_FIRST_CARDS;

  renderShareModal() {
    const { showShareModal, shareableType, shareable } = this.state;

    return (
      <Modal
        visible={showShareModal}
        onRequestClose={() => this.setState({ showShareModal: false })}
        animationType="slide"
      >
        <Share
          modal
          type={shareableType}
          detail={shareable}
          onClose={() => this.setState({ showShareModal: false })}
        />
      </Modal>
    );
  }

  renderHeader = () => {
    const hiStyle = Platform.OS === 'ios' ? { marginTop: 8 } : {};
    return (<View style={styles.header}>
      <View style={styles.menuWrapper}>
        <Heading
          fontVariation="bold"
          size={24}
          color={Colors.text.white}
          style={[{ lineHeight: 24 }, hiStyle]}
        >
          {trans('feed.hi')}!
        </Heading>
        <Filter
          selected={this.state.filterType}
          onPress={this.onFilterChange}
        />
      </View>
    </View>);
  }

  renderExperience = (index) => {
    const { totalExperiences } = this.props.feeds;

    let indexPlusOne = index + 1;
    let deductor = 1;

    if (!this.isFirstLimitCard(index)) {
      indexPlusOne -= EXPERIENCE_FIRST_CARDS;
      deductor = 0;
    }

    const isRenderable = (indexPlusOne % this.experienceAfterCards(index) === 0);
    const offset = (indexPlusOne / this.experienceAfterCards(index)) - deductor;
    const isLimitNotExceeded = totalExperiences > offset;
    const isEverythingFilter = this.state.filterType === FEED_FILTER_EVERYTHING;

    if (isLimitNotExceeded && isRenderable && isEverythingFilter) {
      return (
        <View>
          <FeedExperience
            title={trans('feed.experiences')}
            offset={offset * EXPERIENCE_FETCH_LIMIT}
            limit={EXPERIENCE_FETCH_LIMIT}
          />
        </View>
      );
    }

    return null;
  }

  renderItem = ({ item, index }) => (
    <View>
      <FeedItem
        onSharePress={(shareableType, shareable) =>
          this.setState({ showShareModal: true, shareableType, shareable })}
        onPress={this.onPress}
        feed={item}
      />
      {this.renderExperience(index)}
    </View>
  );

  renderFeed() {
    const { feeds } = this.props;
    const { filterType } = this.state;
    let noResultText = trans('feed.no_rides_have_been_created_yet');

    if (filterType === FEEDABLE_EXPERIENCE.toLowerCase()) {
      noResultText = trans('feed.no_experiences_published_yet');
    }

    if (filterType === FEEDABLE_TRIP) {
      noResultText = trans('feed.no_rides_yet');
    }

    if (filterType === FEEDABLE_NEWS.toLowerCase()) {
      noResultText = trans('feed.no_news_yet');
    }

    return (
      <DataList
        innerRef={(list) => { this.feedList = list; }}
        data={feeds}
        header={this.renderHeader}
        renderItem={this.renderItem}
        fetchMoreOptions={{
          variables: { offset: this.props.feeds.rows.length },
          updateQuery: (previousResult, { fetchMoreResult }) => {
            if (!fetchMoreResult || fetchMoreResult.getFeed.rows.length === 0) {
              return previousResult;
            }

            const rows = previousResult.getFeed.rows.concat(fetchMoreResult.getFeed.rows);

            return { getFeed: { ...previousResult.getFeed, ...{ rows } } };
          },
        }}
        shouldUpdateAnimatedValue
        noResultText={noResultText}
        onScroll={this.onScroll}
        onScrollEndDrag={this.onScrollEndDrag}
      />
    );
  }

  renderCoCreateModal = () => {
    const { showCoCreateModal } = this.state;
    return (<CoCreateModal
      visible={showCoCreateModal}
      toggleCoCreateModalVisibility={(value) => { this.setState({ showCoCreateModal: value }); }}
    />);
  }

  render() {
    const { showShareModal } = this.state;
    const { navigation } = this.props;
    return (
      <Wrapper bgColor={Colors.background.mutedBlue}>
        {/* <MapView
          fullView={this.state.mapView}
          setFeedView={() => this.setFeedView(300)}
          navigation={navigation}
        /> */}
        <View
          style={{ flex: 1 }}
          ref={(ref) => { this.feedWraper = ref; }}
          {...this.panResponder.panHandlers}
        >
          <Image
            source={require('@assets/feed_bg.png')}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: Dimensions.get('window').width,
              height: Dimensions.get('window').height,
              resizeMode: 'cover',
            }}
          />
          <Circle animatable />
          {this.renderFeed()}
        </View>
        { showShareModal && this.renderShareModal()}
        {/* {this.renderCoCreateModal()} */}
      </Wrapper>
    );
  }
}

Feed.propTypes = {
  feeds: PropTypes.shape({
    totalExperiences: PropTypes.numeric,
    rows: PropTypes.arrayOf(PropTypes.object),
    fetchMore: PropTypes.func.isRequired,
    refetch: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    count: PropTypes.numeric,
    error: PropTypes.object,
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    navigateWithDebounce: PropTypes.func,
    state: PropTypes.shape({
      params: PropTypes.shape({
        refetch: PropTypes.bool,
      }),
    }).isRequired,
  }).isRequired,
  subscribeToFeed: PropTypes.func.isRequired,
  syncContacts: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  // setContactPermission: PropTypes.func.isRequired,
  // getContactPermission: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
  logout: () => AuthService.logout()
    .then(() => dispatch(AuthAction.logout()))
    .catch(error => console.warn(error)),
  // setContactPermission: (permission) => { AuthService.setContactPermission(permission); },
  // getContactPermission: () => AuthService.getContactPermission(),
});

export default compose(
  withFeed,
  withContactSync,
  connect(null, mapDispatchToProps))(Feed);
