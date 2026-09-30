import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  StatusBar,
  useWindowDimensions,
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";

import { useAuth } from "../context/AuthContext";

import {
  useRoute,
  useNavigation,
} from "@react-navigation/native";

import Config from "react-native-config";


/* =========================================================
   BASE URL
========================================================= */

export const BASE_URL = Config.API_BASE_URL;


/* =========================================================
   TYPES
========================================================= */

interface Day {
  id: string;
  short: string;
  full: string;
}

interface DayMenu {
  breakfast?: string[];
  lunch?: string[];
  dinner?: string[];
  eveningSnack?: string[];
}

// interface MenuObject {
//   weekMenu?: {
//     [key: string]: DayMenu;
//   };
// }

interface DayPhotos {
  breakfast?: string[];
  lunch?: string[];
  dinner?: string[];
  eveningSnack?: string[];
}

interface MenuObject {
  weekMenu?: {
    [key: string]: DayMenu;
  };
  photos?: {
    [key: string]: DayPhotos;
  };
}

interface TodayMenu {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  eveningSnacks: string[];
}


/* =========================================================
   DAYS
========================================================= */

const days: Day[] = [
  {
    id: "01",
    short: "MON",
    full: "Monday",
  },
  {
    id: "02",
    short: "TUE",
    full: "Tuesday",
  },
  {
    id: "03",
    short: "WED",
    full: "Wednesday",
  },
  {
    id: "04",
    short: "THU",
    full: "Thursday",
  },
  {
    id: "05",
    short: "FRI",
    full: "Friday",
  },
  {
    id: "06",
    short: "SAT",
    full: "Saturday",
  },
  {
    id: "07",
    short: "SUN",
    full: "Sunday",
  },
];


/* =========================================================
   MEAL TYPES
========================================================= */

type MealType =
  | "breakfast"
  | "lunch"
  | "eveningSnacks"
  | "dinner";


interface MealConfig {
  title: string;
  time: string;
  background: string;
  badgeBackground: string;
}


/* =========================================================
   MEAL CONFIG
========================================================= */

const mealConfig: Record<MealType, MealConfig> = {
  breakfast: {
    title: "Breakfast",
    time: "7:30 AM - 9:30 AM",
    background: "#F8ECE5",
    badgeBackground: "#F1DFD2",
  },

  lunch: {
    title: "Lunch",
    time: "12:20 PM - 2:00 PM",
    background: "#EEF5EA",
    badgeBackground: "#DFECDC",
  },

  eveningSnacks: {
    title: "Evening Snacks",
    time: "4:30 PM - 5:30 PM",
    background: "#FFF0E6",
    badgeBackground: "#F5DFCF",
  },

  dinner: {
    title: "Dinner",
    time: "8:00 PM - 9:45 PM",
    background: "#F1EDFA",
    badgeBackground: "#E6DFF7",
  },
};


/* =========================================================
   MEAL IMAGES
========================================================= */

// const mealImages: Record<MealType, any> = {
//   breakfast: require("../../assets/images/breakfast.jpg"),
//   lunch: require("../../assets/images/breakfast.jpg"),
//   eveningSnacks: require("../../assets/images/breakfast.jpg"),
//   dinner: require("../../assets/images/breakfast.jpg"),
// };

/* =========================================================
   SCREEN
========================================================= */

