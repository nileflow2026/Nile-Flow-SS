import { icons } from "@/constants";
import { useState } from "react";
import {
  Dimensions,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../Context/ThemeProvider";

const { width } = Dimensions.get("window");

const FormField = ({
  title,
  value,
  placeholder,
  handleChangeText,
  otherStyles,
  ...props
}) => {
  const [showpassword, setShowpassword] = useState(false);
  const { theme, themeStyles } = useTheme();
  const isDarkMode = theme === "dark";
  const themedText = isDarkMode ? "text-white" : "text-black";
  const isPasswordField = title === "Password";

  // Determine responsive styles based on screen width
  const responsiveHeight = width < 350 ? 50 : 64;
  const responsiveTextSize = width < 350 ? "text-sm" : "text-base";

  return (
    <View className={`space-y-2 ${otherStyles}`}>
      <Text
        className={`${themedText} font-pmedium ${responsiveTextSize}`}
        style={{ color: "white" }}
      >
        {title}
      </Text>
      <View
        className={`border-2  border-black-200 w-full px-4   rounded-2xl items-center flex-row`}
        style={{
          backgroundColor: themeStyles.accent,
          height: responsiveHeight,
        }}
      >
        <TextInput
          className={`flex-1 ${themedText} font-psemibold ${responsiveTextSize}`}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
          onChangeText={handleChangeText}
          secureTextEntry={isPasswordField && !showpassword}
          accessibilityLabel={title}
          accessibilityHint={
            isPasswordField ? "Enter your password" : undefined
          }
          {...props}
        />
        {isPasswordField && (
          <TouchableOpacity
            onPress={() => setShowpassword(!showpassword)}
            accessibilityRole="button"
            accessibilityLabel={
              showpassword ? "Hide password" : "Show password"
            }
          >
            <Image
              source={!showpassword ? icons.eye : icons.eyeHide}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default FormField;
