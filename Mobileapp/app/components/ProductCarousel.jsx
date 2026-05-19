import { useRef, useState } from "react";

import { Image } from "expo-image";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";

const screenWidth = Dimensions.get("window").width;
const ProductCarousel = ({ images }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const onViewRef = useRef((viewableItems) => {
    if (viewableItems.viewableItems.length > 0) {
      setActiveSlide(viewableItems.viewableItems[0].index);
    }
  });

  if (!Array.isArray(images)) {
    return null; // or return a placeholder component or message
  }
  return (
    <>
      <FlatList
        data={images}
        renderItem={({ item }) => {
          return (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                width: screenWidth,
                paddingTop: 12,
              }}
            >
              <Image
                source={{ uri: item }}
                style={{ height: 350, width: 350, borderRadius: 10 }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
                recyclingKey={`carousel-${item}`}
              />
            </View>
          );
        }}
        keyExtractor={(item, index) => index}
        horizontal
        onViewableItemsChanged={onViewRef.current}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="center"
        snapToInterval={screenWidth}
        decelerationRate={"fast"}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginVertical: 10,
        }}
      >
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeSlide && {
                width: 20,
                borderRadius: 32,
              },
              {
                backgroundColor: index === activeSlide ? "#16A34A" : "#D1D5DB",
              },
            ]}
          />
        ))}
      </View>
    </>
  );
};

export default ProductCarousel;

const styles = StyleSheet.create({
  dot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    marginHorizontal: 12,
    backgroundColor: "#16A34A",
  },
});