export default function FoodMenuScreen() {

  const { user } = useAuth();

  const token = user?.token;

  const route = useRoute<any>();

  const navigation = useNavigation<any>();


  /* =======================================================
     RESPONSIVE SCREEN WIDTH
  ======================================================= */

  const { width } = useWindowDimensions();

  /*
    Small phone:
    horizontal day selector

    Larger screen:
    vertical day selector
  */

  const isSmallScreen = width < 400;


  /* =======================================================
     TODAY
  ======================================================= */

  const dayNames: string[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const todayName =
    dayNames[new Date().getDay()];


  /* =======================================================
     STATE
  ======================================================= */

  const [menus, setMenus] =
    useState<MenuObject[]>([]);

  const [loading, setLoading] =
    useState<boolean>(false);

  const [activeDay, setActiveDay] =
    useState<string>(
      route.params?.initialDay ||
        todayName
    );


  /* =======================================================
     FETCH MENU
  ======================================================= */

  useEffect(() => {

    if (token) {
      fetchMenus();
    }

  }, [token]);


  const fetchMenus =
    async (): Promise<void> => {

      try {

        setLoading(true);

        const res =
          await axios.get(
            `${BASE_URL}/api/food-menu/user-menus`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        /* ===================================================
           DEBUG API RESPONSE
        =================================================== */

console.log(
  "FULL FOOD MENU API RESPONSE:",
  JSON.stringify(res?.data, null, 2)
);

// Find all URLs in the backend response
// const responseString = JSON.stringify(res?.data);

// const allUrls = responseString.match(
//   /https?:\/\/[^\s"'\\]+/g
// ) || [];

// // Remove duplicate URLs
// const uniqueUrls = [...new Set(allUrls)];

// // Filter image URLs
// const imageUrls = uniqueUrls.filter((url) =>
//   /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url) ||
//   /image|img|photo|picture|upload|media/i.test(url)
// );

// Print count and URLs
// console.log("=================================");
// console.log("TOTAL IMAGE URLS:", imageUrls.length);
// console.log("IMAGE URLS:", imageUrls);
// console.log("=================================");

// imageUrls.forEach((url, index) => {
//   console.log(`IMAGE ${index + 1}:`, url);
// });
        // console.log(
        //   "FULL FOOD MENU API RESPONSE:",
        //   JSON.stringify(
        //     res?.data,
        //     null,
        //     2
        //   )
        // );

        // console.log(
        //   "MENU COUNT:",
        //   res?.data?.menus?.length || 0
        // );


        /*
          Check whether API response contains
          any image-related fields.
        */

        const responseString =
          JSON.stringify(res?.data);

        console.log(
          "HAS IMAGE FIELD:",
          /image|img|photo|picture/i.test(
            responseString
          )
        );


        setMenus(
          res?.data?.menus || []
        );

      } catch (e: any) {

        console.log(
          "Food Menu Error:",
          e?.response?.data || e
        );

      } finally {

        setLoading(false);

      }
    };


  /* =======================================================
     GET SELECTED DAY MENU
  ======================================================= */

  const getMenus =
    (): TodayMenu | null => {

      for (
        const menuObj of menus
      ) {

        const dayData =
          menuObj?.weekMenu?.[
            activeDay
          ];

        if (dayData) {

          return {

            breakfast:
              dayData.breakfast ||
              [],

            lunch:
              dayData.lunch ||
              [],

            eveningSnacks:
              dayData.eveningSnack ||
              [],

            dinner:
              dayData.dinner ||
              [],

          };

        }

      }

      return null;
    };


  const todayMenu =
    getMenus();


  console.log(
    "Today's Menu:",
    todayMenu
  );


  /* =======================================================
     RENDER FOOD ITEM
     
     Food items no longer contain individual images.
     Only the meal section has one image.
  ======================================================= */

  const renderFoodItem = (
    item: string,
    index: number
  ) => {

    return (

      <View
        key={`${item}-${index}`}
        style={[
          styles.foodItem,

          isSmallScreen &&
            styles.foodItemSmall,
        ]}
      >

        <View
          style={[
            styles.foodNameContainer,

            isSmallScreen &&
              styles.foodNameContainerSmall,
          ]}
        >

          <Text
            style={[
              styles.foodName,

              isSmallScreen &&
                styles.foodNameSmall,
            ]}
            numberOfLines={3}
          >
            {item}
          </Text>

        </View>

      </View>

    );
  };





const getMealImage = (mealType: MealType): string | null => {
  const apiMealType =
    mealType === "eveningSnacks"
      ? "eveningSnack"
      : mealType;

  for (const menuObj of menus) {
    const photosForDay = menuObj?.photos?.[activeDay];

    if (!photosForDay) {
      continue;
    }

    const photos =
      photosForDay[
        apiMealType as keyof DayPhotos
      ];

    if (photos && photos.length > 0) {
      const photoPath = photos[0];

      if (
        photoPath.startsWith("http://") ||
        photoPath.startsWith("https://")
      ) {
        return photoPath;
      }

      return `${BASE_URL}${photoPath}`;
    }
  }

  return null;
};



  /* =======================================================
     RENDER MEAL SECTION
  ======================================================= */

  const renderMealSection = (
    mealType: MealType,
    foodArray: string[]
  ) => {

    const config =
      mealConfig[mealType];

    const items =
      foodArray || [];


    return (

      <View
        style={[
          styles.mealCard,

          isSmallScreen &&
            styles.mealCardSmall,

          {
            backgroundColor:
              config.background,
          },
        ]}
      >

        {/* ===============================================
            MEAL HEADER
        =============================================== */}

        <View
          style={[
            styles.mealHeader,

            isSmallScreen &&
              styles.mealHeaderSmall,
          ]}
        >

          {/* LEFT SIDE */}

          <View
            style={styles.mealHeaderText}
          >

            <Text
              style={[
                styles.mealTitle,

                isSmallScreen &&
                  styles.mealTitleSmall,
              ]}
            >
              {config.title}
            </Text>


            <Text
              style={[
                styles.mealTime,

                isSmallScreen &&
                  styles.mealTimeSmall,
              ]}
            >
              {config.time}
            </Text>

          </View>


          {/* ==========================================
              ONE IMAGE FOR THE MEAL
          ========================================== */}

          <View
            style={[
              styles.mealImageWrapper,

              isSmallScreen &&
                styles.mealImageWrapperSmall,
            ]}
          >

           {getMealImage(mealType) ? (
  <Image
    source={{ uri: getMealImage(mealType)! }}
    style={styles.mealImage}
    resizeMode="cover"
  />
) : (
  <View style={styles.noMealImage}>
    <Ionicons
      name="image-outline"
      size={28}
      color="#A69B92"
    />
  </View>
)} 

          </View>

        </View>


        {/* ===============================================
            FOOD AREA
        =============================================== */}

        <View
          style={[
            styles.foodGridContainer,

            isSmallScreen &&
              styles.foodGridContainerSmall,
          ]}
        >

          {items.length > 0 ? (

            <View
              style={styles.foodGrid}
            >

              {items.map(
                (
                  item: string,
                  index: number
                ) =>
                  renderFoodItem(
                    item,
                    index
                  )
              )}

            </View>

          ) : (

            <View
              style={styles.emptyFood}
            >

              <Ionicons
                name="restaurant-outline"
                size={30}
                color="#A69B92"
              />

              <Text
                style={
                  styles.emptyFoodText
                }
              >
                Not Available
              </Text>

            </View>

          )}

        </View>

      </View>

    );
  };


  /* =======================================================
     HEADER
  ======================================================= */

  const renderHeader = () => {

    return (

      <ImageBackground
        source={require(
          "../../assets/images/breakfast.jpg"
        )}
        style={[
          styles.header,

          isSmallScreen &&
            styles.headerSmall,
        ]}
        imageStyle={
          styles.headerImage
        }
      >

        {/* DARK OVERLAY */}

        <View
          style={styles.headerOverlay}
        />


        {/* BACK BUTTON */}

        <TouchableOpacity
          style={[
            styles.backButton,

            isSmallScreen &&
              styles.backButtonSmall,
          ]}
          onPress={() =>
            navigation.goBack()
          }
          activeOpacity={0.8}
        >

          <Ionicons
            name="chevron-back"
            size={32}
            color="#FFFFFF"
          />

        </TouchableOpacity>


        {/* HEADER CONTENT */}

        <View
          style={[
            styles.headerContent,

            isSmallScreen &&
              styles.headerContentSmall,
          ]}
        >

          <Text
            style={[
              styles.headerTitle,

              isSmallScreen &&
                styles.headerTitleSmall,
            ]}
          >
            Food Menu
          </Text>


          <View
            style={
              styles.headerSubtitleRow
            }
          >

            <Text
              style={
                styles.headerSubtitle
              }
            >
              Fresh Food
            </Text>


            <Text
              style={styles.headerDot}
            >
              •
            </Text>


            <Text
              style={
                styles.headerSubtitle
              }
            >
              Healthy Choice
            </Text>


            <Text
              style={styles.headerDot}
            >
              •
            </Text>


            <Text
              style={
                styles.headerSubtitle
              }
            >
              Better You
            </Text>

          </View>

        </View>

      </ImageBackground>

    );
  };


  /* =======================================================
     DAY SELECTOR
  ======================================================= */

  const renderDays = () => {

    /* =====================================================
       SMALL SCREEN
       Horizontal days
    ===================================================== */

    if (isSmallScreen) {

      return (

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.daysHorizontalContent
          }
          style={
            styles.daysHorizontal
          }
        >

          {days.map(
            (day: Day) => {

              const isActive =
                activeDay ===
                day.full;


              return (

                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayButtonHorizontal,

                    isActive &&
                      styles.dayButtonActive,
                  ]}
                  onPress={() =>
                    setActiveDay(
                      day.full
                    )
                  }
                  activeOpacity={0.8}
                >

                  {isActive && (

                    <View
                      style={
                        styles.activeIndicatorHorizontal
                      }
                    />

                  )}


                  <Text
                    style={[
                      styles.dayText,

                      isActive &&
                        styles.dayTextActive,
                    ]}
                  >
                    {day.short}
                  </Text>

                </TouchableOpacity>

              );

            }
          )}

        </ScrollView>

      );
    }


    /* =====================================================
       LARGE SCREEN
       Vertical days
    ===================================================== */

    return (

      <View
        style={
          styles.daysContainer
        }
      >

        {days.map(
          (day: Day) => {

            const isActive =
              activeDay ===
              day.full;


            return (

              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayButton,

                  isActive &&
                    styles.dayButtonActive,
                ]}
                onPress={() =>
                  setActiveDay(
                    day.full
                  )
                }
                activeOpacity={0.8}
              >

                {isActive && (

                  <View
                    style={
                      styles.activeIndicator
                    }
                  />

                )}


                <Text
                  style={[
                    styles.dayText,

                    isActive &&
                      styles.dayTextActive,
                  ]}
                >
                  {day.short}
                </Text>

              </TouchableOpacity>

            );

          }
        )}

      </View>

    );
  };


  /* =======================================================
     RETURN
  ======================================================= */

  return (

    <View
      style={styles.screen}
    >

      <StatusBar
        barStyle="light-content"
        backgroundColor="#5D351F"
      />


      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        {renderHeader()}


        {/* =================================================
            SMALL SCREEN
        ================================================= */}

        {isSmallScreen ? (

          <View
            style={
              styles.smallScreenContent
            }
          >

            {/* DAYS */}

            {renderDays()}


            {/* MENU */}

            <View
              style={
                styles.smallMenuContainer
              }
            >

              {loading ? (

                <View
                  style={
                    styles.loadingContainer
                  }
                >

                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    Loading menu...
                  </Text>

                </View>

              ) : todayMenu ? (

                <>

                  {/* BREAKFAST */}

                  {renderMealSection(
                    "breakfast",
                    todayMenu.breakfast
                  )}


                  {/* LUNCH */}

                  {renderMealSection(
                    "lunch",
                    todayMenu.lunch
                  )}


                  {/* EVENING SNACKS */}

                  {renderMealSection(
                    "eveningSnacks",
                    todayMenu.eveningSnacks
                  )}


                  {/* DINNER */}

                  {renderMealSection(
                    "dinner",
                    todayMenu.dinner
                  )}

                </>

              ) : (

                <View
                  style={
                    styles.noDataContainer
                  }
                >

                  <Ionicons
                    name="restaurant-outline"
                    size={45}
                    color="#A99C90"
                  />

                  <Text
                    style={
                      styles.noDataTitle
                    }
                  >
                    No Menu Available
                  </Text>

                  <Text
                    style={
                      styles.noDataSubtitle
                    }
                  >
                    There is no food menu
                    available for{" "}
                    {activeDay}.
                  </Text>

                </View>

              )}

            </View>

          </View>

        ) : (

          /* =================================================
             LARGE SCREEN
          ================================================= */

          <View
            style={styles.mainContent}
          >

            {/* DAYS */}

            {renderDays()}


            {/* MENU */}

            <View
              style={
                styles.menuContainer
              }
            >

              {loading ? (

                <View
                  style={
                    styles.loadingContainer
                  }
                >

                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    Loading menu...
                  </Text>

                </View>

              ) : todayMenu ? (

                <>

                  {/* BREAKFAST */}

                  {renderMealSection(
                    "breakfast",
                    todayMenu.breakfast
                  )}


                  {/* LUNCH */}

                  {renderMealSection(
                    "lunch",
                    todayMenu.lunch
                  )}


                  {/* EVENING SNACKS */}

                  {renderMealSection(
                    "eveningSnacks",
                    todayMenu.eveningSnacks
                  )}


                  {/* DINNER */}

                  {renderMealSection(
                    "dinner",
                    todayMenu.dinner
                  )}

                </>

              ) : (

                <View
                  style={
                    styles.noDataContainer
                  }
                >

                  <Ionicons
                    name="restaurant-outline"
                    size={45}
                    color="#A99C90"
                  />

                  <Text
                    style={
                      styles.noDataTitle
                    }
                  >
                    No Menu Available
                  </Text>

                  <Text
                    style={
                      styles.noDataSubtitle
                    }
                  >
                    There is no food menu
                    available for{" "}
                    {activeDay}.
                  </Text>

                </View>

              )}

            </View>

          </View>

        )}

      </ScrollView>

    </View>

  );

}


