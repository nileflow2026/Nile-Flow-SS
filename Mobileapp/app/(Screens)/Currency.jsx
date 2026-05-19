import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Config, databases, Query } from "../../Appwrite";
import { useGlobalContext } from "../../Context/GlobalProvider";

const { width } = Dimensions.get("window");

const currencyFlags = {
  USD: "🇺🇸",
  SSP: "🇸🇸",
  KES: "🇰🇪",
  UGX: "🇺🇬",
  ETB: "🇪🇹",
};

const currencyNames = {
  USD: "US Dollar",
  SSP: "South Sudanese Pound",
  KES: "Kenyan Shilling",
  UGX: "Ugandan Shilling",
  ETB: "Ethiopian Birr",
};

const Currency = ({ onCurrencyChange = () => {} }) => {
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState("SSP");
  const [loading, setLoading] = useState(true);
  const { user } = useGlobalContext();
  const router = useRouter();

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await databases.listDocuments(
          Config.databaseId,
          Config.currenciesCollection,
          [Query.equal("currency_code", ["USD", "SSP"])],
        );
        setCurrencies(response.documents);

        const savedCurrency = await AsyncStorage.getItem("userCurrency");
        setSelectedCurrency(savedCurrency || "SSP");
      } catch (error) {
        console.error("❌ Error fetching currencies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrencies();
  }, []);

  const handleCurrencySelect = async (currency) => {
    try {
      await AsyncStorage.setItem("userCurrency", currency);
      setSelectedCurrency(currency);
      onCurrencyChange(currency);

      if (user?.$id) {
        await databases.updateDocument(
          Config.databaseId,
          Config.userCollectionId,
          user.$id,
          { currency },
        );
      }
    } catch (error) {
      console.error("❌ Error updating currency:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#16A34A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Currency</Text>
            <Text style={styles.headerSubtitle}>
              Choose your preferred currency
            </Text>
          </View>
        </View>

        {/* Auto-detect notice */}
        <View style={styles.noticeCard}>
          <MaterialIcons name="my-location" size={18} color="#10b981" />
          <Text style={styles.noticeText}>
            Currency is auto-detected from your location. You can override it
            below.
          </Text>
          </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#16A34A" size="large" />
          </View>
        ) : (
          <FlatList
            data={currencies}
            keyExtractor={(item) => item.currency_code}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => {
              const isSelected = selectedCurrency === item.currency_code;
              return (
                <TouchableOpacity
                  onPress={() => handleCurrencySelect(item.currency_code)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.currencyCard,
                      isSelected && styles.currencyCardSelected,
                    ]}
                  >
                    <Text style={styles.flag}>
                      {currencyFlags[item.currency_code] ?? "🏳️"}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.currencyCode,
                          isSelected && { color: "#FCD34D" },
                        ]}
                      >
                        {item.currency_code}
                      </Text>
                      <Text style={styles.currencyName}>
                        {currencyNames[item.currency_code] ??
                          item.currency_name ??
                          ""}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <MaterialIcons name="check" size={18} color="#16A34A" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              <View style={styles.infoCard}>
                <MaterialIcons name="info-outline" size={16} color="#9CA3AF" />
                <Text style={styles.infoText}>
                  Selecting a currency will update product prices to match the
                  exchange rate.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: width < 350 ? 18 : 20,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  noticeText: {
    flex: 1,
    color: "#374151",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Poppins-Regular",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  currencyCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    padding: 16,
    gap: 14,
  },
  currencyCardSelected: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  flag: {
    fontSize: 28,
  },
  currencyCode: {
    color: "#111827",
    fontFamily: "Poppins-Bold",
    fontSize: width < 350 ? 15 : 16,
  },
  currencyName: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  checkBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  infoText: {
    flex: 1,
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Poppins-Regular",
  },
});

export default Currency;
