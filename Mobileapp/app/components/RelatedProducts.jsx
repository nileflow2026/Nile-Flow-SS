// components/RelatedProducts.js
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Dimensions, FlatList, Text, View } from "react-native";
import ProductCard from "./ProductCard";

const { width } = Dimensions.get("window");

const RelatedProducts = ({ relatedProducts = [], ratings = {} }) => {
  const router = useRouter();
  const titleFontSize = width < 350 ? 18 : 20;
  const descFontSize = width < 350 ? 14 : 16;

  if (relatedProducts.length === 0) {
    return (
      <View style={{ marginTop: 16, marginBottom: 32, paddingHorizontal: 16 }}>
        <View
          style={{
            padding: 20,
            borderRadius: 24,
            backgroundColor: "#F0FDF4",
            borderWidth: 1,
            borderColor: "#BBF7D0",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text
            style={{
              color: "#6B7280",
              fontSize: descFontSize,
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            No related products available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 16, marginBottom: 32, paddingHorizontal: 16 }}>
      <View
        style={{
          padding: 20,
          borderRadius: 24,
          backgroundColor: "#F0FDF4",
          borderWidth: 1,
          borderColor: "#BBF7D0",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: "#DCFCE7",
              borderWidth: 1,
              borderColor: "#BBF7D0",
              gap: 8,
            }}
          >
            <MaterialIcons name="recommend" size={20} color="#16A34A" />
            <Text
              style={{
                fontSize: titleFontSize,
                fontWeight: "bold",
                color: "#14532D",
              }}
            >
              Related Products
            </Text>
            <MaterialIcons name="arrow-forward" size={16} color="#16A34A" />
          </View>
        </View>

        <FlatList
          data={relatedProducts}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) =>
            item?.$id?.toString() || index.toString()
          }
          renderItem={({ item }) => {
            // Get the specific rating and count object for this item,
            // defaulting to an object with zero values if not found.
            const itemRatingData = ratings[item.$id] || {
              averageRating: 0,
              totalCount: 0,
            };

            return (
              <View style={{ marginRight: 12 }}>
                <ProductCard
                  product={{
                    $id: item.$id,
                    id: item.$id,
                    productName: item.productName,
                    price: item.price,
                    image: item.image,
                    brand: item.brand,
                    stock: item.stock || 10,
                    isOnSale: item.isOnSale || false,
                    originalPrice: item.originalPrice,
                    shipping: true,
                    description: item.description,
                  }}
                  premium={true}
                  onPress={() =>
                    router.push({
                      pathname: "/(Screens)/ProductDetails",
                      params: { item: JSON.stringify(item) },
                    })
                  }
                />
              </View>
            );
          }}
          style={{ marginTop: 4 }}
        />
      </View>
    </View>
  );
};

export default RelatedProducts;