/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  /* =======================================================
     SCREEN
  ======================================================= */

  screen: {
    flex: 1,
    backgroundColor: "#FBFAF8",
  },

  container: {
    flex: 1,
    backgroundColor: "#FBFAF8",
  },

  scrollContent: {
    paddingBottom: 30,
  },


  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    width: "100%",
    height: 255,
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  headerSmall: {
    height: 220,
  },

  headerImage: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      "rgba(45, 25, 14, 0.48)",
  },

  backButton: {
    position: "absolute",
    top: 52,
    left: 18,
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
  },

  backButtonSmall: {
    top: 42,
  },

  headerContent: {
    paddingHorizontal: 30,
    paddingBottom: 27,
  },

  headerContentSmall: {
    paddingHorizontal: 22,
    paddingBottom: 23,
  },
noMealImage: {
  width: "100%",
  height: "100%",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#EFEAE5",
},
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1,
  },

  headerTitleSmall: {
    fontSize: 31,
  },

  headerSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 8,
  },

  headerSubtitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },

  headerDot: {
    color: "#FFFFFF",
    marginHorizontal: 7,
    fontSize: 13,
  },


  /* =======================================================
     LARGE SCREEN
  ======================================================= */

  mainContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingTop: 27,
  },


  /* =======================================================
     SMALL SCREEN
  ======================================================= */

  smallScreenContent: {
    paddingTop: 15,
    paddingHorizontal: 12,
  },

  smallMenuContainer: {
    width: "100%",
  },


  /* =======================================================
     DAY SELECTOR
  ======================================================= */

  daysContainer: {
    width: 105,
    backgroundColor: "#F5F1ED",
    borderRadius: 18,
    paddingVertical: 10,
    marginRight: 10,
  },

  dayButton: {
    height: 78,
    width: "100%",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  daysHorizontal: {
    marginBottom: 15,
  },

  daysHorizontalContent: {
    paddingHorizontal: 2,
    gap: 8,
  },

  dayButtonHorizontal: {
    minWidth: 73,
    height: 48,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: "#F5F1ED",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },


  /* =======================================================
     ACTIVE DAY
  ======================================================= */

  dayButtonActive: {
    backgroundColor: "#A8653B",
  },

  activeIndicator: {
    position: "absolute",
    left: 11,
    width: 3,
    height: 27,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  activeIndicatorHorizontal: {
    position: "absolute",
    left: 9,
    width: 3,
    height: 20,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  dayText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4E4A47",
    letterSpacing: 0.4,
  },

  dayTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },


  /* =======================================================
     MENU CONTAINER
  ======================================================= */

  menuContainer: {
    flex: 1,
    minWidth: 0,
  },


  /* =======================================================
     MEAL CARD
  ======================================================= */

  mealCard: {
    width: "100%",
    borderRadius: 19,
    marginBottom: 18,
    overflow: "hidden",

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.07,

    shadowRadius: 8,

    elevation: 2,
  },

  mealCardSmall: {
    borderRadius: 17,
    marginBottom: 15,
  },


  /* =======================================================
     MEAL HEADER
  ======================================================= */

  mealHeader: {
    minHeight: 90,
    paddingHorizontal: 17,
    paddingVertical: 9,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  mealHeaderSmall: {
    minHeight: 76,
    paddingHorizontal: 15,
  },

  mealHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },

  mealTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#24201E",
    letterSpacing: -0.3,
  },

  mealTitleSmall: {
    fontSize: 21,
  },

  mealTime: {
    color: "#80624D",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },

  mealTimeSmall: {
    fontSize: 11,
  },


  /* =======================================================
     MEAL IMAGE
  ======================================================= */

  mealImageWrapper: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#EFEAE5",
    flexShrink: 0,
  },

  mealImageWrapperSmall: {
    width: 58,
    height: 58,
    borderRadius: 12,
  },

  mealImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },


  /* =======================================================
     FOOD AREA
  ======================================================= */

  foodGridContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  foodGridContainerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

 


  /* =======================================================
     FOOD ITEM
  ======================================================= */

 


  /* =======================================================
     FOOD NAME
  ======================================================= */

  foodNameContainer: {
    flex: 1,
    minWidth: 0,
  },

  foodNameContainerSmall: {
    flex: 1,
  },

  foodName: {
    color: "#25211F",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },

  foodNameSmall: {
    fontSize: 12,
    lineHeight: 16,
  },


  /* =======================================================
     EMPTY FOOD
  ======================================================= */

  emptyFood: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyFoodText: {
    marginTop: 5,
    fontSize: 13,
    color: "#938980",
    fontWeight: "600",
  },


  /* =======================================================
     LOADING
  ======================================================= */

  loadingContainer: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    fontSize: 15,
    color: "#806F63",
    fontWeight: "600",
  },


  foodGrid: {
  width: "100%",
  flexDirection: "row",
  flexWrap: "wrap",
},

