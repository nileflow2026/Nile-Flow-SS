import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FeaturedProducts from "../components/FeaturedProducts";

const FeaturedProductsScreen = () => (
  <SafeAreaView style={styles.container}>
    <FeaturedProducts fullScreen />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});

export default FeaturedProductsScreen;
