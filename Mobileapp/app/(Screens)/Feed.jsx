import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import NileMilesDisplay from "../components/SocialFeed/NileMilesDisplay";
import SocialFeed from "../components/SocialFeed/SocialFeed";

/**
 * Feed - Main social commerce feed screen
 * Replaces traditional home screen with TikTok-style vertical scroll
 * Core engagement hub for Nile Mart social commerce experience
 */
export default function Feed() {
  return (
    <View style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
      <StatusBar style="dark" />

      {/* Nile Miles display - floating on top */}
      <View style={styles.milesContainer}>
        <NileMilesDisplay />
      </View>

      <SocialFeed />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  milesContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
});