foodItem: {
  width: "50%",
  minHeight: 48,

  backgroundColor: "#FFFFFF",

  borderBottomWidth: 1,
  borderBottomColor: "#EDE9E5",

  paddingHorizontal: 10,
  paddingVertical: 10,

  justifyContent: "center",
},
foodItemSmall: {
  width: "50%",
  minHeight: 44,
  paddingHorizontal: 8,
  paddingVertical: 8,
},

  /* =======================================================
     NO DATA
  ======================================================= */

  noDataContainer: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  noDataTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#3C2A1E",
  },

  noDataSubtitle: {
    marginTop: 7,
    fontSize: 13,
    color: "#8B817A",
    textAlign: "center",
    lineHeight: 19,
  },

});











// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
// } from "react-native";
// import Ionicons from "react-native-vector-icons/Ionicons";
// import axios from "axios";
// import { useAuth } from "../context/AuthContext";
// import HeaderGradient from "../components/HeaderGradient";
// import { useRoute } from "@react-navigation/native";
// import Config from "react-native-config";

// export const BASE_URL = Config.API_BASE_URL;

// const days = [
//   { id: "01", short: "Mon", full: "Monday" },
//   { id: "02", short: "Tue", full: "Tuesday" },
//   { id: "03", short: "Wed", full: "Wednesday" },
//   { id: "04", short: "Thu", full: "Thursday" },
//   { id: "05", short: "Fri", full: "Friday" },
//   { id: "06", short: "Sat", full: "Saturday" },
//   { id: "07", short: "Sun", full: "Sunday" },
// ];

