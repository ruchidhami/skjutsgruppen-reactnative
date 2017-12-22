import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Image } from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  icon: {
    height: 13,
    resizeMode: 'contain',
    marginRight: 6,
  },
  text: {
    color: '#999',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

const BackButton = ({ style, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
    <Image source={require('@icons/icon_back.png')} style={styles.icon} />
    <Text style={styles.text}>Back</Text>
  </TouchableOpacity>
);

BackButton.propTypes = {
  style: View.propTypes.style,
  onPress: PropTypes.func.isRequired,
};

BackButton.defaultProps = {
  style: {},
};

export default BackButton;