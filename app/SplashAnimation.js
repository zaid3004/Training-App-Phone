import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { useSettings } from "../lib/settings-context";

export default function SplashAnimation({ onDone }) {
  const { colors } = useSettings();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current; // for the app name text

  useEffect(() => {
    // Sequence: show logo then fade out and navigate
    Animated.sequence([
      // Logo fade-in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      // Logo scale + move up slightly
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(translateY, {
          toValue: -60,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]),
    ]).start(() => {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // Small pause before leaving splash
        setTimeout(() => {
          onDone?.();
        }, 400);
      });
    });
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.Image
        source={require("../prvault_logo.png")}
        style={{
          width: 180,
          height: 180,
          opacity,
          resizeMode: "contain",
          transform: [{ scale }, { translateY }],
          justifyContent: "center",
          alignItems: "center",
          paddingLeft: 20,
          paddingTop: 40,
        }}
      />
    </View>
  );
}
