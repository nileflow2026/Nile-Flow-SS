import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import images from "../../constants/images";
import { neutral, green } from "../../constants/theme/colors";
import { useBusinessProfileQuery } from "../../hooks/api/useBusinessDirectory";
import { imageForSize, IMAGE_SIZE } from "../../utils/imageOptimizer";

function BusinessProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const businessId = Array.isArray(params.businessId)
    ? params.businessId[0]
    : params.businessId;
  const profile = useBusinessProfileQuery(businessId);
  const [coverImageFailedId, setCoverImageFailedId] = useState("");
  const [profileImageFailedId, setProfileImageFailedId] = useState("");
  const business = profile.data;
  const coverImageFailed = coverImageFailedId === business?.id;
  const profileImageFailed = profileImageFailedId === business?.id;

  const visitStore = () => {
    if (!business?.id) return;
    router.push({
      pathname: "/(Screens)/VendorStore",
      params: { vendorId: business.id },
    });
  };

  const retryButton = (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => profile.refetch()}
      style={styles.primaryButton}
    >
      <Text style={styles.primaryButtonText}>Try again</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={["bottom"]} style={styles.screen}>
      <Stack.Screen
        options={{
          title: business?.name || "Business",
          headerShown: true,
          headerTintColor: green[700],
          headerTitleStyle: { color: neutral.heading },
        }}
      />
      {profile.isPending && businessId ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={green[600]} />
          <Text style={styles.stateText}>Loading business…</Text>
        </View>
      ) : profile.isError ? (
        <View style={styles.stateContainer}>
          <Ionicons name="storefront-outline" size={42} color={green[700]} />
          <Text style={styles.stateTitle}>
            {profile.error?.response?.status === 404
              ? "Business not found"
              : "Business could not load"}
          </Text>
          <Text accessibilityRole="alert" style={styles.stateText}>
            {profile.error?.response?.status === 404
              ? "This business is unavailable."
              : "Check your connection and try again."}
          </Text>
          {profile.error?.response?.status === 404
            ? null
            : retryButton}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Back to businesses</Text>
          </TouchableOpacity>
        </View>
      ) : business ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.coverContainer}>
            <Image
              source={
                coverImageFailed || !(business.coverImage || business.profileImage)
                  ? images.brandLogo
                  : {
                      uri: imageForSize(
                        business.coverImage || business.profileImage,
                        IMAGE_SIZE.HERO,
                      ),
                    }
              }
              style={styles.coverImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={160}
              accessibilityLabel={`${business.name} cover`}
              onError={() => setCoverImageFailedId(business.id)}
            />
          </View>

          <View style={styles.content}>
            <View style={styles.brandRow}>
              <Image
                source={
                  profileImageFailed || !business.profileImage
                    ? images.brandLogo
                    : {
                        uri: imageForSize(
                          business.profileImage,
                          IMAGE_SIZE.MEDIUM,
                        ),
                      }
                }
                style={styles.profileImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                accessibilityLabel={`${business.name} logo`}
                onError={() => setProfileImageFailedId(business.id)}
              />
              <View style={styles.nameBlock}>
                {business.category ? (
                  <Text style={styles.category}>{business.category}</Text>
                ) : null}
                <Text style={styles.title} selectable>
                  {business.name}
                </Text>
              </View>
            </View>

            {business.location ? (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={19} color={green[700]} />
                <Text style={styles.detailText} selectable>
                  {business.location}
                </Text>
              </View>
            ) : null}

            {business.description ? (
              <View style={styles.descriptionCard}>
                <Text style={styles.sectionTitle}>About this business</Text>
                <Text style={styles.description} selectable>
                  {business.description}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Visit ${business.name} store`}
              onPress={visitStore}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Visit store</Text>
              <Ionicons name="arrow-forward" size={18} color={neutral.white} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.stateContainer}>
          <Ionicons name="storefront-outline" size={42} color={green[700]} />
          <Text style={styles.stateTitle}>Business not found</Text>
          <Text style={styles.stateText}>
            This business is unavailable.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Back to businesses</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: neutral.white,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  coverContainer: {
    height: 230,
    backgroundColor: neutral.surface,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    gap: 18,
    padding: 18,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  profileImage: {
    width: 68,
    height: 68,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: neutral.border,
    backgroundColor: neutral.surface,
  },
  nameBlock: {
    flex: 1,
    gap: 4,
  },
  category: {
    color: green[700],
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: neutral.heading,
    fontSize: 22,
    fontWeight: "800",
  },
  stateTitle: {
    color: neutral.heading,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    flex: 1,
    color: neutral.body,
    fontSize: 14,
  },
  descriptionCard: {
    gap: 8,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: green[200],
    backgroundColor: green[50],
  },
  sectionTitle: {
    color: green[900],
    fontSize: 16,
    fontWeight: "700",
  },
  description: {
    color: neutral.body,
    fontSize: 15,
    lineHeight: 23,
  },
  primaryButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: green[600],
  },
  primaryButtonText: {
    color: neutral.white,
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: green[700],
    fontSize: 14,
    fontWeight: "700",
  },
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  stateText: {
    color: neutral.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});

export default BusinessProfileScreen;