// export default function FoodMenuScreen() {
//   const { user } = useAuth();
//   const token = user?.token;

//   const route = useRoute();

//   const dayNames = [
//     "Sunday",
//     "Monday",
//     "Tuesday",
//     "Wednesday",
//     "Thursday",
//     "Friday",
//     "Saturday",
//   ];

//   const todayName = dayNames[new Date().getDay()];

//   const [menus, setMenus] = useState([]);

//   const [activeDay, setActiveDay] = useState(
//     route.params?.initialDay || todayName
//   );

//   useEffect(() => {
//     fetchMenus();
//   }, []);

//   const fetchMenus = async () => {
//     try {
//       const res = await axios.get(
//         `${BASE_URL}/api/food-menu/user-menus`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       setMenus(res.data.menus || []);
//     } catch (e) {
//       console.log(
//         "Food Menu Error: ",
//         e?.response?.data || e
//       );
//     }
//   };

//   const getMenus = () => {
//     return menus
//       .map((menuObj) => {
//         const dayData = menuObj?.weekMenu?.[activeDay];

//         if (!dayData) return null;

//         return {
//           breakfast: dayData.breakfast || [],
//           lunch: dayData.lunch || [],
//           dinner: dayData.dinner || [],
//           eveningSnacks: dayData.eveningSnack || [],
//         };
//       })
//       .filter(Boolean)[0];
//   };

//   const todayMenu = getMenus();

//   console.log("Today's Menu:", todayMenu);

//   /**
//    * Render food items in exactly 2 columns
//    */
//   const renderFood = (arr) => {
//     if (!arr?.length) {
//       return (
//         <Text style={styles.noFoodText}>
//           Not Available
//         </Text>
//       );
//     }

//     return (
//       <View style={styles.foodGrid}>
//         {arr.map((item, index) => (
//           <View
//             key={`${item}-${index}`}
//             style={styles.foodItem}
//           >
//             <Text style={styles.foodText}>
//               • {item}
//             </Text>
//           </View>
//         ))}
//       </View>
//     );
//   };

//   return (
//     <ScrollView
//       style={styles.container}
//       showsVerticalScrollIndicator={false}
//     >
//       {/* HEADER */}
//       <HeaderGradient
//         image={require("../../assets/images/breakfast.jpg")}
//         title="Food Menu"
//       />

