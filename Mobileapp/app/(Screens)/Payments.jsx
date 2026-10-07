/* eslint-disable react-hooks/purity */
 
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  CheckCircle,
  DollarSign,
  Gem,
  Lock,
  Shield,
  Sparkles,
} from "lucide-react-native";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import axiosClient from "../../api";
import images from "../../constants/images";
import { useCart } from "../../Context/CartContext_NEW";
import {
  createNotification,
  getCurrentUser,
} from "../../Context/GlobalProvider";

const { width } = Dimensions.get("window");

const getCheckoutRequestMetadata = async (userId, checkoutAddress) => {
  const deliveryAddressId = checkoutAddress?.$id || checkoutAddress?.id;
  if (!userId || !deliveryAddressId) {
    throw new Error("Confirm a delivery address before starting checkout.");
  }

  const storageKey = `checkoutAttemptId:${userId}`;
  try {
    let checkoutAttemptId = await AsyncStorage.getItem(storageKey);
    if (!checkoutAttemptId) {
      checkoutAttemptId = Crypto.randomUUID();
      await AsyncStorage.setItem(storageKey, checkoutAttemptId);
    }

    return {
      addressConfirmationVersion: 1,
      deliveryAddressId,
      checkoutAttemptId,
    };
  } catch (error) {
    console.error("Could not prepare the checkout attempt:", error);
    throw new Error("Checkout could not be prepared. Please try again.");
  }
};

const clearCheckoutAttempt = async (userId) => {
  if (!userId) return;
  try {
    await AsyncStorage.removeItem(`checkoutAttemptId:${userId}`);
  } catch (error) {
    console.error("Could not clear the completed checkout attempt:", error);
  }
};

