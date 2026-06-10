import { Text, TouchableOpacity, View } from "react-native";

const NetworkErrorFallback = ({ onRetry }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    }}
  >
    <View
      style={{
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "#F0FDF4",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#BBF7D0",
      }}
    >
      <Text style={{ fontSize: 38 }}>📡</Text>
    </View>
    <Text
      style={{
        fontSize: 20,
        fontFamily: "Poppins-Bold",
        color: "#111827",
        textAlign: "center",
        marginBottom: 10,
      }}
    >
      Connection Issue
    </Text>
    <Text
      style={{
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 36,
      }}
    >
      {`We couldn't reach Nile Flow right now.`}
      {"\n"}
      Check your connection and try again.
    </Text>
    <TouchableOpacity
      onPress={onRetry}
      activeOpacity={0.8}
      style={{
        backgroundColor: "#16A34A",
        borderRadius: 12,
        paddingVertical: 14,
        width: "100%",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 16,
          fontFamily: "Poppins-Bold",
        }}
      >
        Try Again
      </Text>
    </TouchableOpacity>
    <Text
      style={{
        fontSize: 12,
        color: "#9CA3AF",
        textAlign: "center",
        marginTop: 18,
      }}
    >
      If the problem continues, our team is on it.
    </Text>
  </View>
);

export default NetworkErrorFallback;
