import React from "react";
import { View, Text } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Entypo from "@expo/vector-icons/Entypo";

const RatingStars = ({ rating }) => {
  const filledStars = Math.round(rating);
  return (
    <View className="flex-row items-center space-x-1">
      {[...Array(5)].map((_, index) => (
        <Entypo
          name={index <= filledStars ? "star" : "star-outlined"}
          key={index}
          size={20}
          color={index <= filledStars ? "#D97706" : "#D1D5DB"}
        />
      ))}
    </View>
  );
};

export default RatingStars;
