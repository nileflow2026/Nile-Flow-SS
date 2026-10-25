import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import images from "../../constants/images";
import { neutral, green } from "../../constants/theme/colors";
import { imageForSize, IMAGE_SIZE } from "../../utils/imageOptimizer";

function BusinessCard({ business, onPress, compact = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = business.coverImage || business.profileImage;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${business.name} business profile`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.compactCard : styles.directoryCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={
            imageFailed || !imageUrl
              ? images.brandLogo
              : { uri: imageForSize(imageUrl, IMAGE_SIZE.MEDIUM) }
          }
          style={styles.coverImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
          accessibilityLabel={`${business.name} storefront`}
          onError={() => setImageFailed(true)}
        />
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>Active business</Text>
        </View>
      </View>

      <View style={styles.content}>
        {business.category ? (
          <Text numberOfLines={1} style={styles.category}>
            {business.category}
          </Text>
        ) : null}
        <Text numberOfLines={2} style={styles.name} selectable>
          {business.name}
        </Text>
        {business.location ? (
          <Text numberOfLines={1} style={styles.location} selectable>
            {business.location}
          </Text>
        ) : null}
        <View style={styles.visitRow}>
          <Text style={styles.visitText}>Visit business</Text>
          <Ionicons name="arrow-forward" size={16} color={green[700]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: neutral.border,
    backgroundColor: neutral.surface,
  },
  compactCard: {
    width: 264,
  },
  directoryCard: {
    flex: 1,
  },
  pressed: {
    opacity: 0.88,
  },
  imageContainer: {
    height: 132,
    backgroundColor: neutral.surface,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  activeBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: neutral.white,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeBadgeText: {
    color: green[800],
    fontSize: 11,
    fontWeight: "700",
  },
  content: {
    gap: 6,
    padding: 12,
  },
  category: {
    color: green[700],
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  name: {
    height: 40,
    color: neutral.heading,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  location: {
    color: neutral.body,
    fontSize: 12,
  },
  visitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  visitText: {
    color: green[700],
    fontSize: 13,
    fontWeight: "700",
  },
});

export default BusinessCard;
