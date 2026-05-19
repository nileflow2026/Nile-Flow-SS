import React from "react";
import * as Sentry from "@sentry/react-native";
import { Text, TouchableOpacity, View } from "react-native";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { extra: errorInfo });
    if (__DEV__) {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          className="flex-1 items-center justify-center bg-gray-50 px-6"
          accessibilityLiveRegion="assertive"
        >
          <Text
            className="text-gray-900 text-2xl font-bold mb-3"
            accessibilityRole="header"
          >
            Something went wrong
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            We're sorry for the inconvenience. Please try again.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}
            className="bg-green-600 px-6 py-3 rounded-xl"
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text className="text-white font-semibold text-base">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
