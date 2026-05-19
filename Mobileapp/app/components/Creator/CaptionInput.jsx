/**
 * CaptionInput — Instagram-style avatar + multiline text input.
 * No border, clean typography, inline char count.
 */

import { Image } from "expo-image";
import { StyleSheet, Text, TextInput, View } from "react-native";

const DEFAULT_AVATAR =
  "https://fra.cloud.appwrite.io/v1/storage/buckets/692a3b700039c02fb4bc/files/695439130011158bb8af/view?project=6926c7df002fa7831d94";

export default function CaptionInput({
  value,
  onChangeText,
  maxLength,
  userAvatar,
}) {
  const avatarUri = userAvatar || DEFAULT_AVATAR;

  return (
    <View style={s.container}>
      <Image
        source={{ uri: avatarUri }}
        style={s.avatar}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={s.inputWrap}>
        <TextInput
          style={[s.input, { color: "#111827" }]}
          placeholder="Write a caption…"
          placeholderTextColor="#8E8E8E"
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={maxLength}
          textAlignVertical="top"
          scrollEnabled={false}
        />
        {value.length > 0 && (
          <Text style={s.charCount}>
            {value.length.toLocaleString()}/{maxLength.toLocaleString()}
          </Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    marginTop: 2,
  },
  inputWrap: { flex: 1 },
  input: {
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: 0,
    minHeight: 44,
  },
  charCount: {
    fontSize: 12,
    color: "#8E8E8E",
    textAlign: "right",
    marginTop: 8,
  },
});
