import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import React from "react";
import { Dimensions, Image, Platform, Text, View } from "react-native";
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
import { useCart } from "../../Context/CartContext_NEW";
import { useNotification } from "../../Context/NotificationContext";
import i18n, { useLanguage } from "../../i18n";

const BottomTab = createBottomTabNavigator();
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

        {/* Icon */}
        <Image
          source={icon}
          tintColor={focused ? "#16A34A" : "#6B7280"}
          resizeMode="contain"
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

const BottomTabs = () => {
  useLanguage(); // re-render when locale changes
  const { cart } = useCart();
  const { notificationCount } = useNotification();
  const cartCount = cart?.length ?? 0;
  const tabBarHeight = width < 350 ? 60 : 70;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <BottomTab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: "absolute",
            borderTopWidth: 0,
            height: tabBarHeight,
            paddingTop: 4,
            paddingBottom: Platform.OS === "ios" ? 20 : 12,
            backgroundColor: "transparent",
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarBackground: () => (
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
                }}
              />
            </BlurView>
          ),
        }}
      >
        <BottomTab.Screen
          name="Toptabs"
          component={Home}
          options={{
            title: "Home",
            tabBarAccessibilityLabel: "Home tab",
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={icons.home}
                focused={focused}
                title={i18n.t("Home")}
              />
            ),
          }}
        />

        {/* <BottomTab.Screen
          name="Feed"
          component={Feed}
          options={{
            title: "Feed",
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={icons.feed}
                focused={focused}
                title={i18n.t("Feed")}
                theme={theme}
              />
            ),
          }}
        /> */}

        <BottomTab.Screen
          name="Explore"
          component={Explore}
          options={{
            title: "Discover",
            tabBarAccessibilityLabel: "Discover tab",
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={icons.search}
                focused={focused}
                title={i18n.t("Discover")}
              />
            ),
          }}
        />

        <BottomTab.Screen
          name="Cart"
          component={Cart}
          options={{
            title: "Cart",
            tabBarAccessibilityLabel:
              cartCount > 0 ? `Cart, ${cartCount} items` : "Cart tab",
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={icons.cart}
                focused={focused}
                title={i18n.t("Cart")}
                notificationCount={cartCount}
              />
            ),
          }}
        />

        {/* {isPremium && ( */}
        {/* <BottomTab.Screen
          name="Create"
          component={CreatorMode}
          options={{
            title: "Create",
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={icons.upload}
                focused={focused}
                title={i18n.t("Create")}
              />
            ),
          }}
        /> */}

        <BottomTab.Screen
          name="Notifications"
          component={MyNotificationsScreen}
          options={{
            title: "Notifications",
            tabBarAccessibilityLabel:
              notificationCount > 0
                ? `Notifications, ${notificationCount} unread`
                : "Notifications tab",
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={icons.notifications}
                focused={focused}
                title={i18n.t("Notifications")}
                notificationCount={notificationCount}
              />
            ),
          }}
        />

        <BottomTab.Screen
          name="Profile"
          component={Profile}
          options={{
            title: "Profile",
            tabBarAccessibilityLabel: "Profile tab",
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={icons.profile}
                focused={focused}
                title={i18n.t("Profile")}
              />
            ),
          }}
        />

        {/* <BottomTab.Screen
          name="Settings"
          component={Settings}
          options={{
            title: "Settings",
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={icons.settings}
                focused={focused}
                title={i18n.t("Settings")}
                theme={theme}
              />
            ),
          }}
        /> */}
      </BottomTab.Navigator>
    </View>
  );
};

export default BottomTabs;
