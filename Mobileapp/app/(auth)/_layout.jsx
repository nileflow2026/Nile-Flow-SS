import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const _layout = () => {
  return (
    <>
      {/* 
        StatusBar: Removed backgroundColor attribute to avoid deprecated Window.setStatusBarColor API.
        Edge-to-edge display is now handled by the new WindowInsets API in gradle.properties.
      */}
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FFFFFF" },
          animation: "slide_from_right",
        }}
      />
    </>
  );
};

export default _layout;
