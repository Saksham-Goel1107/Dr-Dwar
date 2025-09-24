import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

type Props = {
  onFinish?: () => void;
  duration?: number;
};

export default function Splash({ onFinish, duration = 1000 }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const show = () => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        const t = setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => onFinish && onFinish());
        }, duration);
        return () => clearTimeout(t);
      });
    };

    show();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.inner}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Doctor at Your Doorstep</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  inner: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    marginTop: 6,
    color: '#374151',
  },
});
