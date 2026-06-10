/** Admin places management — list, create, edit, activate/deactivate. */
import {
  createAdminPlace,
  deleteAdminPlace,
  fetchAdminPlaces,
  updateAdminPlace,
} from "@datespot/api-client";
import type {
  AdminPlace,
  AdminPlaceInput,
  PlaceCategory,
  PriceRange,
} from "@datespot/shared-types";
import { Button, Input } from "@datespot/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES: PlaceCategory[] = [
  "ROMANTIC_DATE",
  "RESTAURANT",
  "DAIRY_RESTAURANT",
  "MEAT_RESTAURANT",
  "SUSHI",
  "SUNSET",
  "ATTRACTION",
];

const PRICE_RANGES: PriceRange[] = ["FREE", "BUDGET", "MODERATE", "EXPENSIVE"];

const DEFAULT_OPENING_HOURS: Record<string, string> = {
  sunday: "09:00 - 22:00",
  monday: "09:00 - 22:00",
  tuesday: "09:00 - 22:00",
  wednesday: "09:00 - 22:00",
  thursday: "09:00 - 23:00",
  friday: "09:00 - 23:00",
  saturday: "10:00 - 23:00",
};

function emptyPlace(): AdminPlaceInput {
  return {
    nameHe: "",
    nameEn: "",
    nameAr: "",
    descriptionHe: "",
    descriptionEn: "",
    descriptionAr: "",
    category: "ROMANTIC_DATE",
    latitude: 32.0853,
    longitude: 34.7818,
    address: "",
    priceRange: "MODERATE",
    images: [],
    openingHours: { ...DEFAULT_OPENING_HOURS },
    phone: "",
    website: "",
    isActive: true,
    displayOrder: 0,
  };
}

function placeToForm(place: AdminPlace): AdminPlaceInput {
  return {
    nameHe: place.nameHe,
    nameEn: place.nameEn,
    nameAr: place.nameAr,
    descriptionHe: place.descriptionHe,
    descriptionEn: place.descriptionEn,
    descriptionAr: place.descriptionAr,
    category: place.category,
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.address,
    priceRange: place.priceRange,
    images: place.images,
    openingHours: place.openingHours,
    phone: place.phone ?? "",
    website: place.website ?? "",
    isActive: place.isActive,
    displayOrder: place.displayOrder,
  };
}

