import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Modal, Text, TouchableOpacity, View } from "react-native";

const CustomAlertReview = ({ isVisible, onClose, onSignUp }) => {
  const router = useRouter();

  const handleSignUp = () => {
    onSignUp();
    router.push("/(auth)/sign-up");
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <View
          style={{
            borderRadius: 24,
            padding: 24,
            alignItems: "center",
            width: "85%",
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#BBF7D0",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                marginBottom: 8,
                textAlign: "center",
                color: "#14532D",
              }}
            >
              Sign Up Required
            </Text>
            <Text
              style={{
                fontSize: 16,
                textAlign: "center",
                color: "#374151",
                lineHeight: 22,
              }}
            >
              To proceed with your review, please create an account and join our
              premium community.
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 12,
              width: "100%",
            }}
          >
            <TouchableOpacity onPress={onClose} style={{ flex: 1 }}>
              <LinearGradient
                colors={["#dc2626", "#b91c1c"]}
                style={{
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Cancel
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSignUp} style={{ flex: 1 }}>
              <LinearGradient
                colors={["#16A34A", "#15803D"]}
                style={{
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Sign Up
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlertReview;