const Payments = () => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const { cart, clearCart, checkoutAddress } = useCart();
  const [orderId, setOrderId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const router = useRouter();
  useEffect(() => {
    const onBackPress = () => {
      try {
        router.back();
      } catch (_) {
        router.replace("/(tabs)/BottomTabs");
      }
      return true;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [router]);
  const [createdAt, setCreatedAt] = useState(null);
  const [estimatedDelivery, setEstimatedDelivery] = useState(null);
  const [currency, setCurrency] = useState("KES");
  const [navigationTrigger, setNavigationTrigger] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [pesapalLoading, setPesapalLoading] = useState(false);
  const [paymentPolling, setPaymentPolling] = useState(false);
  // Ref to cancel M-Pesa polling when the component unmounts
  const cancelPollRef = useRef(false);
  // Ref to track if we've already processed the current navigation trigger
  const navigationProcessedRef = useRef(false);
  const paymentStartRef = useRef(false);

  // Cancel any in-progress M-Pesa polling on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      cancelPollRef.current = true;
    };
  }, []);

  // Debug router on component mount
  useEffect(() => {
    console.log("🔍 Router initialized:", {
      hasRouter: !!router,
      hasPush: !!(router && router.push),
      routerType: typeof router,
    });
  }, [router]);

  // Handle navigation in useEffect to avoid async context issues
  useEffect(() => {
    if (navigationTrigger && !navigationProcessedRef.current) {
      navigationProcessedRef.current = true;
      console.log("🧭 Navigation triggered:", navigationTrigger);
      try {
        if (router && router.push) {
          // For COD orders, paymentTime should be null/empty since no payment has been made
          // For actual payment methods (M-Pesa, card, etc.), paymentTime is the current time
          const isActualPayment = navigationTrigger.type !== "pod";

          // Pass order data as parameters - use captured data from navigation trigger
          router.push({
            pathname: "/(Screens)/OrdersScreen",
            params: {
              orderId: navigationTrigger.orderId || "N/A",
              totalAmount: navigationTrigger.totalAmount || totalAmount || 0,
              paymentMethod:
                navigationTrigger.paymentMethod || "Cash on Delivery",
              orderTime: new Date().toLocaleString(),
              paymentTime: isActualPayment ? new Date().toLocaleString() : null,
              productsAmount:
                navigationTrigger.productsAmount ||
                navigationTrigger.totalAmount ||
                totalAmount ||
                0,
              orderStatus: navigationTrigger.orderStatus || "Processing",
              estimatedDelivery: new Date(
                Date.now() + 3 * 24 * 60 * 60 * 1000,
              ).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              paymentRef: navigationTrigger.paymentRef || `REF-${Date.now()}`,
              items: navigationTrigger.cartItems || JSON.stringify(cart || []),
            },
          });
        } else {
          Alert.alert(
            "Success",
            "Order completed successfully! Please check your orders in the profile section.",
          );
        }
      } catch (navError) {
        console.error("Navigation error:", navError);
        Alert.alert(
          "Success",
          "Order completed successfully! Please check your orders in the profile section.",
        );
      } finally {
        setNavigationTrigger(null); // Reset trigger after navigation attempt
      }
    }
  }, [navigationTrigger, router, totalAmount, cart]);

  // Reset the ref when navigationTrigger becomes null to allow next navigation
  useEffect(() => {
    if (!navigationTrigger) {
      navigationProcessedRef.current = false;
    }
  }, [navigationTrigger]);

  useEffect(() => {
    if (cart.length > 0) {
      // price is an enriched object { currency, convertedPrice, raw, displayValue }
      const cartCurrency = cart[0].price?.currency || "KES";
      setCurrency(cartCurrency);
    }

    // Resolve numeric value from enriched price object or plain number
    const resolvePrice = (price) => {
      if (price && typeof price === "object")
        return price.convertedPrice ?? price.raw ?? 0;
      return typeof price === "number" ? price : parseFloat(price) || 0;
    };

    setTotalAmount(
      cart.reduce(
        (sum, item) => sum + resolvePrice(item.price) * (item.quantity || 1),
        0,
      ),
    );
  }, [cart]);

  const paymentMethods = [
    {
      id: "pod",
      name: "Payment on Delivery",
      icon: DollarSign,
      gradient: ["#10B981", "#059669"],
      description: "Pay when you receive your order",
      features: [
        "No online payment",
        "Pay at doorstep",
        "Extra charges may apply",
      ],
    },
    {
      id: "pesapal",
      name: "Pesapal",
      image: images.pesapal,
      gradient: ["#8B5CF6", "#7C3AED"],
      description: "Cards, M-Pesa, Airtel Money, and more",
      features: ["Instant", "Secure", "Trusted checkout"],
    },
    /* {
      id: "mobile",
      name: "M-Pesa",
      icon: DollarSign,
      gradient: ["#10B981", "#059669"],
      description: "Pay directly with your M-Pesa number",
      features: ["Instant", "Secure", "Popular in Kenya"],
    }, */
  ];

  const handleCashOnDelivery = async (user, token, checkoutMetadata) => {
    const now = new Date();
    const deliveryDate = new Date(now);
    deliveryDate.setDate(now.getDate() + 3);
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const estimatedDelivery = deliveryDate.toLocaleDateString("en-US", options);

    try {
      // Validate required fields before making the request
      const userId = user?.id || user?.$id;
      const customerEmail = user?.email;
      const username = user?.username || user?.email;
      const orderCurrency = currency || "KES";

      console.log("=== POD PAYMENT VALIDATION ===");
      console.log("User object:", JSON.stringify(user, null, 2));
      console.log("User ID:", userId);
      console.log("Customer Email:", customerEmail);
      console.log("Username:", username);
      console.log("Total Amount:", totalAmount);
      console.log("Currency:", orderCurrency);
      console.log("Cart:", JSON.stringify(cart, null, 2));

      // Validate required fields
      if (!userId) {
        Alert.alert("Error", "User ID is missing. Please log in again.");
        return;
      }
      if (!customerEmail) {
        Alert.alert("Error", "Email is missing. Please update your profile.");
        return;
      }
      if (!username) {
        Alert.alert(
          "Error",
          "Username is missing. Please update your profile.",
        );
        return;
      }
      if (!totalAmount || totalAmount <= 0) {
        Alert.alert("Error", "Invalid total amount.");
        return;
      }
      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        Alert.alert("Error", "Cart is empty.");
        return;
      }

      // Capture order creation timestamp right before API call
      const orderTimestamp = Date.now();

      const payload = {
        cart,
        userId: userId,
        customerEmail: customerEmail,
        username: username,
        paymentMethod: "Payment on Delivery",
        totalAmount: parseFloat(totalAmount).toFixed(2),
        currency: orderCurrency,
        status: "Pending", // Set a status for POD orders
        ...checkoutMetadata,
      };

      console.log("Submitting cash on delivery checkout");

      const apiResponse = await axiosClient.post(
        "/api/payments/cash-on-delivery", // Ensure you have a dedicated backend endpoint for creating orders
        payload,
      );

      const result = apiResponse.data;
      if (!result.success) {
        Alert.alert("Order Failed", result.message || "Failed to create order");
        return;
      }

      if (!result.orderId) {
        throw new Error("Failed to create POD order.");
      }

      // Ensure totalAmount is a valid number before using .toFixed()
      const validTotalAmount =
        typeof totalAmount === "number"
          ? totalAmount
          : parseFloat(totalAmount) || 0;

      console.log("=== CREATING NOTIFICATION ===");
      console.log("Notification data:", {
        orderId: result.orderId,
        customerEmail,
        totalAmount: validTotalAmount,
        formattedAmount: validTotalAmount.toFixed(2),
      });

      try {
        await createNotification({
          message: `🛍️ New POD order #${result.orderId} placed by ${customerEmail} for ${orderCurrency} ${Math.round(validTotalAmount)}.`,
          type: "userNotification",
          username: username,
          userId: userId,
          email: customerEmail,
        });
        console.log("✅ Notification created successfully");
      } catch (notificationError) {
        console.error("❌ Notification creation failed:", notificationError);
        // Continue execution even if notification fails
      }

      console.log(
        "✅ Order completed successfully! Email already sent by backend.",
      );

      await clearCheckoutAttempt(userId);

      // Clear cart after successful payment
      console.log("🛒 Clearing cart after successful payment...");
      await clearCart();
      console.log("✅ Cart cleared successfully");

      // Trigger navigation via state to avoid async context issues
      console.log("🧭 Triggering navigation via state...");
      setNavigationTrigger({
        type: "pod",
        orderId: result.orderId,
        paymentMethod: "Payment on Delivery",
        orderStatus: "Pending",
        paymentRef: `POD-${result.orderId}`,
        totalAmount: totalAmount, // Capture amount before cart is cleared
        productsAmount: totalAmount,
        cartItems: JSON.stringify(cart), // Capture cart before it's cleared
        timestamp: orderTimestamp,
      });
      return true;
    } catch (error) {
      console.error("=== POD CHECKOUT ERROR ===");
      console.error("Full error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "An unexpected error occurred during checkout";

      Alert.alert("POD Checkout Error", errorMessage);
      return false;
    }
  };

  const handleMpesaPayment = async (user, token, checkoutMetadata) => {
    try {
      // Validate phone number
      if (!phoneNumber || phoneNumber.trim().length === 0) {
        Alert.alert("Error", "Please enter your M-Pesa phone number.");
        return;
      }

      // Basic phone number validation
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
      if (cleanPhone.length < 10) {
        Alert.alert("Error", "Please enter a valid phone number.");
        return;
      }

      setMpesaLoading(true);

      const userId = user?.id || user?.$id;
      const customerEmail = user?.email;
      const username = user?.username || user?.email;
      const orderCurrency = currency || "KES";

      console.log("=== M-PESA PAYMENT INITIATION ===");
      console.log("Amount:", totalAmount);
      console.log("Currency:", orderCurrency);

      const payload = {
        phoneNumber: phoneNumber.trim(),
        amount: parseFloat(totalAmount),
        accountReference: `ORDER_${Date.now()}`,
        transactionDesc: `Payment for Nile Mart Order`,
        userId: userId,
        cart,
        customerEmail,
        username,
        currency: orderCurrency,
        ...checkoutMetadata,
      };

      console.log("Submitting M-Pesa checkout");

      const apiResponse = await axiosClient.post(
        "/api/payments/mpesa/initiate",
        payload,
      );

      const result = apiResponse.data;
      if (!result.success) {
        Alert.alert(
          "M-Pesa Error",
          result.message || "Failed to initiate payment",
        );
        return;
      }

      // Show STK push sent message
      Alert.alert(
        "M-Pesa Payment",
        "Please check your phone and enter your M-Pesa PIN to complete the payment.",
        [{ text: "OK" }],
      );

      // Start polling for payment status
      await pollMpesaPaymentStatus(result.orderId, user);

      return true;
    } catch (error) {
      console.error("=== M-PESA PAYMENT ERROR ===");
      console.error("Full error:", error);
      console.error("Error response:", error.response?.data);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to initiate M-Pesa payment";

      Alert.alert("M-Pesa Payment Error", errorMessage);
      return false;
    } finally {
      setMpesaLoading(false);
    }
  };

  const pollMpesaPaymentStatus = async (orderId, user) => {
    setPaymentPolling(true);
    let attempts = 0;
    const maxAttempts = 30; // Poll for 5 minutes (10 second intervals)

    const poll = async () => {
      try {
        const response = await axiosClient.get(
          `/api/payments/mpesa/status/${orderId}`,
        );
        const status = response.data;

        console.log(`M-Pesa status check ${attempts + 1}:`, status);

        if (status.paymentStatus === "succeeded") {
          setPaymentPolling(false);

          // Create notification
          try {
            await createNotification({
              message: `🛍️ New M-Pesa order #${orderId} completed successfully for ${orderCurrency} ${Math.round(totalAmount)}.`,
              type: "userNotification",
              username: user?.username || user?.email,
              userId: user?.id || user?.$id,
              email: user?.email,
            });
          } catch (e) {
            console.warn("Notification error:", e);
          }

          await clearCheckoutAttempt(user?.id || user?.$id);

          // Clear cart
          await clearCart();

          Alert.alert(
            "Payment Successful",
            "Your M-Pesa payment was completed successfully!",
            [
              {
                text: "View Order",
                onPress: () => {
                  setNavigationTrigger({
                    type: "mpesa",
                    orderId: orderId,
                    paymentMethod: "M-Pesa",
                    orderStatus: "Processing",
                    paymentRef: `MPESA-${orderId}`,
                    totalAmount: totalAmount,
                    productsAmount: totalAmount,
                    cartItems: JSON.stringify(cart),
                    timestamp: Date.now(),
                  });
                },
              },
            ],
          );

          return;
        } else if (
          status.paymentStatus === "failed" ||
          status.paymentStatus === "cancelled"
        ) {
          setPaymentPolling(false);
          Alert.alert(
            "Payment Failed",
            "Your M-Pesa payment was unsuccessful. Please try again.",
          );
          return;
        }

        // Continue polling if payment is still pending
        attempts++;
        if (!cancelPollRef.current && attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setPaymentPolling(false);
          Alert.alert(
            "Payment Timeout",
            "Payment verification is taking longer than expected. Please check your order status later.",
            [
              {
                text: "Check Order Status",
                onPress: () => {
                  setNavigationTrigger({
                    type: "mpesa-timeout",
                    orderId: orderId,
                    paymentMethod: "M-Pesa",
                    orderStatus: "Pending",
                    paymentRef: `MPESA-${orderId}`,
                    totalAmount: totalAmount,
                    productsAmount: totalAmount,
                    cartItems: JSON.stringify(cart),
                    timestamp: Date.now(),
                  });
                },
              },
              { text: "Cancel", style: "cancel" },
            ],
          );
        }
      } catch (error) {
        console.error("Error polling M-Pesa status:", error);
        if (!cancelPollRef.current && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 10000);
        } else {
          setPaymentPolling(false);
          Alert.alert(
            "Error",
            "Unable to verify payment status. Please contact support.",
          );
        }
      }
    };

    poll();
  };

  const handlePesapalPayment = async (user, checkoutMetadata) => {
    try {
      if (!phoneNumber || phoneNumber.trim().length === 0) {
        Alert.alert("Error", "Please enter your phone number before continuing.");
        return;
      }

      const cleanPhone = phoneNumber.replace(/[^0-9+]/g, "").trim();
      if (cleanPhone.length < 10) {
        Alert.alert("Error", "Please enter a valid phone number for the payment.");
        return;
      }

      setPesapalLoading(true);

      const userId = user?.id || user?.$id;
      const customerEmail = user?.email;
      const username = user?.username || user?.email;
      const orderCurrency = currency || "KES";
      const pesapalReturnUrl = "nileflowapp://pesapal-return";

      const payload = {
        cart,
        userId,
        customerEmail,
        username,
        totalAmount: Number(totalAmount),
        currency: orderCurrency,
        paymentMethod: "Pesapal",
        customerPhone: cleanPhone,
        status: "Pending",
        callbackUrl: `${pesapalReturnUrl}?status=success`,
        cancellationUrl: `${pesapalReturnUrl}?status=cancelled`,
        ...checkoutMetadata,
      };

      const apiResponse = await axiosClient.post(
        "/api/payments/pesapal/initiate",
        payload,
      );

      const result = apiResponse.data || {};
      if (!result.success || !result.redirectUrl) {
        throw new Error(result.message || "Unable to start Pesapal checkout");
      }

      Alert.alert(
        "Pesapal Checkout",
        "You will be redirected to the secure Pesapal checkout page for payment.",
        [
          {
            text: "Continue",
            onPress: async () => {
              try {
                const browserResult = await WebBrowser.openAuthSessionAsync(
                  result.redirectUrl,
                  pesapalReturnUrl,
                );

                if (browserResult?.type === "cancel" || browserResult?.type === "dismiss") {
                  const cancelledOrderId = result.orderId;
                  try {
                    await axiosClient.post(
                      `/api/payments/pesapal/cancel/${encodeURIComponent(cancelledOrderId)}`,
                    );
                  } catch (_) {
                    // Best effort: the backend will clean up failed/cancelled payments.
                  }

                  Alert.alert(
                    "Payment Cancelled",
                    "Your order was not completed. You can try again from checkout.",
                  );
                  return;
                }

                if (browserResult?.type === "success" && browserResult?.url) {
                  const parsed = Linking.parse(browserResult.url);
                  const paymentStatus = parsed.queryParams?.status;
                  const returnedOrderId =
                    parsed.queryParams?.orderId ||
                    parsed.queryParams?.order_id ||
                    result.orderId;

                  if (paymentStatus === "cancelled") {
                    try {
                      await axiosClient.post(
                        `/api/payments/pesapal/cancel/${encodeURIComponent(returnedOrderId)}`,
                      );
                    } catch (_) {
                      // Best effort only.
                    }

                    Alert.alert(
                      "Payment Cancelled",
                      "Your order has been cancelled and you have been returned to the app.",
                    );
                    return;
                  }

                  Alert.alert(
                    "Payment Successful",
                    "Your payment was completed and you have been returned to the app.",
                  );
                  await pollPesapalPaymentStatus(returnedOrderId, user);
                  return;
                }
              } catch (browserError) {
                console.error("Pesapal browser launch error:", browserError);
              }

              await pollPesapalPaymentStatus(result.orderId, user);
            },
          },
          { text: "Cancel", style: "cancel" },
        ],
      );

      return true;
    } catch (error) {
      console.error("Pesapal checkout request failed", {
        status: error.response?.status,
        code: error.response?.data?.code,
        message: error.response?.data?.message || error.message,
      });
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to initiate Pesapal payment";
      Alert.alert("Pesapal Payment Error", message);
      return false;
    } finally {
      setPesapalLoading(false);
    }
  };

  const pollPesapalPaymentStatus = async (orderId, user) => {
    setPaymentPolling(true);
    let attempts = 0;
    const maxAttempts = 36;

    const poll = async () => {
      try {
        const response = await axiosClient.get(
          `/api/payments/pesapal/status/${orderId}`,
        );
        const status = response.data || {};

        if (status.paymentStatus === "succeeded") {
          setPaymentPolling(false);

          try {
            await createNotification({
              message: `🛍️ New Pesapal order #${orderId} completed successfully for KES ${Math.round(totalAmount)}.`,
              type: "userNotification",
              username: user?.username || user?.email,
              userId: user?.id || user?.$id,
              email: user?.email,
            });
          } catch (notificationError) {
            console.warn("Pesapal notification error:", notificationError);
          }

          await clearCheckoutAttempt(user?.id || user?.$id);

          await clearCart();

          Alert.alert(
            "Payment Successful",
            "Your Pesapal payment was completed successfully!",
            [
              {
                text: "View Order",
                onPress: () => {
                  setNavigationTrigger({
                    type: "pesapal",
                    orderId,
                    paymentMethod: "Pesapal",
                    orderStatus: "Processing",
                    paymentRef: `PESAPAL-${orderId}`,
                    totalAmount,
                    productsAmount: totalAmount,
                    cartItems: JSON.stringify(cart),
                    timestamp: Date.now(),
                  });
                },
              },
            ],
          );
          return;
        }

        if (status.paymentStatus === "failed") {
          setPaymentPolling(false);
          Alert.alert("Payment Failed", "Your Pesapal payment was unsuccessful. Please try again.");
          return;
        }

        attempts += 1;
        if (!cancelPollRef.current && attempts < maxAttempts) {
          setTimeout(poll, 10000);
        } else {
          setPaymentPolling(false);
          Alert.alert(
            "Payment Timeout",
            "We could not confirm payment yet. Please check your order status later.",
            [
              {
                text: "Check Order Status",
                onPress: () => {
                  setNavigationTrigger({
                    type: "pesapal-timeout",
                    orderId,
                    paymentMethod: "Pesapal",
                    orderStatus: "Pending",
                    paymentRef: `PESAPAL-${orderId}`,
                    totalAmount,
                    productsAmount: totalAmount,
                    cartItems: JSON.stringify(cart),
                    timestamp: Date.now(),
                  });
                },
              },
              { text: "Cancel", style: "cancel" },
            ],
          );
        }
      } catch (error) {
        console.error("Error polling Pesapal status:", error);
        attempts += 1;
        if (!cancelPollRef.current && attempts < maxAttempts) {
          setTimeout(poll, 10000);
        } else {
          setPaymentPolling(false);
          Alert.alert("Error", "Unable to verify your Pesapal payment. Please contact support.");
        }
      }
    };

    poll();
  };

  const initiateCheckout = async () => {
    if (paymentStartRef.current) return;

    if (!selectedMethod) {
      Alert.alert("Error", "Please select a payment method.");
      return;
    }

    if (cart.length === 0) {
      Alert.alert("Error", "Your cart is empty.");
      return;
    }

    paymentStartRef.current = true;
    setLoading(true);

    try {
      const user = await getCurrentUser();
      const token = await AsyncStorage.getItem("accessToken");

      // Validate user object first
      if (!user) {
        Alert.alert("Error", "Please log in to continue with checkout.");
        setLoading(false);
        return;
      }

      const userId = user?.id || user?.$id;
      const customerEmail = user?.email;
      const username = user?.username || user?.email;

      const checkoutMetadata = await getCheckoutRequestMetadata(
        userId,
        checkoutAddress,
      );

      // Estimated delivery date (3 business days from now)
      const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const estimatedDeliveryStr = deliveryDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      console.log("Estimated Delivery Date:", estimatedDeliveryStr);

      // --- Dispatch to the appropriate payment handler ---
      if (selectedMethod === "pod") {
        await handleCashOnDelivery(user, token, checkoutMetadata);
      } else if (selectedMethod === "mobile") {
        await handleMpesaPayment(user, token, checkoutMetadata);
      } else if (selectedMethod === "pesapal") {
        await handlePesapalPayment(user, checkoutMetadata);
      }
    } catch (error) {
      // <-- Add this closing brace for the try block
      console.error("Checkout Error:", error);
      Alert.alert("Error", error.message || "Something went wrong.");
    } finally {
      paymentStartRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      const orderDate = new Date(createdAt);
      const deliveryDate = moment(orderDate)
        .add(2, "days")
        .format("MMM  Do YYYY");
      setEstimatedDelivery(deliveryDate);
      console.log("Estimated Delivery Date:", deliveryDate);
      console.log(
        "Order created with ID:",
        orderId,
        "- waiting for payment completion",
      );
    }
  }, [orderId]);

  // Responsive styles
  const titleFontSize = width < 350 ? 18 : 20;
  const methodFontSize = width < 350 ? 16 : 18;
  const itemPadding = width < 350 ? 12 : 16;
  const itemMarginBottom = width < 350 ? 8 : 12;
  const buttonPadding = width < 350 ? 12 : 16;
  const buttonFontSize = width < 350 ? 16 : 18;
  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.header}>
                    <TouchableOpacity
                      onPress={() => router.back()}
                      style={styles.backButton}
                    >
                      <MaterialIcons name="arrow-back" size={24} color="#16A34A" />
                    </TouchableOpacity>
                    <View>
                      
                      <Text style={styles.headerTitle}>
                        Track Your Orders
                      </Text>
                    </View>
        </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            nestedScrollEnabled={true}
          >
            
            {/* Header Section */}
            <View style={{ marginBottom: 32 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: "rgba(245, 158, 11, 0.2)",
                    borderWidth: 1,
                    borderColor: "rgba(245, 158, 11, 0.3)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Lock size={24} color="#F59E0B" />
                </View>
                <Text
                  style={{
                    color: "white",
                    fontSize: 28,
                    fontWeight: "bold",
                    letterSpacing: 0.5,
                  }}
                >
                  Secure Payment
                </Text>
              </View>
              <Text
                style={{
                  color: "#6B7280",
                  fontSize: 16,
                  lineHeight: 24,
                }}
              >
                Select your preferred payment method for a seamless checkout
                experience
              </Text>

              {/* Trust Badges */}
              <View
                style={{
                  backgroundColor: "#F9FAFB",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  padding: 16,
                  marginTop: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Shield size={18} color="#16A34A" />
                    <Text
                      style={{ color: "#15803D", fontSize: 12, marginLeft: 6 }}
                    >
                      SSL Secured
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Gem size={18} color="#D97706" />
                    <Text
                      style={{ color: "#92400E", fontSize: 12, marginLeft: 6 }}
                    >
                      Premium Security
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Sparkles size={18} color="#7C3AED" />
                    <Text
                      style={{ color: "#5B21B6", fontSize: 12, marginLeft: 6 }}
                    >
                      100% Safe
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Payment Methods Title */}
            <Text
              style={{
                color: "#111827",
                fontSize: 20,
                fontFamily: "Poppins-SemiBold",
                marginBottom: 20,
              }}
            >
              Choose Payment Method
            </Text>

            {/* Payment Methods */}
            <View style={{ marginBottom: 30 }}>
              {paymentMethods.map((method, index) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;

                return (
                  <TouchableOpacity
                    key={method.id}
                    onPress={() => setSelectedMethod(method.id)}
                    style={{
                      backgroundColor: isSelected ? "#F0FDF4" : "#F9FAFB",
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: isSelected ? "#16A34A" : "#E5E7EB",
                      padding: 20,
                      marginBottom: 16,
                      shadowColor: isSelected ? "#F59E0B" : "transparent",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: isSelected ? 8 : 0,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          backgroundColor: isSelected ? "#D1FAE5" : "#F3F4F6",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 16,
                        }}
                      >
                        {method.image ? (
                          <Image
                            source={method.image}
                            resizeMode="contain"
                            style={{ width: 40, height: 40 }}
                            accessibilityLabel="Pesapal"
                          />
                        ) : (
                          <Icon
                            size={28}
                            color={isSelected ? "#16A34A" : "#6B7280"}
                          />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 18,
                              fontFamily: "Poppins-Bold",
                              color: isSelected ? "#14532D" : "#111827",
                              marginRight: 8,
                            }}
                          >
                            {method.name}
                          </Text>
                          {isSelected && (
                            <CheckCircle size={20} color="#16A34A" />
                          )}
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6B7280",
                            marginBottom: 8,
                          }}
                        >
                          {method.description}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          {method.features.map((feature, i) => (
                            <View
                              key={i}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: 20,
                                backgroundColor: "#F3F4F6",
                                borderWidth: 1,
                                borderColor: "#E5E7EB",
                              }}
                            >
                              <Text
                                style={{
                                  color: "#374151",
                                  fontSize: 12,
                                  fontFamily: "Poppins-Medium",
                                }}
                              >
                                {feature}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Phone Number Input */}
            {(selectedMethod === "mobile" || selectedMethod === "pesapal") && (
              <View
                style={{
                  backgroundColor: "#F0FDF4",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#BBF7D0",
                  padding: 20,
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    color: "#14532D",
                    fontSize: 16,
                    fontFamily: "Poppins-SemiBold",
                    marginBottom: 12,
                  }}
                >
                  {selectedMethod === "pesapal"
                    ? "Enter your mobile wallet number"
                    : "Enter M-Pesa Phone Number"}
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#D1FAE5",
                    padding: 16,
                    color: "#111827",
                    fontSize: 16,
                    marginBottom: 8,
                  }}
                  placeholder="e.g. 0712345678 or +254712345678"
                  placeholderTextColor="#9CA3AF"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={15}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <Text
                  style={{
                    color: "#6B7280",
                    fontSize: 12,
                    lineHeight: 16,
                  }}
                >
                  {selectedMethod === "pesapal"
                    ? "This is the number Pesapal will use for the confirming wallet payment."
                    : "You will receive an M-Pesa prompt on this number"}
                </Text>
              </View>
            )}

            {/* Secure checkout and accepted payment methods */}
            <View
              style={{
                padding: 16,
                borderRadius: 20,
                marginBottom: 16,
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#BBF7D0",
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#DCFCE7",
                  }}
                  accessible={false}
                >
                  <MaterialIcons name="lock" size={16} color="#15803D" />
                </View>
                <Text
                  style={{
                    color: "#111827",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Secure checkout with
                </Text>
              </View>

              <View
                accessibilityLabel="Accepted payment methods"
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                {[
                  { source: images.visa, label: "Visa" },
                  { source: images.mastercard, label: "Mastercard" },
                  { source: images.mpesa, label: "M Pesa" },
                  { source: images.pesapal, label: "Pesapal" },
                ].map((paymentMethod) => (
                  <View
                    key={paymentMethod.label}
                    style={{
                      height: 36,
                      minWidth: 56,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor:
                        paymentMethod.label === "Pesapal"
                          ? "#FFEDD5"
                          : "#F1F5F9",
                      backgroundColor: "#FFFFFF",
                      justifyContent: "center",
                      alignItems: "center",
                      shadowColor: "#000000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <Image
                      source={paymentMethod.source}
                      style={{ width: 72, height: 26 }}
                      contentFit="contain"
                      accessible
                      accessibilityLabel={paymentMethod.label}
                    />
                  </View>
                ))}
              </View>

              <Text
                style={{
                  color: "#6B7280",
                  fontSize: 12,
                  marginTop: 12,
                  lineHeight: 18,
                }}
              >
                Your payment information is protected with encrypted processing.
              </Text>
            </View>

            {/* Confirm Order Button */}
            <TouchableOpacity
              onPress={initiateCheckout}
              disabled={
                loading ||
                !selectedMethod ||
                mpesaLoading ||
                pesapalLoading ||
                paymentPolling
              }
              style={{
                backgroundColor:
                  loading ||
                  !selectedMethod ||
                  mpesaLoading ||
                  pesapalLoading ||
                  paymentPolling
                    ? "#9CA3AF"
                    : "#16A34A",
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
                shadowColor:
                  loading ||
                  !selectedMethod ||
                  mpesaLoading ||
                  pesapalLoading ||
                  paymentPolling
                    ? "transparent"
                    : "#16A34A",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation:
                  loading ||
                  !selectedMethod ||
                  mpesaLoading ||
                  pesapalLoading ||
                  paymentPolling
                    ? 0
                    : 8,
                position: "relative",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loading || mpesaLoading || pesapalLoading || paymentPolling ? (
                  <>
                    <ActivityIndicator color="white" size="small" />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "white",
                        marginLeft: 12,
                      }}
                    >
                      {paymentPolling
                        ? "Waiting for payment..."
                        : "Processing..."}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "white",
                      }}
                    >
                      {selectedMethod === "mobile"
                        ? "Send M-Pesa Prompt"
                        : selectedMethod === "pesapal"
                          ? "Continue to Pesapal"
                          : selectedMethod
                            ? "Confirm Order"
                            : "Select Payment Method"}
                    </Text>
                    {selectedMethod && (
                      <ArrowRight
                        size={20}
                        color="white"
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </>
                )}
              </View>

              {/* Lock Badge */}
              {!loading &&
                !mpesaLoading &&
                !pesapalLoading &&
                !paymentPolling &&
                selectedMethod && (
                  <View
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#10B981",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#10B981",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.5,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Lock size={16} color="white" />
                  </View>
                )}
            </TouchableOpacity>

            {/* Help Text */}
            <Text
              style={{
                color: "#9CA3AF",
                textAlign: "center",
                marginTop: 16,
                fontSize: 14,
              }}
            >
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default Payments;
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
})