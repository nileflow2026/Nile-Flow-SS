import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Dimensions, Modal, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");

const RatingModal = ({ visible, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);

  // Responsive styles
  const modalWidth = width < 350 ? "90%" : "80%";
  const starSize = width < 350 ? 40 : 52;
  const buttonPaddingHorizontal = width < 350 ? 8 : 16;
  const buttonPaddingVertical = width < 350 ? 8 : 12;

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        <View
          style={{
            width: modalWidth,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: "#BBF7D0",
            backgroundColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: "#14532D",
                marginBottom: 8,
              }}
            >
              Rate This Product
            </Text>
            <Text
              style={{ fontSize: 14, color: "#6B7280", textAlign: "center" }}
            >
              Share your experience with this premium product
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginBottom: 24,
              gap: 8,
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={{
                  transform: [{ scale: star <= rating ? 1.1 : 1 }],
                  opacity: star <= rating ? 1 : 0.5,
                }}
              >
                <MaterialIcons
                  name={star <= rating ? "star" : "star-border"}
                  size={starSize}
                  color={star <= rating ? "#D97706" : "#D1D5DB"}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1 }}>
              <View
                style={{
                  paddingHorizontal: buttonPaddingHorizontal,
                  paddingVertical: buttonPaddingVertical + 4,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: "#DC2626",
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                >
                  Cancel
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onSubmit(rating)}
              style={{ flex: 1 }}
              disabled={rating === 0}
            >
              <View
                style={{
                  paddingHorizontal: buttonPaddingHorizontal,
                  paddingVertical: buttonPaddingVertical + 4,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: rating > 0 ? "#16A34A" : "#9CA3AF",
                  opacity: rating > 0 ? 1 : 0.5,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                >
                  Submit Rating
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RatingModal;