//       {/* DAY SCROLL */}
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         style={styles.dayScroll}
//         contentContainerStyle={styles.dayScrollContent}
//       >
//         {days.map((d) => (
//           <TouchableOpacity
//             key={d.id}
//             style={[
//               styles.dayBox,
//               activeDay === d.full && styles.dayBoxActive,
//             ]}
//             onPress={() => setActiveDay(d.full)}
//           >
//             <Text
//               style={[
//                 styles.dayId,
//                 activeDay === d.full && styles.white,
//               ]}
//             >
//               {d.id}
//             </Text>

//             <Text
//               style={[
//                 styles.dayName,
//                 activeDay === d.full && styles.white,
//               ]}
//             >
//               {d.short}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>

//       {todayMenu ? (
//         <>
//           {/* BREAKFAST */}
//           <View
//             style={[
//               styles.card,
//               styles.breakfastCard,
//             ]}
//           >
//             <View style={styles.cardHeader}>
//               <View style={styles.titleContainer}>
//                 <Ionicons
//                   name="sunny-outline"
//                   size={24}
//                   color="#3C2A1E"
//                 />

//                 <Text style={styles.cardTitle}>
//                   Breakfast
//                 </Text>
//               </View>

//               <Text style={styles.time}>
//                 7:30 AM - 9:30 AM
//               </Text>
//             </View>

//             <View style={styles.line} />

//             <View style={styles.foodContainer}>
//               {renderFood(todayMenu.breakfast)}
//             </View>
//           </View>

//           {/* LUNCH */}
//           <View
//             style={[
//               styles.card,
//               styles.lunchCard,
//             ]}
//           >
//             <View style={styles.cardHeader}>
//               <View style={styles.titleContainer}>
//                 <Ionicons
//                   name="sunny"
//                   size={24}
//                   color="#3C2A1E"
//                 />

//                 <Text style={styles.cardTitle}>
//                   Lunch
//                 </Text>
//               </View>

//               <Text style={styles.time}>
//                 12:20 PM - 2:00 PM
//               </Text>
//             </View>

//             <View style={styles.line} />

//             <View style={styles.foodContainer}>
//               {renderFood(todayMenu.lunch)}
//             </View>
//           </View>

//           {/* EVENING SNACKS */}
//           <View
//             style={[
//               styles.card,
//               styles.eveningSnackCard,
//             ]}
//           >
//             <View style={styles.cardHeader}>
//               <View style={styles.titleContainer}>
//                 <Ionicons
//                   name="cafe-outline"
//                   size={24}
//                   color="#3C2A1E"
//                 />

//                 <Text style={styles.cardTitle}>
//                   Evening Snacks
//                 </Text>
//               </View>

//               <Text style={styles.time}>
//                 4:30 PM - 5:30 PM
//               </Text>
//             </View>

//             <View style={styles.line} />

//             <View style={styles.foodContainer}>
//               {renderFood(todayMenu.eveningSnacks)}
//             </View>
//           </View>

//           {/* DINNER */}
//           <View
//             style={[
//               styles.card,
//               styles.dinnerCard,
//             ]}
//           >
//             <View style={styles.cardHeader}>
//               <View style={styles.titleContainer}>
//                 <Ionicons
//                   name="moon-outline"
//                   size={24}
//                   color="#3C2A1E"
//                 />

//                 <Text style={styles.cardTitle}>
//                   Dinner
//                 </Text>
//               </View>

//               <Text style={styles.time}>
//                 8:00 PM - 9:45 PM
//               </Text>
//             </View>

//             <View style={styles.line} />

//             <View style={styles.foodContainer}>
//               {renderFood(todayMenu.dinner)}
//             </View>
//           </View>
//         </>
//       ) : (
//         <Text style={styles.noData}>
//           No Menu Available
//         </Text>
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F8F3EB",
//   },

//   /* DAYS */
//   dayScroll: {
//     marginTop: 20,
//     marginBottom: 20,
//   },

//   dayScrollContent: {
//     paddingHorizontal: 10,
//   },

//   dayBox: {
//     width: 45,
//     height: 54,
//     borderWidth: 1,
//     borderColor: "#CBBBA2",
//     borderRadius: 10,
//     marginRight: 10,
//     backgroundColor: "#AC9478",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   dayBoxActive: {
//     backgroundColor: "#3C2A1E",
//     borderColor: "#3C2A1E",
//   },

//   dayId: {
//     fontSize: 16,
//     fontWeight: "800",
//     color: "#F7F7F7",
//   },

//   dayName: {
//     fontSize: 13,
//     color: "#F7F7F7",
//   },

//   white: {
//     color: "#FFF",
//   },

//   /* CARD */
//   card: {
//     padding: 16,
//     borderRadius: 14,
//     marginHorizontal: 15,
//     marginBottom: 18,
//   },

//   breakfastCard: {
//     backgroundColor: "#FFE8A3",
//   },

//   lunchCard: {
//     backgroundColor: "#CDECCF",
//   },

//   eveningSnackCard: {
//     backgroundColor: "#FFD6B0",
//   },

//   dinnerCard: {
//     backgroundColor: "#D9D4FF",
//   },

//   /* TITLE + TIME SAME ROW */
//   cardHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     minHeight: 32,
//   },

//   titleContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//   },

//   cardTitle: {
//     marginLeft: 10,
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#3C2A1E",
//   },

