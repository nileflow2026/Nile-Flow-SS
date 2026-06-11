 
// components/ReviewList.js
import { Image } from "expo-image";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const ReviewList = ({
  reviews = [],
  initialReviewCount = 2,
  showAllReviews = false,
  setShowAllReviews,
  reviewFontSize = width < 350 ? 14 : 16,
  marginVertical = width < 350 ? 8 : 12,
}) => {
  const displayedReviews = showAllReviews
    ? reviews
    : reviews.slice(0, initialReviewCount);

  const renderReview = ({ item }) => (
    <View style={{ marginVertical }}>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}
      >
        <Image
          source={
            item.avatarUrl && item.avatarUrl.trim() !== ""
              ? { uri: item.avatarUrl }
              : require("../../assets/themes/default-bg.png")
          }
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />

        <Text
          style={{
            fontSize: reviewFontSize,
            color: "#111827",
            fontWeight: "600",
          }}
        >
          {item.userName}
        </Text>
      </View>

      {item.rating > 0 && (
        <View style={{ flexDirection: "row", marginBottom: 6 }}>
          {Array.from({ length: item.rating }).map((_, index) => (
            <Text
              key={`star-${item.id}-${index}`}
              style={{ color: "#D97706", marginRight: 2, fontSize: 20 }}
            >
              ★
            </Text>
          ))}
        </View>
      )}

      {item.text && (
        <Text style={{ fontSize: reviewFontSize, color: "#374151" }}>
          {item.text}
        </Text>
      )}

      <Text style={[styles.date, { fontSize: reviewFontSize }]}>
        Posted on: {item.date}
      </Text>
    </View>
  );

  return (
    <View>
      <FlatList
        data={displayedReviews}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={renderReview}
      />
      {reviews.length > initialReviewCount && (
        <TouchableOpacity onPress={() => setShowAllReviews(!showAllReviews)}>
          <Text style={[styles.toggleText, { fontSize: reviewFontSize }]}>
            {showAllReviews ? "Show Less" : "See All"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ReviewList;

const styles = StyleSheet.create({
  userName: {
    color: "#111827",
    fontWeight: "bold",
  },
  reviewText: {
    color: "#374151",
    paddingVertical: 6,
  },
  date: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 6,
    color: "#6B7280",
  },
  toggleText: {
    color: "#16A34A",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },
});
