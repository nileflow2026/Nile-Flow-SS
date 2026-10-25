import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { neutral, green } from "../../constants/theme/colors";
import { useBusinessShowcaseQuery } from "../../hooks/api/useBusinessDirectory";
import BusinessCard from "./BusinessCard";

function BusinessShowcase() {
  const router = useRouter();
  const { data: businesses = [], isPending, isError, refetch } =
    useBusinessShowcaseQuery();

  const openDirectory = () => router.push("/(Screens)/business-directory");
  const openBusiness = (businessId) =>
    router.push({
      pathname: "/(Screens)/business-profile",
      params: { businessId },
    });

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>Meet the local makers</Text>
          <Text style={styles.heading}>Discover local businesses</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="See all businesses"
          onPress={openDirectory}
          style={styles.seeAllButton}
        >
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      {isPending ? (
        <View accessibilityLabel="Loading businesses" style={styles.stateCard}>
          <Text style={styles.stateText}>Loading businesses…</Text>
        </View>
      ) : isError && businesses.length === 0 ? (
        <View style={styles.stateCard}>
          <Text accessibilityRole="alert" style={styles.errorText}>
            Businesses could not load. Check your connection and try again.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => refetch()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : businesses.length === 0 ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateText}>
            No active businesses are available yet.
          </Text>
        </View>
      ) : (
        <>
          {isError ? (
            <View style={styles.refreshWarning}>
              <Text accessibilityRole="alert" style={styles.errorText}>
                Could not refresh businesses. Showing the latest available list.
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => refetch()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
          >
            {businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                compact
                onPress={() => openBusiness(business.id)}
              />
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    color: green[700],
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heading: {
    color: neutral.heading,
    fontSize: 18,
    fontWeight: "700",
  },
  seeAllButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  seeAllText: {
    color: green[700],
    fontSize: 14,
    fontWeight: "700",
  },
  rail: {
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  stateCard: {
    gap: 12,
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: green[50],
  },
  refreshWarning: {
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 10,
  },
  stateText: {
    color: neutral.body,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: green[600],
  },
  retryText: {
    color: neutral.white,
    fontSize: 14,
    fontWeight: "700",
  },
});

export default BusinessShowcase;