//   time: {
//     color: "#3C2A1E",
//     fontSize: 13,
//     fontWeight: "600",
//     textAlign: "right",
//     marginLeft: 10,
//   },

//   /* DIVIDER */
//   line: {
//     borderBottomWidth: 1,
//     borderColor: "#8B7355",
//     marginVertical: 10,
//   },

//   /* FOOD GRID */
//   foodContainer: {
//     paddingVertical: 8,
//   },

//   foodGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     width: "100%",
//   },

//   foodItem: {
//     width: "50%",
//     paddingHorizontal: 5,
//     paddingVertical: 5,
//   },

//   foodText: {
//     fontSize: 15,
//     color: "#3C2A1E",
//     lineHeight: 22,
//     fontFamily: "Quicksand-Bold",
//     textAlign: "left",
//   },

//   noFoodText: {
//     width: "100%",
//     textAlign: "center",
//     fontSize: 14,
//     color: "#6B5A48",
//     paddingVertical: 5,
//   },

//   noData: {
//     textAlign: "center",
//     color: "#3C2A1E",
//     marginTop: 20,
//     fontSize: 16,
//   },
// });





// // import React, { useEffect, useState } from "react";
// // import {
// //   View,
// //   Text,
// //   StyleSheet,
// //   ScrollView,
// //   Image,
// //   TouchableOpacity,
// // } from "react-native";
// // import Ionicons from "react-native-vector-icons/Ionicons";
// // import axios from "axios";
// // import { useAuth } from "../context/AuthContext";
// // import HeaderGradient from "../components/HeaderGradient";
// // import { useRoute } from "@react-navigation/native";
// // import Config from "react-native-config";

// // export const BASE_URL = Config.API_BASE_URL;


// // const days = [
// //   { id: "01", short: "Mon", full: "Monday" },
// //   { id: "02", short: "Tue", full: "Tuesday" },
// //   { id: "03", short: "Wed", full: "Wednesday" },
// //   { id: "04", short: "Thu", full: "Thursday" },
// //   { id: "05", short: "Fri", full: "Friday" },
// //   { id: "06", short: "Sat", full: "Saturday" },
// //   { id: "07", short: "Sun", full: "Sunday" },
// // ];

// // export default function FoodMenuScreen() {
// //  const { user } = useAuth();
// //   const token = user?.token;

// //   const route = useRoute(); // ✅ yahin hona chahiye

// //   const dayNames = [
// //     "Sunday",
// //     "Monday",
// //     "Tuesday",
// //     "Wednesday",
// //     "Thursday",
// //     "Friday",
// //     "Saturday",
// //   ];

// //   const todayName = dayNames[new Date().getDay()];

// //   const [menus, setMenus] = useState([]);

// //   const [activeDay, setActiveDay] = useState(
// //     route.params?.initialDay || todayName
// //   );

// //   useEffect(() => {
// //     fetchMenus();
// //   }, []);

// //   const fetchMenus = async () => {
// //     try {
// //       const res = await axios.get(`${BASE_URL}/api/food-menu/user-menus`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });

// //       setMenus(res.data.menus || []);

// //     } catch (e) {
// //       console.log("Food Menu Error: ", e?.response?.data || e);
// //     }
// //   };

// //   const getMenus = () => {
// //     return menus
// //       .map((menuObj) => {
// //         const dayData = menuObj?.weekMenu?.[activeDay];
// //         if (!dayData) return null;

// //         return {
// //           breakfast: dayData.breakfast || [],
// //           lunch: dayData.lunch || [],
// //           dinner: dayData.dinner || [],
// //           eveningSnacks: dayData.eveningSnack || [],
// //         };
// //       })
// //       .filter(Boolean)[0];
// //   };

// //   const todayMenu = getMenus();
// // console.log("Today's Menu:", todayMenu);
// //   const renderFood = (arr) => {
// //   if (!arr?.length) {
// //     return <Text style={styles.foodText}>Not Available</Text>;
// //   }

// //   return arr.map((item, index) => (
// //     <Text key={index} style={styles.foodText}>
// //       • {item}
// //     </Text>
// //   ));
// // };

// //   return (
// //     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
// //       {/* HEADER IMAGE */}
// //       <HeaderGradient
// //         image={require("../../assets/images/breakfast.jpg")}
// //         title="Food Menu"
// //       />
// // {/* 
// //       <Text style={styles.title}>Food Menu</Text> */}

// //       {/* DAY SCROLL */}
// //       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
// //         {days.map((d) => (
// //           <TouchableOpacity
// //             key={d.id}
// //             style={[
// //               styles.dayBox,
// //               activeDay === d.full && styles.dayBoxActive,
// //             ]}
// //             onPress={() => setActiveDay(d.full)}
// //           >
// //             <Text style={[styles.dayId, activeDay === d.full && styles.white]}>
// //               {d.id}
// //             </Text>
// //             <Text
// //               style={[styles.dayName, activeDay === d.full && styles.white]}
// //             >
// //               {d.short}
// //             </Text>
// //           </TouchableOpacity>
// //         ))}
// //       </ScrollView>

// //       {todayMenu ? (
// //         <>
// //           {/* BREAKFAST */}
// //           <View style={[styles.card, styles.breakfastCard]}>
// //             <View style={styles.cardTop}>
// //               <Ionicons name="sunny-outline" size={26} color="#3C2A1E" />
// //               <Text style={styles.cardTitle}>Breakfast</Text>
// //             </View>

