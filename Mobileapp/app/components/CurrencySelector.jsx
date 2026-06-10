import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import axiosClient from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const currencyFlags = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  NGN: "🇳🇬",
  KES: "🇰🇪",
  // Add more currencies if needed
};

const CurrencySelector = ({ onCurrencyChange }) => {
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState("");

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await axiosClient.get("/api/currencies");
        setCurrencies(response.data.currencies || []);

        const savedCurrency = await AsyncStorage.getItem("userCurrency");
        setSelectedCurrency(savedCurrency || "USD");
      } catch (error) {
        console.error("Error fetching currencies:", error);
      }
    };

    fetchCurrencies();
  }, []);

  const handleCurrencySelect = async (currency) => {
    await AsyncStorage.setItem("userCurrency", currency);
    setSelectedCurrency(currency);
    onCurrencyChange(currency);
  };

  return (
    <View>
      <Text>Select Your Currency:</Text>
      <FlatList
        data={currencies}
        keyExtractor={(item) => item.currency_code}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleCurrencySelect(item.currency_code)}
          >
            <Text style={{ padding: 10 }}>
              {currencyFlags[item.currency_code] || "🏳️"} {item.currency_code}
              {selectedCurrency === item.currency_code ? " ✅" : ""}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default CurrencySelector;