export default function AdminPlacesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminPlaceInput>(emptyPlace());
  const [imagesText, setImagesText] = useState("");

  const { data: places, isLoading, error } = useQuery({
    queryKey: ["admin-places"],
    queryFn: fetchAdminPlaces,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        displayOrder: Number(form.displayOrder) || 0,
        images: imagesText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        phone: form.phone || undefined,
        website: form.website || undefined,
      };
      if (editingId) {
        return updateAdminPlace(editingId, payload);
      }
      return createAdminPlace(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-places"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      closeModal();
      Alert.alert(t("common.success"), t("admin.placeSaved"));
    },
    onError: (err) =>
      Alert.alert(
        t("common.error"),
        err instanceof Error ? err.message : t("admin.placeSaveFailed")
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminPlace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-places"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => Alert.alert(t("common.error"), t("admin.placeDeleteFailed")),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAdminPlace(id, { isActive }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-places"] }),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyPlace());
    setImagesText("");
    setModalVisible(true);
  };

  const openEdit = (place: AdminPlace) => {
    setEditingId(place.id);
    setForm(placeToForm(place));
    setImagesText(place.images.join("\n"));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setForm(emptyPlace());
    setImagesText("");
  };

  const confirmDelete = (place: AdminPlace) => {
    Alert.alert(t("admin.deletePlace"), place.nameHe, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("admin.deactivate"),
        style: "destructive",
        onPress: () => deleteMutation.mutate(place.id),
      },
    ]);
  };

  const updateField = <K extends keyof AdminPlaceInput>(
    key: K,
    value: AdminPlaceInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center flex-1">
          <Pressable onPress={() => router.back()} className="mr-3">
            <Text className="text-primary text-lg">← {t("common.back")}</Text>
          </Pressable>
          <Text className="text-xl font-bold text-text">{t("admin.places")}</Text>
        </View>
        <Pressable onPress={openCreate} className="bg-primary px-3 py-2 rounded-lg">
          <Text className="text-white font-semibold text-sm">+ {t("admin.addPlace")}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E84393" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center">
            {error instanceof Error ? error.message : t("common.error")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={places ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-2">
                  <Text className="text-base font-semibold text-text">
                    {item.nameHe}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {t(`place.categories.${item.category}`)}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">
                    {item.address}
                  </Text>
                </View>
                <View
                  className={`px-2 py-1 rounded-full ${
                    item.isActive ? "bg-green-100" : "bg-gray-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      item.isActive ? "text-green-700" : "text-gray-500"
                    }`}
                  >
                    {item.isActive ? t("admin.active") : t("admin.inactive")}
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-2 mt-3">
                <Pressable
                  onPress={() => openEdit(item)}
                  className="flex-1 py-2 rounded-lg border border-primary items-center"
                >
                  <Text className="text-primary text-sm font-medium">
                    {t("admin.edit")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    toggleActiveMutation.mutate({
                      id: item.id,
                      isActive: !item.isActive,
                    })
                  }
                  className="flex-1 py-2 rounded-lg border border-gray-200 items-center"
                >
                  <Text className="text-gray-700 text-sm font-medium">
                    {item.isActive ? t("admin.deactivate") : t("admin.activate")}
                  </Text>
                </Pressable>
                {item.isActive && (
                  <Pressable
                    onPress={() => confirmDelete(item)}
                    className="px-3 py-2 rounded-lg border border-red-200 items-center"
                  >
                    <Text className="text-red-500 text-sm font-medium">×</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 py-8">
              {t("admin.noPlaces")}
            </Text>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <Pressable onPress={closeModal}>
              <Text className="text-primary">{t("common.cancel")}</Text>
            </Pressable>
            <Text className="text-lg font-bold text-text">
              {editingId ? t("admin.editPlace") : t("admin.addPlace")}
            </Text>
            <View className="w-12" />
          </View>

          <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
            <Input
              label={t("admin.nameHe")}
              value={form.nameHe}
              onChangeText={(v) => updateField("nameHe", v)}
            />
            <Input
              label={t("admin.nameEn")}
              value={form.nameEn}
              onChangeText={(v) => updateField("nameEn", v)}
            />
            <Input
              label={t("admin.nameAr")}
              value={form.nameAr}
              onChangeText={(v) => updateField("nameAr", v)}
            />
            <Input
              label={t("admin.descriptionHe")}
              value={form.descriptionHe}
              onChangeText={(v) => updateField("descriptionHe", v)}
              multiline
            />
            <Input
              label={t("admin.descriptionEn")}
              value={form.descriptionEn}
              onChangeText={(v) => updateField("descriptionEn", v)}
              multiline
            />
            <Input
              label={t("admin.descriptionAr")}
              value={form.descriptionAr}
              onChangeText={(v) => updateField("descriptionAr", v)}
              multiline
            />
            <Input
              label={t("admin.address")}
              value={form.address}
              onChangeText={(v) => updateField("address", v)}
            />
            <Input
              label={t("admin.latitude")}
              value={String(form.latitude)}
              onChangeText={(v) => updateField("latitude", Number(v) || 0)}
              keyboardType="decimal-pad"
            />
            <Input
              label={t("admin.longitude")}
              value={String(form.longitude)}
              onChangeText={(v) => updateField("longitude", Number(v) || 0)}
              keyboardType="decimal-pad"
            />
            <Input
              label={t("admin.phone")}
              value={form.phone ?? ""}
              onChangeText={(v) => updateField("phone", v)}
            />
            <Input
              label={t("admin.website")}
              value={form.website ?? ""}
              onChangeText={(v) => updateField("website", v)}
              autoCapitalize="none"
            />
            <Input
              label={t("admin.displayOrder")}
              value={String(form.displayOrder)}
              onChangeText={(v) => updateField("displayOrder", Number(v) || 0)}
              keyboardType="number-pad"
            />
            <Input
              label={t("admin.imageUrls")}
              value={imagesText}
              onChangeText={setImagesText}
              multiline
              placeholder="https://..."
            />

            <Text className="text-sm font-medium text-text mb-2">
              {t("admin.category")}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => updateField("category", cat)}
                  className={`mr-2 px-3 py-2 rounded-full ${
                    form.category === cat ? "bg-primary" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      form.category === cat ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {t(`place.categories.${cat}`)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text className="text-sm font-medium text-text mb-2">
              {t("admin.priceRange")}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              {PRICE_RANGES.map((range) => (
                <Pressable
                  key={range}
                  onPress={() => updateField("priceRange", range)}
                  className={`mr-2 px-3 py-2 rounded-full ${
                    form.priceRange === range ? "bg-primary" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      form.priceRange === range ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {t(`place.priceRange.${range}`)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Button
              loading={saveMutation.isPending}
              onPress={() => saveMutation.mutate()}
            >
              {t("common.save")}
            </Button>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
