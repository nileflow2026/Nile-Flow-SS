/* eslint-disable no-unused-vars */

import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCart } from "../../Context/CartContext_NEW";
import { imageForSize, IMAGE_SIZE } from "../../utils/imageOptimizer";

const { width } = Dimensions.get("window");

const CartSkeleton = () => (
  <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
    <ScrollView
      style={{ flex: 1, paddingHorizontal: 16, paddingTop: 32 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header placeholders */}
      <View
        style={{
          width: 200,
          height: 32,
          borderRadius: 6,
          backgroundColor: "#E5E7EB",
          alignSelf: "center",
          marginBottom: 4,
        }}
      />
      <View
        style={{
          width: 280,
          height: 16,
          borderRadius: 6,
          backgroundColor: "#E5E7EB",
          alignSelf: "center",
          marginBottom: 24,
        }}
      />

      {/* Summary row — 4 boxes */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              marginHorizontal: 4,
              borderRadius: 16,
              padding: 12,
              alignItems: "center",
              backgroundColor: "#F3F4F6",
            }}
          >
            <View
              style={{
                width: 32,
                height: 22,
                borderRadius: 4,
                backgroundColor: "#E5E7EB",
                marginBottom: 4,
              }}
            />
            <View
              style={{
                width: "70%",
                height: 12,
                borderRadius: 4,
                backgroundColor: "#E5E7EB",
              }}
            />
          </View>
        ))}
      </View>

      {/* Cart item cards — 2 items */}
      {[0, 1].map((idx) => (
        <View
          key={idx}
          style={{
            backgroundColor: "#F9FAFB",
            borderRadius: 18,
            marginBottom: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            {/* Image */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 12,
                backgroundColor: "#E5E7EB",
                marginRight: 16,
              }}
            />
            {/* Text lines */}
            <View style={{ flex: 1 }}>
              <View
                style={{
                  width: "80%",
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: "#E5E7EB",
                  marginBottom: 6,
                }}
              />
              <View
                style={{
                  width: "40%",
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: "#E5E7EB",
                  marginBottom: 4,
                }}
              />
              <View
                style={{
                  width: "55%",
                  height: 13,
                  borderRadius: 4,
                  backgroundColor: "#E5E7EB",
                }}
              />
            </View>
            {/* Quantity buttons */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginLeft: 8,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: "#E5E7EB",
                  marginHorizontal: 2,
                }}
              />
              <View
                style={{
                  width: 24,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: "#E5E7EB",
                  marginHorizontal: 6,
                }}
              />
              <View
                style={{
                  width: 32,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: "#E5E7EB",
                  marginHorizontal: 2,
                }}
              />
              <View
                style={{
                  width: 50,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: "#E5E7EB",
                  marginLeft: 8,
                }}
              />
            </View>
          </View>
          {/* Total line */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <View
              style={{
                width: 40,
                height: 14,
                borderRadius: 4,
                backgroundColor: "#E5E7EB",
                marginRight: 8,
              }}
            />
            <View
              style={{
                width: 80,
                height: 16,
                borderRadius: 4,
                backgroundColor: "#E5E7EB",
              }}
            />
          </View>
        </View>
      ))}

      {/* Order Summary box */}
      <View
        style={{
          backgroundColor: "#F9FAFB",
          borderRadius: 18,
          padding: 20,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <View
          style={{
            width: 140,
            height: 20,
            borderRadius: 6,
            backgroundColor: "#E5E7EB",
            alignSelf: "center",
            marginBottom: 16,
          }}
        />
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 70,
                height: 15,
                borderRadius: 4,
                backgroundColor: "#E5E7EB",
              }}
            />
            <View
              style={{
                width: 90,
                height: 15,
                borderRadius: 4,
                backgroundColor: "#E5E7EB",
              }}
            />
          </View>
        ))}
        {/* Total separator */}
        <View
          style={{
            width: "100%",
            height: 1,
            backgroundColor: "#E5E7EB",
            marginTop: 8,
            marginBottom: 8,
          }}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 50,
              height: 18,
              borderRadius: 4,
              backgroundColor: "#E5E7EB",
            }}
          />
          <View
            style={{
              width: 100,
              height: 22,
              borderRadius: 4,
              backgroundColor: "#E5E7EB",
            }}
          />
        </View>
        {/* Checkout button */}
        <View
          style={{
            width: "100%",
            height: 50,
            borderRadius: 12,
            backgroundColor: "#E5E7EB",
          }}
        />
      </View>
    </ScrollView>
  </View>
);

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, fetchCartItems } = useCart();
  const [isLoadingCart, setIsLoadingCart] = useState(true);

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

  // Mirror cart into a ref so useFocusEffect can read the current length
  // without adding `cart` to its deps (which would re-run the effect on
  // every cart state change while the tab is focused).
  const cartRef = useRef(cart);
  cartRef.current = cart;

  // Track whether the initial cart fetch has completed
  const initialFetchDone = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (cartRef.current.length === 0 && !initialFetchDone.current) {
        initialFetchDone.current = true;
        fetchCartItems().finally(() => setIsLoadingCart(false));
      } else if (cartRef.current.length > 0) {
        setIsLoadingCart(false);
      }
    }, [fetchCartItems]),
  );

  // Resolve price from either enriched object or plain number.
  // Prefer convertedPrice (already in the user's local currency, e.g. SSP)
  // over raw (base KES integer). raw is only a fallback for un-enriched items.
  const resolvePrice = (price) => {
    if (price && typeof price === "object")
      return price.convertedPrice ?? price.raw ?? 0;
    return price || 0;
  };

  const displayPrice = (price) => {
    if (price && typeof price === "object" && price.displayValue)
      return price.displayValue;
    // Fallback for un-enriched plain numbers — still use symbol not ISO code
    const n = typeof price === "number" ? price : parseFloat(price) || 0;
    return `KSh ${n.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Cart calculations — use raw KES value for arithmetic
  const subtotal = cart.reduce(
    (total, item) => total + resolvePrice(item.price) * (item.quantity || 1),
    0,
  );
  const shipping = subtotal > 100 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // Currency symbol map — mirrors backend CURRENCY_META
  const CURRENCY_SYMBOLS = {
    KES: "KSh",
    UGX: "UGX",
    TZS: "TSh",
    ETB: "ETB",
    NGN: "₦",
    GHS: "GH₵",
    RWF: "RWF",
    SSP: "SSP",
    USD: "$",
    GBP: "£",
    EUR: "€",
  };
  const CURRENCY_DECIMALS = {
    KES: 0,
    UGX: 0,
    TZS: 0,
    RWF: 0,
    SSP: 0,
    ETB: 2,
    NGN: 2,
    GHS: 2,
    USD: 2,
    GBP: 2,
    EUR: 2,
  };

  // Use the currency from the first cart item's enriched price (all same currency)
  const activeCurrency = cart[0]?.price?.currency || "KES";
  const currencySymbol = CURRENCY_SYMBOLS[activeCurrency] || activeCurrency;
  const currencyDecimals = CURRENCY_DECIMALS[activeCurrency] ?? 2;
  const fmt = (n) =>
    `${currencySymbol} ${n.toLocaleString("en", {
      minimumFractionDigits: currencyDecimals,
      maximumFractionDigits: currencyDecimals,
    })}`;

  const formattedSubtotal = fmt(subtotal);
  const formattedShipping = fmt(shipping);
  const formattedTax = fmt(tax);
  const formattedTotal = fmt(total);

  // ── Show skeleton while initial cart is loading ──
  if (isLoadingCart && cart.length === 0) {
    return <CartSkeleton />;
  }

  const handleCheckout = () => {
    router.push("/(Screens)/Payments");
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  return (
    <View style={[styles.gradientBg, { backgroundColor: "#FFFFFF" }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">
          Shopping Cart
        </Text>
        <Text
          style={styles.headerSubtitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          Review your premium African products before checkout
        </Text>

        {/* Cart Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, { backgroundColor: "#FEF3C7" }]}>
            <Text style={styles.summaryValue}>{cart.length}</Text>
            <Text
              style={styles.summaryLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Premium Items
            </Text>
          </View>
          {cart.length > 0 && (
            <View style={[styles.summaryBox, { backgroundColor: "#F0FDF4" }]}>
              <Text style={styles.summaryValue}>
                {subtotal > 100 ? "FREE" : formattedShipping}
              </Text>
              <Text
                style={styles.summaryLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Shipping
              </Text> 
            </View>
          )}
          <View style={[styles.summaryBox, { backgroundColor: "#F3F4F6" }]}>
            <Text style={styles.summaryValue}>100%</Text>
            <Text
              style={styles.summaryLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Authentic
            </Text>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: "#FEF2F2" }]}>
            <Text style={styles.summaryValue}>30D</Text>
            <Text
              style={styles.summaryLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Returns
            </Text>
          </View>
        </View>

        {/* Cart Items */}
        {cart.length === 0 ? (
          <View style={styles.emptyCartContainer}>
            <Text style={styles.emptyCartTitle}>Your Cart is Empty</Text>
            <Text style={styles.emptyCartText}>
              Discover premium African products waiting to be added to your
              cart. Start exploring our curated collection.
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push("/(Screens)/Explore")}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cartItemsContainer}>
            {cart.map((item) => (
              <View
                key={item.id || item.$id || item.productId}
                style={styles.cartItemBox}
              >
                <View style={styles.cartItemRow}>
                  <Image
                    source={{
                      uri: imageForSize(
                        item.productImage ||
                          item.image ||
                          "https://placehold.co/100x100",
                        IMAGE_SIZE.SMALL,
                      ),
                    }}
                    style={styles.cartItemImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                    recyclingKey={`cart-${item.id || item.$id}`}
                  />
                  <View style={styles.cartItemInfo}>
                    <Text
                      style={styles.cartItemName}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.productName}
                    </Text>
                    <Text style={styles.cartItemPrice}>
                      {displayPrice(item.price)}
                    </Text>
                    <Text style={styles.cartItemQuantity}>
                      {item.quantity} × {displayPrice(item.price)}
                    </Text>
                  </View>
                  <View style={styles.cartItemActions}>
                    <TouchableOpacity
                      onPress={() =>
                        handleQuantityChange(
                          item.id || item.$id || item.productId,
                          (item.quantity || 1) - 1,
                        )
                      }
                      style={[
                        styles.quantityButton,
                        item.quantity <= 1 && styles.quantityButtonDisabled,
                      ]}
                      disabled={item.quantity <= 1}
                      accessibilityRole="button"
                      accessibilityLabel={`Decrease quantity of ${item.productName}`}
                      accessibilityState={{ disabled: item.quantity <= 1 }}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text
                      style={styles.cartItemQuantityValue}
                      accessibilityLabel={`Quantity: ${item.quantity || 1}`}
                    >
                      {item.quantity || 1}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        handleQuantityChange(
                          item.id || item.$id || item.productId,
                          (item.quantity || 1) + 1,
                        )
                      }
                      style={styles.quantityButton}
                      accessibilityRole="button"
                      accessibilityLabel={`Increase quantity of ${item.productName}`}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        removeFromCart(item.id || item.$id || item.productId)
                      }
                      style={styles.removeButton}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.productName} from cart`}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.cartItemTotalBox}>
                  <Text style={styles.cartItemTotalLabel}>Total:</Text>
                  <Text style={styles.cartItemTotalValue}>
                    {fmt(resolvePrice(item.price) * (item.quantity || 1))}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Order Summary */}
        {cart.length > 0 && (
          <View style={styles.orderSummaryBox}>
            <Text style={styles.orderSummaryTitle}>Order Summary</Text>
            <View style={styles.orderSummaryRow}>
              <Text style={styles.orderSummaryLabel}>Subtotal</Text>
              <Text style={styles.orderSummaryValue}>{formattedSubtotal}</Text>
            </View>
            {/* <View style={styles.orderSummaryRow}>
              <Text style={styles.orderSummaryLabel}>Shipping</Text>
              <Text style={styles.orderSummaryValue}>
                {shipping === 0 ? "FREE" : formattedShipping}
              </Text>
            </View>
            <View style={styles.orderSummaryRow}>
              <Text style={styles.orderSummaryLabel}>Tax</Text>
              <Text style={styles.orderSummaryValue}>{formattedTax}</Text>
            </View> */}
            <View style={styles.orderSummaryRowTotal}>
              <Text style={styles.orderSummaryTotalLabel}>Total</Text>
              <Text style={styles.orderSummaryTotalValue}>
                {/* {formattedTotal} */} {formattedSubtotal}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
              accessibilityRole="button"
              accessibilityLabel="Proceed to checkout"
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  gradientBg: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
    textAlign: "center",
    marginBottom: 4,
    flexWrap: "wrap",
    width: "100%",
    paddingHorizontal: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
    marginBottom: 24,
    flexWrap: "wrap",
    width: "100%",
    paddingHorizontal: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  summaryBox: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    minWidth: 0,
    width: 0,
  },
  summaryValue: {
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#374151",
    marginTop: 4,
    flexWrap: "wrap",
    width: "100%",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  emptyCartContainer: {
    alignItems: "center",
    marginTop: 48,
    marginBottom: 32,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 8,
  },
  emptyCartText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    marginBottom: 16,
  },
  shopButton: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopButtonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins-Bold",
    fontSize: 16,
  },
  cartItemsContainer: {
    marginBottom: 32,
  },
  cartItemBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cartItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cartItemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: "#E5E7EB",
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 4,
    flexWrap: "wrap",
    width: "100%",
    paddingRight: 4,
  },
  cartItemPrice: {
    fontSize: 16,
    color: "#D97706",
    fontFamily: "Poppins-Bold",
  },
  cartItemQuantity: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  cartItemActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  quantityButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityButtonText: {
    color: "#374151",
    fontFamily: "Poppins-Bold",
    fontSize: 18,
  },
  cartItemQuantityValue: {
    color: "#111827",
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    marginHorizontal: 6,
  },
  removeButton: {
    marginLeft: 8,
    backgroundColor: "#b91c1c",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removeButtonText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 13,
  },
  cartItemTotalBox: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
  },
  cartItemTotalLabel: {
    color: "#6B7280",
    fontSize: 14,
    marginRight: 8,
  },
  cartItemTotalValue: {
    color: "#D97706",
    fontFamily: "Poppins-Bold",
    fontSize: 16,
  },
  orderSummaryBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  orderSummaryTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#14532D",
    marginBottom: 16,
    textAlign: "center",
    flexWrap: "wrap",
    width: "100%",
    paddingHorizontal: 8,
  },
  orderSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderSummaryLabel: {
    color: "#374151",
    fontSize: 15,
  },
  orderSummaryValue: {
    color: "#111827",
    fontFamily: "Poppins-Bold",
    fontSize: 15,
  },
  orderSummaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 8,
  },
  orderSummaryTotalLabel: {
    color: "#D97706",
    fontFamily: "Poppins-Bold",
    fontSize: 18,
  },
  orderSummaryTotalValue: {
    color: "#D97706",
    fontFamily: "Poppins-Bold",
    fontSize: 22,
  },
  checkoutButton: {
    backgroundColor: "#16A34A",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    flexWrap: "wrap",
    width: "100%",
    textAlign: "center",
  },
});

export default Cart;
