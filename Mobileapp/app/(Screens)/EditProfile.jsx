import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaView } from "react-native-safe-area-context";
import axiosClient from "../../api";
import { useGlobalContext } from "../../Context/GlobalProvider";

const { width } = Dimensions.get("window");

const EditProfile = () => {
  const router = useRouter();
  const { user, setUser } = useGlobalContext();

  const [username, setUsername] = useState(user?.username || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!username.trim() || username.trim().length < 2) {
      Alert.alert("Validation Error", "Name must be at least 2 characters.");
      return;
    }

    setSaving(true);
    try {
      const res = await axiosClient.put("/api/customerauth/update-profile", {
        username: username.trim(),
        phone: phone.trim(),
      });

      setUser({
        ...user,
        username: res.data.username,
        phone: res.data.phone,
      });

      Alert.alert("Success", "Profile updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const message =
        error.response?.data?.error ||
        "Failed to update profile. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color="#16A34A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <Text style={styles.headerSubtitle}>
                Update your personal information
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Form Card */}
            <View style={styles.card}>
              {/* Full Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons
                    name="person"
                    size={20}
                    color="#16A34A"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter your name"
                    placeholderTextColor="#6B7280"
                    autoCorrect={false}
                    maxLength={128}
                  />
                </View>
              </View>

              {/* Email (read-only) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrapper, styles.inputDisabled]}>
                  <MaterialIcons
                    name="email"
                    size={20}
                    color="#4B5563"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.inputTextDisabled]}
                    value={user?.email || ""}
                    editable={false}
                  />
                  <MaterialIcons
                    name="lock"
                    size={16}
                    color="#4B5563"
                    style={{ marginLeft: 4 }}
                  />
                </View>
                <Text style={styles.fieldHint}>
                  Email cannot be changed here.
                </Text>
              </View>

              {/* Phone */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons
                    name="phone"
                    size={20}
                    color="#16A34A"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#6B7280"
                    keyboardType="phone-pad"
                    maxLength={20}
                  />
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={saving}
              style={[styles.saveButton, saving && { backgroundColor: "#D1D5DB" }]}
            >
                {saving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={20} color="white" />
                    <Text style={styles.saveText}>Save Changes</Text>
                  </>
                )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    padding: 20,
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#14532D",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    height: 52,
  },
  inputDisabled: {
    borderColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#111827",
    fontSize: 15,
    fontFamily: "Poppins-Regular",
  },
  inputTextDisabled: {
    color: "#9CA3AF",
  },
  fieldHint: {
    fontSize: 11,
    color: "#9CA3AF",
    marginLeft: 4,
    fontFamily: "Poppins-Regular",
  },
  saveButton: {
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16A34A",
  },
  saveText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
});

export default EditProfile;
