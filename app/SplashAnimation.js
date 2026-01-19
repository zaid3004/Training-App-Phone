import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettings } from './lib/settings-context';

export default function SplashAnimation({ onDone }) {
  const router = useRouter();
  const { colors } = useSettings();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Sequence: fade-in logo -> scale up -> translate up and fade into app
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.05, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(translateY, { toValue: -60, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true, easing: Easing.in(Easing.ease) })
    ]).start(() => {
      onDone?.();
      router.replace("/(tabs)/home");
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Image
        source={require('./assets/logo.png')}
        style={{ width: 120, height: 120, opacity, transform: [{ scale }, { translateY }] }}
        resizeMode="contain"
      />
    </View>
  );
}
