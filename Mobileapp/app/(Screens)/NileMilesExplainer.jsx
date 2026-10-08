import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter, Stack } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import axiosClient from "../../api";
import {
  colors,
  fontFamily,
  fontSize,
  lineHeight,
  radius,
  spacing,
} from "../../constants/theme";

const ExplanationCard = ({ icon, title, copy, accentColor }) => (
  <View style={styles.explanationCard}>
    <View style={[styles.cardIcon, { backgroundColor: accentColor }]}>
      <MaterialIcons
        accessible={false}
        name={icon}
        size={fontSize.xl}
        color={colors.green[700]}
      />
    </View>
    <View style={styles.cardCopy}>
      <Text accessibilityRole="header" style={styles.cardTitle}>
        {title}
      </Text>
      <Text style={styles.bodyText}>{copy}</Text>
    </View>
  </View>
);

const NileMilesExplainer = () => {
  const router = useRouter();
  const [currentMiles, setCurrentMiles] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const requestSequence = useRef(0);

  const loadBalance = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await axiosClient.get(
        "/api/nilemiles/nilemiles/status",
      );
      const balance = response.data?.currentMiles;

      if (!Number.isSafeInteger(balance) || balance < 0) {
        throw new Error("The Nile Miles balance response is invalid.");
      }

      if (requestId === requestSequence.current) {
        setCurrentMiles(balance);
      }
    } catch (error) {
      if (requestId === requestSequence.current) {
        setHasError(true);
        console.error("Failed to load Nile Miles balance.", {
          message:
            error instanceof Error ? error.message : "Unknown request error",
        });
      }
    } finally {
      if (requestId === requestSequence.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBalance();

      return () => {
        requestSequence.current += 1;
      };
    }, [loadBalance]),
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Nile Miles",
          headerStyle: { backgroundColor: colors.neutral.white },
          headerTintColor: colors.green[900],
          headerTitleStyle: {
            color: colors.green[900],
            fontFamily: fontFamily.semiBold,
            fontSize: fontSize.sm,
          },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          
          <Text accessibilityRole="header" style={styles.title}>
            Make your shopping go further
          </Text>
          <Text style={styles.introCopy}>
            Learn how Nile Miles work, check your balance, and explore
            redemption options.
          </Text>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIcon}>
              <MaterialIcons
                accessible={false}
                name="account-balance-wallet"
                size={fontSize.xl}
                color={colors.green[700]}
              />
            </View>
            <Text style={styles.balanceLabel}>
              Your current balance
            </Text>
          </View>

          {isLoading ? (
            <View
              accessibilityRole="progressbar"
              accessibilityState={{ busy: true }}
              style={styles.balanceStatus}
            >
              <ActivityIndicator color={colors.green[600]} />
              <Text style={styles.statusText}>
                Loading your Miles balance
              </Text>
            </View>
          ) : hasError ? (
            <View style={styles.errorState}>
              <Text accessibilityLiveRegion="polite" style={styles.errorText}>
                We couldn&apos;t load your Miles balance. Check your connection
                and try again.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadBalance()}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.retryPressed,
                ]}
              >
                <MaterialIcons
                  accessible={false}
                  name="refresh"
                  size={fontSize.base}
                  color={colors.green[700]}
                />
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View
              accessibilityLabel={`${currentMiles.toLocaleString()} Miles`}
              style={styles.balanceValueRow}
            >
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={styles.balanceValue}
              >
                {currentMiles.toLocaleString()}
              </Text>
              <Text style={styles.milesLabel}>Miles</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            How you earn Miles
          </Text>
          <ExplanationCard
            accentColor={colors.green[50]}
            icon="shopping-bag"
            title="Eligible purchases"
            copy="Eligible purchases earn 1 Mile for every KSh 10, rounded down."
          />
          <ExplanationCard
            accentColor={colors.gold[50]}
            icon="workspace-premium"
            title="Nile Premium"
            copy="Premium members earn 2x the base purchase Miles on eligible purchases."
          />
          <ExplanationCard
            accentColor={colors.green[50]}
            icon="group"
            title="Eligible referrals"
            copy="You may also earn Miles through eligible referrals."
          />
        </View>

        <View style={styles.redeemCard}>
          <View style={styles.redeemCopy}>
            <Text accessibilityRole="header" style={styles.redeemTitle}>
              Put your Miles to use
            </Text>
            <Text style={styles.bodyText}>
              Miles may be redeemed for rewards. Visit Redeem to explore the
              redemption options.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Opens the Redeem screen"
            onPress={() => router.push("/Redeem")}
            style={({ pressed }) => [
              styles.redeemButton,
              pressed && styles.redeemPressed,
            ]}
          >
            <MaterialIcons
              accessible={false}
              name="card-giftcard"
              size={fontSize.base}
              color={colors.neutral.white}
            />
            <Text style={styles.redeemButtonText}>
              Explore Redeem
            </Text>
          </Pressable>
        </View>

        <View style={styles.noticeCard}>
          <MaterialIcons
            accessible={false}
            name="info-outline"
            size={fontSize.lg}
            color={colors.green[700]}
          />
          <View style={styles.noticeCopy}>
            <Text accessibilityRole="header" style={styles.noticeTitle}>
              Good to know
            </Text>
            <Text style={styles.bodyText}>
              Nile Miles have no cash value and cannot be transferred. Rewards
              are subject to availability.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing["2xl"],
    padding: spacing.xl,
    paddingBottom: spacing["3xl"],
    backgroundColor: colors.neutral.white,
  },
  intro: {
    alignItems: "center",
    gap: spacing.sm,
  },
  introIcon: {
    width: spacing["3xl"],
    height: spacing["3xl"],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.gold[50],
  },
  title: {
    color: colors.green[900],
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    textAlign: "center",
  },
  introCopy: {
    color: colors.neutral.body,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
    textAlign: "center",
  },
  balanceCard: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.green[200],
    borderRadius: radius.xl,
    backgroundColor: colors.green[50],
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  balanceIcon: {
    width: spacing["2xl"],
    height: spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.neutral.white,
  },
  balanceLabel: {
    color: colors.green[900],
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  balanceValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  balanceValue: {
    flexShrink: 1,
    color: colors.neutral.heading,
    fontFamily: fontFamily.bold,
    fontSize: fontSize["4xl"],
    lineHeight: fontSize["4xl"] * lineHeight.tight,
  },
  milesLabel: {
    color: colors.neutral.body,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
  },
  balanceStatus: {
    minHeight: spacing["3xl"],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  statusText: {
    color: colors.neutral.body,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
  },
  errorState: {
    alignItems: "flex-start",
    gap: spacing.md,
  },
  errorText: {
    color: colors.red[700],
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  retryButton: {
    minHeight: spacing["3xl"] + spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.green[600],
    borderRadius: radius.md,
    backgroundColor: colors.neutral.white,
  },
  retryText: {
    color: colors.green[700],
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.neutral.heading,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
  },
  explanationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral.surface,
  },
  cardIcon: {
    width: spacing["2xl"],
    height: spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  cardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.neutral.heading,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  bodyText: {
    color: colors.neutral.body,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  redeemCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral.surface,
  },
  redeemCopy: {
    gap: spacing.xs,
  },
  redeemTitle: {
    color: colors.green[900],
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
  },
  redeemButton: {
    minHeight: spacing["3xl"] + spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.green[600],
  },
  redeemButtonText: {
    color: colors.neutral.green,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  retryPressed: {
    backgroundColor: colors.green[50],
  },
  redeemPressed: {
    backgroundColor: colors.green[700],
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.green[200],
    borderRadius: radius.lg,
    backgroundColor: colors.green[50],
  },
  noticeCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  noticeTitle: {
    color: colors.green[900],
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
});

export default NileMilesExplainer;
