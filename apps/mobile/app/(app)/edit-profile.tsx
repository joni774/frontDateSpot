/** Edit profile — name, age, phone. */
import { getStoredUser, updateProfile } from "@datespot/api-client";
import { Button, Input } from "@datespot/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ["user"], queryFn: getStoredUser });
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setAge(String(user.age));
      setPhone(user.phone);
    }
  }, [user]);

  const onSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        age: Number(age),
        phone: phone.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      Alert.alert(t("common.success"), t("profile.updateSuccess"));
      router.back();
    } catch {
      Alert.alert(t("common.error"), t("profile.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 border-b border-border bg-surface">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-lg">← {t("common.back")}</Text>
        </Pressable>
        <Text className="text-xl font-bold text-text">{t("profile.editProfile")}</Text>
      </View>
      <View className="p-4">
        <Input label={t("auth.fullName")} value={fullName} onChangeText={setFullName} />
        <Input label={t("auth.age")} value={age} onChangeText={setAge} keyboardType="number-pad" />
        <Input label={t("auth.phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Button onPress={() => void onSave()} loading={loading}>{t("common.save")}</Button>
      </View>
    </SafeAreaView>
  );
}
