import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BusinessCard from "../../components/businesses/BusinessCard";
import { neutral, green } from "../../constants/theme/colors";
import { useBusinessDirectoryQuery } from "../../hooks/api/useBusinessDirectory";
import { getBusinessDirectoryPages } from "../../utils/businessDirectory";

function BusinessDirectoryScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("");
  const directory = useBusinessDirectoryQuery(selectedCategory);
  const pages = getBusinessDirectoryPages(directory.data);
  const businesses = [];
  const businessIds = new Set();
  for (const page of pages) {
    for (const business of page.businesses) {
      if (businessIds.has(business.id)) continue;
      businessIds.add(business.id);
      businesses.push(business);
    }
  }
  const businessRows = [];
  for (let index = 0; index < businesses.length; index += 2) {
    businessRows.push(businesses.slice(index, index + 2));
  }
  const categories = pages[0]?.categories || [];
  const isRefreshing = directory.isRefetching && !directory.isFetchingNextPage;

  const openBusiness = (businessId) =>
    router.push({
      pathname: "/(Screens)/business-profile",
      params: { businessId },
    });

  const renderCategory = (category, label) => {
    const selected = selectedCategory === category;
    return (
      <TouchableOpacity
        key={category || "all"}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => setSelectedCategory(category)}
        style={[styles.categoryChip, selected && styles.categoryChipSelected]}
      >
        <Text
          style={[
            styles.categoryText,
            selected && styles.categoryTextSelected,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <ImageBackground
        source={require("../../assets/Businessdirectoryimage.png")}
        resizeMode="cover"
        imageStyle={styles.heroImage}
        style={styles.hero}
      >
        <View style={styles.heroOverlay}>
          <Text style={styles.eyebrow}>Local shops, real stories</Text>
          <Text style={styles.title}>Business directory</Text>
          <Text style={styles.subtitle}>
            Discover active local businesses and explore their stores.
          </Text>
        </View>
      </ImageBackground>
      {categories.length > 0 ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          accessibilityLabel="Filter businesses by category"
        >
          {renderCategory("", "All")}
          {categories.map((category) => renderCategory(category, category))}
        </ScrollView>
      ) : null}
      {!directory.isPending && !directory.isError ? (
        <Text style={styles.resultCount} accessibilityLiveRegion="polite">
          Showing {businesses.length} of {pages[0]?.pagination.total || 0} businesses
        </Text>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    if (directory.isPending) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={green[600]} />
          <Text style={styles.stateText}>Loading businesses…</Text>
        </View>
      );
    }

    if (directory.isError) {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="cloud-offline-outline" size={30} color="#B91C1C" />
          <Text accessibilityRole="alert" style={styles.errorText}>
            Businesses could not load. Check your connection and try again.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => directory.refetch()}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyCard}>
        <Ionicons name="storefront-outline" size={32} color={green[700]} />
        <Text style={styles.emptyTitle}>No businesses found</Text>
        <Text style={styles.stateText}>
          {selectedCategory
            ? "There are no active businesses in this category yet."
            : "No active businesses are available yet."}
        </Text>
        {selectedCategory ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setSelectedCategory("")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Show all businesses</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderFooter = () => {
    if (directory.isFetchingNextPage) {
      return (
        <View style={styles.footerState}>
          <ActivityIndicator color={green[600]} />
          <Text style={styles.stateText}>Loading more businesses…</Text>
        </View>
      );
    }

    if (directory.isFetchNextPageError) {
      return (
        <View style={styles.footerState}>
          <Text accessibilityRole="alert" style={styles.errorText}>
            More businesses could not load. Your current results are still here.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => directory.fetchNextPage()}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Retry loading more</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!directory.hasNextPage) return null;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => directory.fetchNextPage()}
        style={styles.loadMoreButton}
      >
        <Text style={styles.loadMoreText}>Load more businesses</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <Stack.Screen
        options={{
          title: "Businesses",
          headerShown: true,
          headerTintColor: green[700],
          headerTitleStyle: { color: neutral.heading },
        }}
      />
      <FlatList
        data={businessRows}
        keyExtractor={(row) => row[0].id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => directory.refetch()}
            tintColor={green[600]}
            colors={[green[600]]}
          />
        }
        renderItem={({ item: row }) => (
          <View style={styles.businessRow}>
            {row.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onPress={() => openBusiness(business.id)}
              />
            ))}
            {row.length === 1 ? <View style={styles.emptyColumn} /> : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: neutral.white,
  },
  listContent: {
    flexGrow: 1,
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  listHeader: {
    gap: 8,
    paddingBottom: 8,
  },
  hero: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: green[200],
  },
  heroImage: {
    borderRadius: 20,
  },
  heroOverlay: {
    minHeight: 190,
    justifyContent: "center",
    gap: 8,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  eyebrow: {
    color: green[700],
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: neutral.heading,
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: neutral.body,
    fontSize: 14,
    lineHeight: 21,
  },
  categoryList: {
    gap: 8,
    paddingVertical: 8,
  },
  categoryChip: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: neutral.border,
    backgroundColor: neutral.surface,
  },
  categoryChipSelected: {
    borderColor: green[600],
    backgroundColor: green[600],
  },
  categoryText: {
    color: neutral.body,
    fontSize: 13,
    fontWeight: "600",
  },
  categoryTextSelected: {
    color: neutral.white,
  },
  resultCount: {
    color: "#6B7280",
    fontSize: 12,
  },
  businessRow: {
    flexDirection: "row",
    gap: 12,
  },
  emptyColumn: {
    flex: 1,
  },
  stateContainer: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 36,
  },
  stateCard: {
    alignItems: "center",
    gap: 12,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#FEF2F2",
  },
  stateText: {
    color: neutral.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: green[600],
  },
  primaryButtonText: {
    color: neutral.white,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyCard: {
    alignItems: "center",
    gap: 10,
    padding: 22,
    borderRadius: 18,
    backgroundColor: green[50],
  },
  emptyTitle: {
    color: neutral.heading,
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: green[700],
    fontWeight: "700",
  },
  footerState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
  },
  loadMoreButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: green[200],
    backgroundColor: green[50],
  },
  loadMoreText: {
    color: green[800],
    fontSize: 14,
    fontWeight: "700",
  },
});

export default BusinessDirectoryScreen;
