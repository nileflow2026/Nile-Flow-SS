import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, Text, TouchableOpacity } from "react-native";
import {
  gradients,
  greenButtonStart,
  greenButtonEnd,
} from "../../constants/theme";

const { width } = Dimensions.get("window");

const CusttomButton = ({
  title,
  handlePress,
  containerStyles,
  textStyles,
  isLoading,
}) => {
  const responsiveMinHeight = width < 350 ? 50 : 62;
  const responsiveTextSize = width < 350 ? "text-base" : "text-lg";

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      className={`rounded-xl overflow-hidden ${containerStyles} ${isLoading ? "opacity-50" : ""}`}
      disabled={isLoading}
      style={{ minHeight: responsiveMinHeight }}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
    >
      <LinearGradient
        colors={gradients.green}
        start={greenButtonStart}
        end={greenButtonEnd}
        style={{
          flex: 1,
          minHeight: responsiveMinHeight,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <Text
          className={`font-psemibold ${responsiveTextSize} text-nile-white ${textStyles}`}
        >
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default CusttomButton;
