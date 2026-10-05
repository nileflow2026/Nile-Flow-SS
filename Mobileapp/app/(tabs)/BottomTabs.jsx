import { BlurView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import React, { useState, useCallback } from "react";
import { Dimensions, Platform, Text, View, Pressable } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Cart from "../(Screens)/Cart";
import Explore from "../(Screens)/Explore";
import Feed from "../(Screens)/Feed";
import Home from "../(Screens)/Home";
import CreatorMode from "../(Screens)/CreatorMode";
import Profile from "../(Screens)/Profile";
import MyNotificationsScreen from "../(Screens)/MyNotificationsScreen";
import { icons } from "../../constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../Context/CartContext_NEW";
import { useNotification } from "../../Context/NotificationContext";
import i18n, { useLanguage } from "../../i18n";
import { useFocusEffect } from "expo-router";

const { width } = Dimensions.get("window");

const TabIcon = ({ focused, icon, title, notificationCount = 0 }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const badgeScale = useSharedValue(notificationCount > 0 ? 1 : 0);

  // Responsive styles - reduced sizes
  const iconSize = width < 350 ? 18 : 22;
  const badgeSize = width < 350 ? 14 : 16;

  // Animation for focused state
  React.useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.15);
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withSpring(1);
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [focused, scale, opacity]);

  // Animation for badge
  React.useEffect(() => {
    badgeScale.value = withSpring(notificationCount > 0 ? 1 : 0);
  }, [notificationCount, badgeScale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    opacity: badgeScale.value,
  }));

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: interpolate(opacity.value, [0, 1], [10, 0]) }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {/* Active Indicator */}
      <Animated.View
        style={[animatedIndicatorStyle, { position: "absolute", top: -8 }]}
      >
        <View
          style={{
            width: 24,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#16A34A",
          }}
        />
      </Animated.View>

      {/* Icon Container */}
      <Animated.View style={[animatedIconStyle, { position: "relative" }]}>
        {/* Icon Background Glow */}
        {focused && (
          <Animated.View
            style={[
              animatedGlowStyle,
              {
                position: "absolute",
                inset: -8,
                borderRadius: 20,
                backgroundColor: "rgba(22, 163, 74, 0.12)",
              },
            ]}
          />
        )}

        {/* Icon — using expo-image for reliable tint across tab switches */}
        <ExpoImage
          source={icon}
          tintColor={focused ? "#16A34A" : "#6B7280"}
          contentFit="contain"
          style={{ width: iconSize, height: iconSize }}
        />

        {/* Notification Badge */}
        {notificationCount > 0 && (
          <Animated.View
            style={[
              animatedBadgeStyle,
              { position: "absolute", top: -8, right: -8 },
            ]}
          >
            <View
              style={{
                borderRadius: badgeSize / 2,
                alignItems: "center",
                justifyContent: "center",
                width: badgeSize,
                height: badgeSize,
                minWidth: badgeSize,
                backgroundColor: "#DC2626",
              }}
            >
              <Text
                style={{ color: "white", fontSize: 10, fontWeight: "bold" }}
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </Text>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const TABS = [
  { id: "Toptabs", name: "Home", icon: icons.home, Component: Home },
  { id: "Explore", name: "Discover", icon: icons.search, Component: Explore },
  { id: "Cart", name: "Cart", icon: icons.cart, Component: Cart },
  {
    id: "Notifications",
    name: "Notifications",
    icon: icons.notifications,
    Component: MyNotificationsScreen,
  },
  { id: "Profile", name: "Profile", icon: icons.profile, Component: Profile },
];

const BottomTabs = () => {
  useLanguage(); // re-render when locale changes
  const { cart } = useCart();
  const { notificationCount } = useNotification();
  const cartCount = cart?.length ?? 0;
  const tabBarHeight = width < 350 ? 60 : 70;
  const [activeTab, setActiveTab] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const insets = useSafeAreaInsets();
  const bottomInset = insets?.bottom || (Platform.OS === "ios" ? 20 : 12);
  const totalTabBarHeight = tabBarHeight + bottomInset;

  useFocusEffect(
    useCallback(() => {
      console.log("📍 BottomTabs: Screen focused");
      setIsFocused(true);
      return () => {
        console.log("📍 BottomTabs: Screen blurred");
        setIsFocused(false);
      };
    }, []),
  );

  const ActiveComponent = TABS[activeTab].Component;

  const renderTabBar = () => {
    return (
      <View
        style={{
          height: totalTabBarHeight,
          paddingTop: 4,
          paddingBottom: bottomInset,
          backgroundColor: "#FFFFFF",
        }}
      >
        <BlurView
          intensity={40}
          tint="light"
          style={{ flex: 1, overflow: "hidden" }}
        >
          <View
            style={{ height: 2, backgroundColor: "#16A34A", width: "100%" }}
          />
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.97)",
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            {TABS.map((tab, index) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(index)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                accessibilityLabel={`${tab.name} tab`}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === index }}
              >
                <TabIcon
                  icon={tab.icon}
                  focused={activeTab === index}
                  title={i18n.t(tab.name)}
                  notificationCount={
                    tab.id === "Cart"
                      ? cartCount
                      : tab.id === "Notifications"
                        ? notificationCount
                        : 0
                  }
                />
              </Pressable>
            ))}
          </View>
        </BlurView>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={{ flex: 1 }}>
        {isFocused && <ActiveComponent />}
      </View>
      {renderTabBar()}
    </View>
  );
};

export default BottomTabs;
