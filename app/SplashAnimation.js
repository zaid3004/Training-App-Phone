import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettings } from '../lib/settings-context';

export default function SplashAnimation({ onDone }) {
  const router = useRouter();
  const { colors } = useSettings();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current; // for the app name text

  useEffect(() => {
    // Sequence: show logo, then reveal app name, then fade out and navigate
    Animated.sequence([
      // Logo fade-in
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      // Logo scale + move up slightly
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.05, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(translateY, { toValue: -60, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      ]),
    ]).start(() => {
      // Reveal the app name text after the logo animation
      Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => {
        // Small pause before leaving splash
        setTimeout(() => {
          onDone?.();
          router.replace("/(tabs)/home");
        }, 400);
      });
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Image
        source={require("../prvault_logo.png")} 
        style={{ width: 180, height: 180, opacity, resizeMode: 'contain', transform: [{ scale }, { translateY }] }}
      />
      <Animated.Text style={{ marginTop: 16, fontSize: 28, fontWeight: '700', color: colors.accent, opacity: textOpacity }}>
        PR Vault
      </Animated.Text>
    </View>
  );
}
