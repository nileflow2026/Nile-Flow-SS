// components/RelatedProductCard.js
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import images from "../../constants/images";

const RelatedProductCard = ({
  id,
  title,
  image,
  price,
  rating,
  totalRatings,
  onPress,
}) => {
  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <MaterialIcons
        key={star}
        name={star <= rating ? "star" : "star-border"}
        size={14}
        color={star <= rating ? "#D97706" : "#D1D5DB"}
        style={{ marginRight: 2 }}
      />
    ));
  };
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image }}
            placeholder={images.Nilelogo}
            placeholderContentFit="contain"
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />

          {/* Premium Badge */}
          <View style={styles.premiumBadge}>
            <MaterialIcons name="star" size={12} color="#fff" />
          </View>
        </View>

        <View style={styles.productInfo}>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
          <Text style={styles.price}>${price.toFixed(2)}</Text>

          <View style={styles.ratingSection}>
            <View style={styles.starsContainer}>{renderStars()}</View>
            <Text style={styles.ratingCount}>({totalRatings})</Text>
          </View>

          {/* Rating Score Badge */}
          <View style={styles.ratingBadge}>
            <MaterialIcons name="star" size={10} color="#D97706" />
            <Text style={styles.ratingScore}>{rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Bottom Accent Line */}
        <View style={styles.accentLine} />
      </View>
    </TouchableOpacity>
  );
};

export default RelatedProductCard;

const styles = StyleSheet.create({
  container: {
    width: 140,
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F9FAFB",
  },
  imageContainer: {
    height: 120,
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  premiumBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D97706",
  },
  productInfo: {
    padding: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
    minHeight: 32,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16A34A",
    marginBottom: 8,
  },
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingCount: {
    fontSize: 10,
    color: "#6B7280",
    marginLeft: 4,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FEF3C7",
    gap: 3,
  },
  ratingScore: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
  },
  accentLine: {
    height: 2,
    width: "70%",
    alignSelf: "center",
    borderRadius: 1,
    backgroundColor: "#16A34A",
    marginVertical: 6,
  },
});
