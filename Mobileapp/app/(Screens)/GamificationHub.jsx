import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Gift, RefreshCw, Target, Users } from "lucide-react-native";
import { useState } from "react";
import axiosClient from "../../api";
import { Dimensions } from "react-native";
import { StyleSheet } from "react-native";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity, 
  View,
} from "react-native";
const { width } = Dimensions.get("window");

export default function GamificationHub({ userId = "123" }) {
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [spinResult, setSpinResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Daily Check-In
  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.post("/api/gamification/checkin", { userId });
      setStreak(streak + 1);
      Alert.alert("Success", `You earned ${res.data.reward} Nile Miles!`);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to check in");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Spin the Wheel
  const handleSpin = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.post("/api/gamification/spin", { userId });
      setSpinResult(res.data.prize);
      Alert.alert("Spin Result", `🎉 You won: ${res.data.prize}`);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to spin");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Referral
  const handleReferral = async () => {
    setLoading(true);
    try {
      // Example: hardcoding refereeId (replace with real user sign-up flow)
      const refereeId = "456";
      const res = await axiosClient.post("/api/gamification/referral", {
        referrerId: userId,
        refereeId,
      });
      Alert.alert("Referral Sent", res.data.message);
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to send referral",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 p-4 bg-nile-white">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#16A34A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}> 🎮 Gamification Hub</Text>
          
        </View>
      </View>

      {loading && <ActivityIndicator size="large" color="#16A34A" />}

      {/* Daily Check-In */}
      <View className="bg-nile-surface rounded-2xl p-4 mb-4 border border-nile-border">
        <View className="flex-row items-center mb-2">
          <Gift size={20} color="#D97706" />
          <Text className="ml-2 text-lg font-psemibold text-nile-green-900">
            Daily Check-In
          </Text>
        </View>
        <Text className="text-gray-500 mb-3 font-pregular">
          Current streak: {streak} days 🔥
        </Text>
        <TouchableOpacity
          className="py-2 px-4 rounded-xl"
          style={{ backgroundColor: "#16A34A" }}
          onPress={handleCheckIn}
          disabled={loading}
        >
          <Text className="text-nile-white text-center font-psemibold">
            Check In Today
          </Text>
        </TouchableOpacity>
      </View>

      {/* Spin the Wheel */}
      <View className="bg-nile-surface rounded-2xl p-4 mb-4 border border-nile-border">
        <View className="flex-row items-center mb-2">
          <RefreshCw size={20} color="#B45309" />
          <Text className="ml-2 text-lg font-psemibold text-nile-green-900">
            Spin the Wheel
          </Text>
        </View>
        <Text className="text-gray-500 mb-3 font-pregular">
          Try your luck once per day 🎡
        </Text>
        <TouchableOpacity
          className="py-2 px-4 rounded-xl"
          style={{ backgroundColor: "#B45309" }}
          onPress={handleSpin}
          disabled={loading}
        >
          <Text className="text-nile-white text-center font-psemibold">
            Spin Now
          </Text>
        </TouchableOpacity>
        {spinResult && (
          <Text className="mt-2 text-nile-green-600 font-psemibold text-center">
            You won: {spinResult}
          </Text>
        )}
      </View>

      {/* Referrals */}
      <View className="bg-nile-surface rounded-2xl p-4 mb-4 border border-nile-border">
        <View className="flex-row items-center mb-2">
          <Users size={20} color="#16A34A" />
          <Text className="ml-2 text-lg font-psemibold text-nile-green-900">
            Invite Friends
          </Text>
        </View>
        <Text className="text-gray-500 mb-3 font-pregular">
          Earn rewards for every friend who joins Nile Mart 🎁
        </Text>
        <TouchableOpacity
          className="py-2 px-4 rounded-xl"
          style={{ backgroundColor: "#16A34A" }}
          onPress={handleReferral}
          disabled={loading}
        >
          <Text className="text-nile-white text-center font-psemibold">
            Invite Now
          </Text>
        </TouchableOpacity>
      </View>

      {/* Challenges */}
      <View className="bg-nile-surface rounded-2xl p-4 mb-4 border border-nile-border">
        <View className="flex-row items-center mb-2">
          <Target size={20} color="#16A34A" />
          <Text className="ml-2 text-lg font-psemibold text-nile-green-900">
            Active Challenges
          </Text>
        </View>
        <View className="mb-3">
          <Text className="text-gray-700 font-pmedium">
            🛒 Buy 3 Beauty items → Get 20% off
          </Text>
          <View className="h-2 bg-gray-200 rounded-full mt-1">
            <View className="h-2 bg-nile-green-500 rounded-full w-2/3" />
          </View>
          <Text className="text-xs text-gray-500 mt-1 font-plight">
            2/3 completed
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: width < 350 ? 18 : 20,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
})