import { useLocalSearchParams } from "expo-router";
import { FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { useEffect, useState } from "react";
import { useTheme } from "../../Context/ThemeProvider";
import axiosClient from "../../api";

const TrackOrder = () => {
  const { orderId, estimatedDelivery, orderTime } = useLocalSearchParams();
  const [orderStatus, setOrderStatus] = useState(null);
  const { themeStyles } = useTheme();

  useEffect(() => {
    if (!orderId) return;
    const fetchInitialStatus = async () => {
      try {
        const response = await axiosClient.get(
          `/api/orders/tracking/${orderId}`,
        );
        console.log("Initial Order Status:", response.data);
        if (response.data?.success && response.data?.data?.orderStatus) {
          setOrderStatus(response.data.data.orderStatus);
        }
      } catch (error) {
        console.error("Error fetching initial order status:", error);
      }
    };

    fetchInitialStatus();

    // Poll for updates every 15 seconds as fallback
    const interval = setInterval(fetchInitialStatus, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [orderId]);

  const trackingSteps = [
    { status: "Ordered", completed: true },
    {
      status: "Processed",
      completed:
        orderStatus === "Processed" ||
        orderStatus === "Shipped" ||
        orderStatus === "Out for Delivery" ||
        orderStatus === "Delivered",
    },
    {
      status: "Shipped",
      completed:
        orderStatus === "Shipped" ||
        orderStatus === "Out for Delivery" ||
        orderStatus === "Delivered",
    },
    {
      status: "Out for Delivery",
      completed:
        orderStatus === "Out for Delivery" || orderStatus === "Delivered",
    },
    { status: "Delivered", completed: orderStatus === "Delivered" },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: "#FFFFFF" }]}>
      <View style={styles.container}>
        <Text style={styles.title}>Track Your Order</Text>
        <Text style={styles.subtitle}>Order ID: {orderId}</Text>

        {/* Tracking Steps */}
        <FlatList
          data={trackingSteps}
          keyExtractor={(item) => item.status}
          renderItem={({ item }) => (
            <View
              style={styles.stepContainer}
              accessibilityLabel={`${item.status}: ${item.completed ? "completed" : "pending"}`}
            >
              <MaterialIcons
                name={
                  item.completed ? "check-circle" : "radio-button-unchecked"
                }
                size={22}
                color={item.completed ? "#16A34A" : "#D1D5DB"}
                style={{ marginRight: 10 }}
              />
              <Text
                style={[styles.stepText, item.completed && styles.completed]}
              >
                {item.status}
              </Text>
            </View>
          )}
        />

        {/* Order Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Order Details</Text>
          <Text style={styles.detailText}>Order Time: {orderTime}</Text>
          <Text style={styles.detailText}>
            Estimated Delivery: {estimatedDelivery}
          </Text>
          <Text style={styles.detailText}>
            Order Status:{" "}
            <Text
              style={[
                styles.statusText,
                orderStatus === "Delivered" ? styles.delivered : styles.pending,
              ]}
            >
              {orderStatus}
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TrackOrder;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#14532D",
    marginBottom: 10,
    fontFamily: "Poppins-Bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 20,
    fontFamily: "Poppins-Regular",
  },
  stepContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },
  stepText: {
    fontSize: 16,
    color: "#374151",
    fontFamily: "Poppins-Regular",
  },
  completed: {
    color: "#16A34A",
    fontFamily: "Poppins-SemiBold",
  },
  detailsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  detailTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#14532D",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 5,
    fontFamily: "Poppins-Regular",
  },
  statusText: {
    fontFamily: "Poppins-SemiBold",
  },
  delivered: {
    color: "#16A34A",
  },
  pending: {
    color: "#D97706",
  },
});
