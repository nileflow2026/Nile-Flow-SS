import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "./components/CusttomButton";
import { gradients, goldHeroStart, goldHeroEnd } from "../constants/theme";

const Index = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-nile-white">
      <View className="flex-1 items-center justify-center px-6">
        {/* Hero Logo — Gold / Bronze Gradient */}
        <View className="mb-10">
          <LinearGradient
            colors={gradients.goldBronze}
            start={goldHeroStart}
            end={goldHeroEnd}
            style={{
              width: 180,
              height: 180,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <Image
              source={require("../assets/images/newlogo.png")}
              style={{ width: 140, height: 140 }}
              resizeMode="contain"
            />
          </LinearGradient>
        </View>

        {/* Category Label */}
        <Text className="nile-label mb-3">African Marketplace</Text>

        {/* Heading */}
        <Text className="font-pbold text-3xl text-nile-green-900 text-center mb-4 leading-10">
          Welcome to{"\n"}Nile Flow Africa
        </Text>

        {/* Body */}
        <Text className="font-pregular text-base text-gray-500 text-center leading-6 mb-10 max-w-xs">
          Discover authentic African products, support local artisans, and
          experience e-commerce designed for the continent.
        </Text>

        {/* CTA — Green Gradient Button */}
        <CustomButton
          title="Explore African Excellence"
          handlePress={() => router.push("/(tabs)/BottomTabs")}
          containerStyles="w-full"
        />

        {/* Footer */}
        <Text className="font-plight text-xs text-gray-400 text-center mt-6">
          Authentic Commerce · Built for Africa
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default Index;
