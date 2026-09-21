/* eslint-disable no-unused-vars */
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  BackHandler,
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFavorites } from "../../Context/FavoritesContext";
import { imageForSize, IMAGE_SIZE } from "../../utils/imageOptimizer";

const { width } = Dimensions.get("window");

const Favorites = () => {
  const { favorites, toggleFavorite } = useFavorites();
  console.log("Favorites data:", favorites);
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

  if (favorites.length === 0) {
    return (
      <View className="flex-1 justify-center bg-nile-white items-center">
        <Text className="text-lg text-nile-green-800 font-psemibold">
          No Favorites added yet
        </Text>
      </View>
    );
  }

  // Responsive styles
  const imageWidth = width * 0.33;
  const imageHeight = 150;
  const itemPadding = width < 350 ? 12 : 16;
  const titleFontSize = width < 350 ? 16 : 18;
  const priceFontSize = width < 350 ? 16 : 18;

  return (
    <SafeAreaView className="h-full bg-nile-white">
      <View className="flex-row items-center mb-5 px-2 pt-2">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons
            name="keyboard-arrow-left"
            size={45}
            color={"#16A34A"}
          />
        </TouchableOpacity>
        <View>
          <Text className="text-nile-green-900 text-3xl font-psemibold items-center">
            Your Favorites
          </Text>
        </View>
      </View>
      <View>
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => {
            console.log("item data:", item);
            return (
              <View
                className="flex-row items-center border-b border-nile-border"
                style={{ padding: itemPadding }}
              >
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/(Screens)/ProductDetails",
                      params: { item: JSON.stringify(item) },
                    })
                  }
                  className="bg-nile-surface rounded-lg mb-5"
                >
                  <Image
                    source={{
                      uri: imageForSize(
                        item.productImage || item.image || item.thumbnail,
                        IMAGE_SIZE.SMALL,
                      ),
                    }}
                    className="rounded-3xl mr-3"
                    style={{ width: imageWidth, height: imageHeight }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                    recyclingKey={`fav-${item.$id || item.id}`}
                  />
                </TouchableOpacity>
                <View className="flex-1 pl-4 ml-5 mb-10">
                  <Text
                    className="text-nile-green-900 font-psemibold"
                    numberOfLines={3}
                    ellipsizeMode="tail"
                    style={{ fontSize: titleFontSize }}
                  >
                    {item.productName}
                  </Text>
                  <Text
                    className="text-nile-gold-600 mt-5 font-pmedium"
                    style={{ fontSize: priceFontSize }}
                  >
                    SSP : {item.price}.00
                  </Text>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default Favorites;
