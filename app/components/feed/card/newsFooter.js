import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import Colors from '@theme/colors';
import { trans } from '@lang/i18n';
import ShareIcon from '@assets/icons/ic_card_share_white.png';
import CommentIcon from '@assets/icons/ic_comment_white.png';
import { AppText } from '@components/utils/texts';

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  commentIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareIcon: {
    marginLeft: 4,
  },
  commentCout: {
    marginRight: 10,
  },
});

const Footer = ({ onSharePress, onCommentPress, totalFeeds, hasReadMore }) => (
  <View style={styles.wrapper}>
    <TouchableOpacity onPress={onSharePress}>
      <Image source={ShareIcon} style={styles.shareIcon} />
    </TouchableOpacity>
    {
      hasReadMore && (
        <TouchableOpacity
          onPress={onCommentPress}
        >
          <AppText fontVariation="semibold" color={Colors.text.blue} style={{ marginTop: 5 }}>{trans('feed.read_more')}</AppText>
        </TouchableOpacity>
      )
    }
    {
      !hasReadMore && (
        <View style={styles.commentIcon}>
          <AppText
            size={14}
            color={Colors.text.white}
            style={styles.commentCout}
          >{totalFeeds}</AppText>
          <TouchableOpacity onPress={onCommentPress}>
            <Image source={CommentIcon} style={styles.commentIcon} />
          </TouchableOpacity>
        </View>
      )
    }
  </View>
);

Footer.propTypes = {
  onSharePress: PropTypes.func,
  onCommentPress: PropTypes.func,
  totalFeeds: PropTypes.number,
  hasReadMore: PropTypes.bool,
};

Footer.defaultProps = {
  onSharePress: () => {},
  onCommentPress: () => {},
  totalFeeds: 0,
  hasReadMore: false,
};

export default Footer;
