import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TouchableWithoutFeedback, Image } from 'react-native';
import PropTypes from 'prop-types';
import Colors from '@theme/colors';
import ShareIcon from '@icons/ic_share.png';
import CommentIcon from '@icons/ic_comment.png';
import Date from '@components/date';

const cardHeight = 484;
const profilePicSize = 60;

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  wrapper: {
    height: cardHeight,
    backgroundColor: Colors.background.fullWhite,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOpacity: 1.0,
    shadowRadius: 2,
  },
  imgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: cardHeight / 2,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.background.gray,
  },
  img: {
    width: '100%',
    height: cardHeight / 2,
    resizeMode: 'cover',
  },
  groupName: {
    backgroundColor: 'transparent',
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.white,
    alignSelf: 'center',
  },
  profilePicWrapper: {
    height: profilePicSize,
    width: profilePicSize,
    position: 'absolute',
    top: (cardHeight / 2) - (profilePicSize / 2),
    right: 20,
    zIndex: 10,
  },
  profilePic: {
    height: profilePicSize,
    width: 'auto',
    resizeMode: 'cover',
    borderRadius: (profilePicSize / 2),
    borderWidth: 2,
    backgroundColor: '#ddd',
    borderColor: Colors.border.white,
  },
  offerType: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 1,
    elevation: 2,
  },
  blueBg: {
    backgroundColor: Colors.background.blue,
  },
  typeText: {
    color: Colors.text.white,
    fontSize: 10,
  },
  detail: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  comment: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 'auto',
    overflow: 'hidden',
  },
  commentGradientOverlay: {
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginHorizontal: 24,
  },
  footer: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCout: {
    color: '#888',
    marginRight: 10,
  },
  text: {
    lineHeight: 20,
  },
  lightText: {
    color: Colors.text.darkGray,
  },
  username: {
    color: Colors.text.blue,
    fontWeight: 'bold',
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});

const Ask = ({ ask, onPress, onSharePress, wrapperStyle }) => {
  let image = null;
  if (ask.photo) {
    image = (<Image source={{ uri: ask.photo }} style={styles.img} />);
  }

  let profileImage = null;
  if (ask.User.photo) {
    profileImage = (<Image source={{ uri: ask.User.photo }} style={styles.profilePic} />);
  } else {
    profileImage = (<View style={styles.imgIcon} />);
  }

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <TouchableWithoutFeedback
        onPress={() => onPress('ask', ask)}
        style={styles.flex1}
      >
        <View style={styles.flex1}>
          <View style={styles.imgWrapper}>
            {image}
          </View>
          <View style={[styles.offerType, styles.blueBg]}>
            <Text style={styles.typeText}>{('asking a ride').toUpperCase()}</Text>
          </View>
          <View style={styles.detail}>
            <View>
              <Text style={[styles.text, styles.lightText]}>
                <Text style={styles.username}>
                  {ask.User.firstName || ask.User.email}
                </Text>
                <Text> asks for a ride </Text>
              </Text>
              <Text style={[styles.text, styles.lightText]}>
                {ask.TripStart.name} - {ask.TripEnd.name}
              </Text>
              <Text style={[styles.text, styles.lightText]}><Date format="MMM DD HH:mm">{ask.date}</Date></Text>
            </View>
          </View>
          <View style={styles.comment}>
            <Text style={styles.text}>{ask.description}</Text>
            <View style={styles.commentGradientOverlay} />
          </View>
        </View>
      </TouchableWithoutFeedback>
      <TouchableOpacity
        onPress={() => onPress('profile', ask.User.id)}
        style={styles.profilePicWrapper}
      >
        {profileImage}
      </TouchableOpacity>
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => onSharePress('ask', ask)}>
          <Image source={ShareIcon} style={styles.icon} />
        </TouchableOpacity>
        <View style={styles.commentIcon}>
          <Text style={styles.commentCout}>{ask.Comments.length}</Text>
          <TouchableOpacity onPress={() => onPress('ask', ask)}>
            <Image source={CommentIcon} style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

Ask.propTypes = {
  ask: PropTypes.shape({
    name: PropTypes.string,
    photo: PropTypes.string,
    date: PropTypes.string,
    user: PropTypes.object,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  onSharePress: PropTypes.func.isRequired,
  wrapperStyle: View.propTypes.style,
};

Ask.defaultProps = {
  wrapperStyle: {},
};

export default Ask;
