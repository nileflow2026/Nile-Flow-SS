import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";

const FilterModal = ({
  isVisible,
  onClose,
  applyFilters,
  resetFilters,
  initialFilters,
  categories,
  brands /* other filter data */,
}) => {
  const [selectedCategories, setSelectedCategories] = useState(
    initialFilters.categories || [],
  );
  const [priceMin, setPriceMin] = useState(initialFilters.priceMin || "");
  const [priceMax, setPriceMax] = useState(initialFilters.priceMax || "");
  const [selectedBrands, setSelectedBrands] = useState(
    initialFilters.brands || [],
  );
  // ... other filter states

  useEffect(() => {
    // Update local state when initialFilters prop changes (for persistence)
    setSelectedCategories(initialFilters.categories || []);
    setPriceMin(initialFilters.priceMin || "");
    setPriceMax(initialFilters.priceMax || "");
    setSelectedBrands(initialFilters.brands || []);
    // ... update other filter states
  }, [initialFilters]);

  const handleCategorySelect = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(
        selectedCategories.filter((item) => item !== category),
      );
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleApply = () => {
    const filters = {
      categories: selectedCategories,
      priceMin: priceMin,
      priceMax: priceMax,
      brands: selectedBrands,
      // ... other filter values
    };
    applyFilters(filters);
  };

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: "#FFFFFF", padding: 20 }}>
        <Text
          style={{
            color: "#14532D",
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 15,
          }}
        >
          Filter
        </Text>

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{ color: "#374151", fontWeight: "bold", marginBottom: 5 }}
          >
            Categories
          </Text>
          <ScrollView horizontal>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={{
                  backgroundColor: selectedCategories.includes(cat)
                    ? "#16A34A"
                    : "#F3F4F6",
                  padding: 10,
                  borderRadius: 5,
                  marginRight: 10,
                  borderWidth: 1,
                  borderColor: selectedCategories.includes(cat)
                    ? "#16A34A"
                    : "#E5E7EB",
                }}
                onPress={() => handleCategorySelect(cat)}
              >
                <Text
                  style={{
                    color: selectedCategories.includes(cat)
                      ? "#FFFFFF"
                      : "#374151",
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{ color: "#374151", fontWeight: "bold", marginBottom: 5 }}
          >
            Price
          </Text>
          <View style={{ flexDirection: "row" }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: "#F9FAFB",
                color: "#111827",
                padding: 10,
                borderRadius: 5,
                marginRight: 10,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
              placeholder="Min"
              placeholderTextColor="#9CA3AF"
              value={priceMin}
              onChangeText={setPriceMin}
              keyboardType="numeric"
            />
            <Text
              style={{
                color: "#374151",
                alignSelf: "center",
                marginHorizontal: 5,
              }}
            >
              -
            </Text>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: "#F9FAFB",
                color: "#111827",
                padding: 10,
                borderRadius: 5,
                marginLeft: 10,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
              placeholder="Max"
              placeholderTextColor="#9CA3AF"
              value={priceMax}
              onChangeText={setPriceMax}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Add more filter options here (Brand, Color, Size, Style, etc.) */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{ color: "#374151", fontWeight: "bold", marginBottom: 5 }}
          >
            Brand
          </Text>
          <ScrollView horizontal>
            {brands.map((brand) => (
              <TouchableOpacity
                key={brand}
                style={{
                  backgroundColor: selectedBrands.includes(brand)
                    ? "#16A34A"
                    : "#F3F4F6",
                  padding: 10,
                  borderRadius: 5,
                  marginRight: 10,
                  borderWidth: 1,
                  borderColor: selectedBrands.includes(brand)
                    ? "#16A34A"
                    : "#E5E7EB",
                }}
                onPress={() => {
                  if (selectedBrands.includes(brand)) {
                    setSelectedBrands(
                      selectedBrands.filter((item) => item !== brand),
                    );
                  } else {
                    setSelectedBrands([...selectedBrands, brand]);
                  }
                }}
              >
                <Text
                  style={{
                    color: selectedBrands.includes(brand)
                      ? "#FFFFFF"
                      : "#374151",
                  }}
                >
                  {brand}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            marginTop: 30,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: "#6B7280",
              padding: 15,
              borderRadius: 5,
              flex: 1,
              marginRight: 10,
            }}
            onPress={resetFilters}
          >
            <Text style={{ color: "white", textAlign: "center" }}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: "#16A34A",
              padding: 15,
              borderRadius: 5,
              flex: 1,
              marginLeft: 10,
            }}
            onPress={handleApply}
          >
            <Text style={{ color: "white", textAlign: "center" }}>Apply</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{ marginTop: 20, alignSelf: "center" }}
          onPress={onClose}
        >
          <Text style={{ color: "#6B7280" }}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
};

export default FilterModal;
