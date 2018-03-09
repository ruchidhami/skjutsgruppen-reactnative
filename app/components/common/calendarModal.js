import React from 'react';
import { StyleSheet, View, Text, Modal, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import { trans } from '@lang/i18n';
import * as Animatable from 'react-native-animatable';
import { Colors } from '@theme';
import TouchableHighlight from '@components/touchableHighlight';

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.65)',
    justifyContent: 'flex-end',
  },
  wrapper: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    elevation: 15,
    overflow: 'hidden',
  },
  calendarWrapper: {
    height: 350,
  },
  closeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.fullWhite,
  },
  close: {
    padding: 20,
  },
  closeLabel: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: Colors.text.blue,
  },
});

const CalendarModal = ({
  style,
  transparent,
  visible,
  onRequestClose,
  animationType,
  children,
}) => (
  <Modal
    transparent={transparent}
    visible={visible}
    onRequestClose={onRequestClose}
    animationType={animationType}
  >
    <View style={[styles.content, style]}>
      <Animatable.View
        animation="slideInUp"
        duration={600}
        easing="ease-in-out-cubic"
        style={styles.wrapper}
        useNativeDriver
      >
        <View style={styles.calendarWrapper}>
          {children}
        </View>
        <View style={styles.closeWrapper}>
          <TouchableHighlight
            style={styles.close}
            onPress={onRequestClose}
          >
            <Text style={styles.closeLabel}>{trans('global.cancel')}</Text>
          </TouchableHighlight>
        </View>
      </Animatable.View>
    </View>
  </Modal>
);

CalendarModal.propTypes = {
  children: PropTypes.node.isRequired,
  style: ViewPropTypes.style,
  transparent: PropTypes.bool,
  visible: PropTypes.bool,
  onRequestClose: PropTypes.func.isRequired,
  animationType: PropTypes.string,
};

CalendarModal.defaultProps = {
  style: {},
  transparent: true,
  visible: false,
  animationType: 'fade',
};

export default CalendarModal;