// //             <Text style={styles.time}>08:00 - 10:00</Text>

// //             <View style={styles.line} />

// //             <View style={styles.foodContainer}>
// //               {renderFood(todayMenu.breakfast)}
// //             </View>
// //           </View>

// //           {/* LUNCH */}
// //           <View style={[styles.card, styles.lunchCard]}>
// //             <View style={styles.cardTop}>
// //               <Ionicons name="sunny" size={26} color="#3C2A1E" />
// //               <Text style={styles.cardTitle}>Lunch</Text>
// //             </View>

// //             <Text style={styles.time}>12:00 - 14:00</Text>

// //             <View style={styles.line} />

// //             <View style={styles.foodContainer}>
// //             {renderFood(todayMenu.lunch)}
// //             </View>
// //           </View>

// // {/* EVENING SNACKS */}
// // {/* EVENING SNACKS */}
// // <View style={[styles.card, styles.eveningSnackCard]}>
// //   <View style={styles.cardTop}>
// //     <Ionicons name="cafe-outline" size={26} color="#73411dff" />
// //     <Text style={styles.cardTitle}>Evening Snacks</Text>
// //   </View>

// //   <Text style={styles.time}>16:00 - 18:00</Text>

// //   <View style={styles.line} />

// //   <View style={styles.foodContainer}>
// //     {renderFood(todayMenu.eveningSnacks)}
// //   </View>
// // </View>

// //  {/* DINNER */}
// //           <View style={[styles.card, styles.dinnerCard]}>
// //             <View style={styles.cardTop}>
// //               <Ionicons name="moon" size={26} color="#3C2A1E" />
// //               <Text style={styles.cardTitle}>Dinner</Text>
// //             </View>

// //             <Text style={styles.time}>20:00 - 23:00</Text>

// //             <View style={styles.line} />

// //             <View style={styles.foodContainer}>
// //                {renderFood(todayMenu.dinner)}
// //             </View>
// //           </View>


// //         </>
// //       ) : (
// //         <Text style={styles.noData}>No Menu Available</Text>
// //       )}
// //     </ScrollView>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: { backgroundColor: "#F8F3EB" },

// //   headerImg: {
// //     width: "100%",
// //     height: 150,
// //     borderBottomLeftRadius: 15,
// //     borderBottomRightRadius: 15,
// //   },

// //   title: {
// //     textAlign: "center",
// //     fontSize: 26,
// //     fontWeight: "700",
// //     color: "#3C2A1E",
// //     marginVertical: 10,
// //   },

// //   dayScroll: {
// //     marginTop:20,
// //     flexDirection: "row",
// //     paddingHorizontal: 10,
// //     marginBottom: 20,
    
// //   },

// //   dayBox: {
// //     width: 45,
// //     height: 54,
// //     borderWidth: 1,
// //     borderColor: "#CBBBA2",
// //     borderRadius: 10,
// //     marginRight: 10,
// //     backgroundColor:'#AC9478',
// //     alignItems: "center",
// //     justifyContent: "center",
    
// //   },

// //   dayBoxActive: {
// //     backgroundColor: "#3C2A1E",
// //     borderColor: "#3C2A1E",
// //   },

// //   dayId: { fontSize: 16, fontWeight: "800", color: "#F7F7F7" },
// //   dayName: { fontSize: 13, color: "#F7F7F7" },
// //   white: { color: "#FFF" },

// //   card: {
// //     padding: 16,
// //     borderRadius: 14,
// //     marginHorizontal: 15,
// //     marginBottom: 18,
// //   },

// //   card1: {
// //     backgroundColor: "#AC9478",
// //   },

// //   card2: {
// //     backgroundColor: "#D1C1AA",
// //   },

// //  breakfastCard: {
// //     backgroundColor: "#FFE8A3", // Soft Yellow
// //   },

// //   lunchCard: {
// //     backgroundColor: "#CDECCF", // Soft Green
// //   },

// //   eveningSnackCard: {
// //     backgroundColor: "#FFD6B0", // Soft Orange/Peach
// //   },

// //   dinnerCard: {
// //     backgroundColor: "#D9D4FF", // Soft Lavender
// //   },


// //   cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 6 },

// //   cardTitle: { marginLeft: 10, fontSize: 15, fontWeight: "700", color: "#3C2A1E" },

// //   time: { color: "#3C2A1E", marginBottom: 10 ,fontSize:14, textAlign: 'center'},

// //   line: {
// //     borderBottomWidth: 1,
// //     borderColor: "#8B7355",
// //     marginVertical: 10,
// //   },

// //   foodContainer: { 
// //   alignItems: 'center',
// //   justifyContent: 'center',
// //   paddingVertical: 10,
// //   flexWrap: 'wrap',
// //   alignContent:'center'
// // },

// // foodText: {
// //   fontSize: 16,
// //   color: "#FFFFFF",
// //   textAlign: "center",
// //   lineHeight: 22,  // 🔥 18 → 22
// //   fontFamily:'Quicksand-Bold',
// //   alignItems:'center'
  
// // },

// //   noData: {
// //     textAlign: "center",
// //     color: "#3C2A1E",
// //     marginTop: 20,
// //     fontSize: 16,
// //   },
// // });