import i18n from "@/libs/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";

const toggleLanguage = async () => {
  const value = await AsyncStorage.getItem("language-preference");
  if (value === "gu") {
    await AsyncStorage.setItem("language-preference", "en");
    i18n.changeLanguage("en");
  } else {
    await AsyncStorage.setItem("language-preference", "gu");
    i18n.changeLanguage("gu");
  }
};

const updateSavedLanguagePreference = async () => {
  const value = await AsyncStorage.getItem("language-preference");
  if (value === "gu") {
    i18n.changeLanguage("gu");
  } else {
    i18n.changeLanguage("en");
  }
};

export { toggleLanguage, updateSavedLanguagePreference };
