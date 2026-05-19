import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

const ReviewForm = ({
  reviewText,
  setReviewText,
  selectedImage,
  setSelectedImage,
  handleAddReview,
  handlePickimage,
  reviewFontSize,
  paddingHorizontal,
  paddingVertical,
  buttonFontSize,
}) => {
  return (
    <View className="mb-6">
      <TextInput
        value={reviewText}
        onChangeText={setReviewText}
        placeholder="Let Us Know About the Product"
        placeholderTextColor={"#9CA3AF"}
        className="flex-1 rounded-lg px-4 py-2"
        style={{
          fontSize: reviewFontSize,
          borderWidth: 1,
          borderColor: "#BBF7D0",
          backgroundColor: "#F0FDF4",
          color: "#111827",
        }}
      />

      <TouchableOpacity
        onPress={handlePickimage}
        className="px-4 py-2 ml-2 mt-4 font-semibold rounded-lg mb-4 flex-row items-center justify-center"
        style={{
          paddingHorizontal,
          paddingVertical,
          backgroundColor: "#16A34A",
        }}
      >
        <Text
          className="font-psemibold"
          style={{ fontSize: buttonFontSize, color: "#FFFFFF" }}
        >
          Pick an Image
        </Text>
      </TouchableOpacity>

      {selectedImage && (
        <Image
          source={{ uri: selectedImage }}
          className="w-full h-40 mb-4 rounded-lg"
        />
      )}

      <TouchableOpacity
        onPress={handleAddReview}
        className="ml-2 px-4 py-2 rounded-lg"
        style={{
          paddingHorizontal,
          paddingVertical,
          backgroundColor: "#16A34A",
        }}
      >
        <Text
          className="font-psemibold"
          style={{ fontSize: buttonFontSize, color: "#FFFFFF" }}
        >
          Post Review
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ReviewForm;
