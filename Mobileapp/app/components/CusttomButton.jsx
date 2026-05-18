import React from "react";
import { Dimensions, Text, TouchableOpacity } from "react-native";

const { width } = Dimensions.get("window");

const CusttomButton = ({
  title,
  handlePress,
  containerStyles,
  textStyles,
  isLoading,
}) => {
  // Determine responsive styles based on screen width
  const responsiveMinHeight = width < 350 ? 50 : 62;
  const responsiveTextSize = width < 350 ? "text-base" : "text-lg";

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={` rounded-xl justify-center items-center ${containerStyles} ${isLoading ? "opacity-50" : ""}`}
      disabled={isLoading}
      style={{ minHeight: responsiveMinHeight, backgroundColor: "#D96B29" }}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
    >
      <Text
        className={`font-bold font-psemibold ${responsiveTextSize} ${textStyles}`}
        style={{ color: "white" }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default CusttomButton;
