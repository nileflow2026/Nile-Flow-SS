import React, { useEffect } from "react";
import { BackHandler, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const OrderConfiramton = () => {
  const router = useRouter();
  useEffect(() => {
    const onBackPress = () => {
      router.back();
      return true;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [router]);

  return (
    <View className="flex-1 bg-nile-white px-6 items-center justify-center">
      <Text className="text-3xl font-pbold text-nile-green-800 mb-3">
        Thank You!
      </Text>
      <Text className="font-pregular text-base text-gray-500 mb-8 text-center">
        Your order has been placed successfully.
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/")}
        style={{
          backgroundColor: "#16A34A",
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 32,
        }}
      >
        <Text className="text-nile-white text-base font-psemibold">
          Go to Home
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OrderConfiramton;
