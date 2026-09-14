import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import HeaderGradient from "../components/HeaderGradient";
import { useRoute } from "@react-navigation/native";
import Config from "react-native-config";

export const BASE_URL = Config.API_BASE_URL;

const days = [
  { id: "01", short: "Mon", full: "Monday" },
  { id: "02", short: "Tue", full: "Tuesday" },
  { id: "03", short: "Wed", full: "Wednesday" },
  { id: "04", short: "Thu", full: "Thursday" },
  { id: "05", short: "Fri", full: "Friday" },
  { id: "06", short: "Sat", full: "Saturday" },
  { id: "07", short: "Sun", full: "Sunday" },
];

export default function FoodMenuScreen() {
  const { user } = useAuth();
  const token = user?.token;

  const route = useRoute();

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const todayName = dayNames[new Date().getDay()];

  const [menus, setMenus] = useState([]);

  const [activeDay, setActiveDay] = useState(
    route.params?.initialDay || todayName
  );

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/food-menu/user-menus`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMenus(res.data.menus || []);
    } catch (e) {
      console.log(
        "Food Menu Error: ",
        e?.response?.data || e
      );
    }
  };

  const getMenus = () => {
    return menus
      .map((menuObj) => {
        const dayData = menuObj?.weekMenu?.[activeDay];

        if (!dayData) return null;

        return {
          breakfast: dayData.breakfast || [],
          lunch: dayData.lunch || [],
          dinner: dayData.dinner || [],
          eveningSnacks: dayData.eveningSnack || [],
        };
      })
      .filter(Boolean)[0];
  };

  const todayMenu = getMenus();

  console.log("Today's Menu:", todayMenu);

  /**
   * Render food items in exactly 2 columns
   */
  const renderFood = (arr) => {
    if (!arr?.length) {
      return (
        <Text style={styles.noFoodText}>
          Not Available
        </Text>
      );
    }

    return (
      <View style={styles.foodGrid}>
        {arr.map((item, index) => (
          <View
            key={`${item}-${index}`}
            style={styles.foodItem}
          >
            <Text style={styles.foodText}>
              • {item}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <HeaderGradient
        image={require("../../assets/images/breakfast.jpg")}
        title="Food Menu"
      />

      {/* DAY SCROLL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayScroll}
        contentContainerStyle={styles.dayScrollContent}
      >
        {days.map((d) => (
          <TouchableOpacity
            key={d.id}
            style={[
              styles.dayBox,
              activeDay === d.full && styles.dayBoxActive,
            ]}
            onPress={() => setActiveDay(d.full)}
          >
            <Text
              style={[
                styles.dayId,
                activeDay === d.full && styles.white,
              ]}
            >
              {d.id}
            </Text>

            <Text
              style={[
                styles.dayName,
                activeDay === d.full && styles.white,
              ]}
            >
              {d.short}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {todayMenu ? (
        <>
          {/* BREAKFAST */}
          <View
            style={[
              styles.card,
              styles.breakfastCard,
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Ionicons
                  name="sunny-outline"
                  size={24}
                  color="#3C2A1E"
                />

                <Text style={styles.cardTitle}>
                  Breakfast
                </Text>
              </View>

              <Text style={styles.time}>
                08:00 - 10:00
              </Text>
            </View>

            <View style={styles.line} />

            <View style={styles.foodContainer}>
              {renderFood(todayMenu.breakfast)}
            </View>
          </View>

          {/* LUNCH */}
          <View
            style={[
              styles.card,
              styles.lunchCard,
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Ionicons
                  name="sunny"
                  size={24}
                  color="#3C2A1E"
                />

                <Text style={styles.cardTitle}>
                  Lunch
                </Text>
              </View>

              <Text style={styles.time}>
                12:00 - 14:00
              </Text>
            </View>

            <View style={styles.line} />

            <View style={styles.foodContainer}>
              {renderFood(todayMenu.lunch)}
            </View>
          </View>

          {/* EVENING SNACKS */}
          <View
            style={[
              styles.card,
              styles.eveningSnackCard,
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Ionicons
                  name="cafe-outline"
                  size={24}
                  color="#3C2A1E"
                />

                <Text style={styles.cardTitle}>
                  Evening Snacks
                </Text>
              </View>

              <Text style={styles.time}>
                16:00 - 18:00
              </Text>
            </View>

            <View style={styles.line} />

            <View style={styles.foodContainer}>
              {renderFood(todayMenu.eveningSnacks)}
            </View>
          </View>

          {/* DINNER */}
          <View
            style={[
              styles.card,
              styles.dinnerCard,
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Ionicons
                  name="moon-outline"
                  size={24}
                  color="#3C2A1E"
                />

                <Text style={styles.cardTitle}>
                  Dinner
                </Text>
              </View>

              <Text style={styles.time}>
                20:00 - 23:00
              </Text>
            </View>

            <View style={styles.line} />

            <View style={styles.foodContainer}>
              {renderFood(todayMenu.dinner)}
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.noData}>
          No Menu Available
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F3EB",
  },

  /* DAYS */
  dayScroll: {
    marginTop: 20,
    marginBottom: 20,
  },

  dayScrollContent: {
    paddingHorizontal: 10,
  },

  dayBox: {
    width: 45,
    height: 54,
    borderWidth: 1,
    borderColor: "#CBBBA2",
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: "#AC9478",
    alignItems: "center",
    justifyContent: "center",
  },

  dayBoxActive: {
    backgroundColor: "#3C2A1E",
    borderColor: "#3C2A1E",
  },

  dayId: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F7F7F7",
  },

  dayName: {
    fontSize: 13,
    color: "#F7F7F7",
  },

  white: {
    color: "#FFF",
  },

  /* CARD */
  card: {
    padding: 16,
    borderRadius: 14,
    marginHorizontal: 15,
    marginBottom: 18,
  },

  breakfastCard: {
    backgroundColor: "#FFE8A3",
  },

  lunchCard: {
    backgroundColor: "#CDECCF",
  },

  eveningSnackCard: {
    backgroundColor: "#FFD6B0",
  },

  dinnerCard: {
    backgroundColor: "#D9D4FF",
  },

  /* TITLE + TIME SAME ROW */
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
  },

  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  cardTitle: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#3C2A1E",
  },

  time: {
    color: "#3C2A1E",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    marginLeft: 10,
  },

  /* DIVIDER */
  line: {
    borderBottomWidth: 1,
    borderColor: "#8B7355",
    marginVertical: 10,
  },

  /* FOOD GRID */
  foodContainer: {
    paddingVertical: 8,
  },

  foodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },

  foodItem: {
    width: "50%",
    paddingHorizontal: 5,
    paddingVertical: 5,
  },

  foodText: {
    fontSize: 15,
    color: "#3C2A1E",
    lineHeight: 22,
    fontFamily: "Quicksand-Bold",
    textAlign: "left",
  },

  noFoodText: {
    width: "100%",
    textAlign: "center",
    fontSize: 14,
    color: "#6B5A48",
    paddingVertical: 5,
  },

  noData: {
    textAlign: "center",
    color: "#3C2A1E",
    marginTop: 20,
    fontSize: 16,
  },
});





// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Image,
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
//  const { user } = useAuth();
//   const token = user?.token;

//   const route = useRoute(); // ✅ yahin hona chahiye

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
//       const res = await axios.get(`${BASE_URL}/api/food-menu/user-menus`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setMenus(res.data.menus || []);

//     } catch (e) {
//       console.log("Food Menu Error: ", e?.response?.data || e);
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
// console.log("Today's Menu:", todayMenu);
//   const renderFood = (arr) => {
//   if (!arr?.length) {
//     return <Text style={styles.foodText}>Not Available</Text>;
//   }

//   return arr.map((item, index) => (
//     <Text key={index} style={styles.foodText}>
//       • {item}
//     </Text>
//   ));
// };

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       {/* HEADER IMAGE */}
//       <HeaderGradient
//         image={require("../../assets/images/breakfast.jpg")}
//         title="Food Menu"
//       />
// {/* 
//       <Text style={styles.title}>Food Menu</Text> */}

//       {/* DAY SCROLL */}
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
//         {days.map((d) => (
//           <TouchableOpacity
//             key={d.id}
//             style={[
//               styles.dayBox,
//               activeDay === d.full && styles.dayBoxActive,
//             ]}
//             onPress={() => setActiveDay(d.full)}
//           >
//             <Text style={[styles.dayId, activeDay === d.full && styles.white]}>
//               {d.id}
//             </Text>
//             <Text
//               style={[styles.dayName, activeDay === d.full && styles.white]}
//             >
//               {d.short}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>

//       {todayMenu ? (
//         <>
//           {/* BREAKFAST */}
//           <View style={[styles.card, styles.breakfastCard]}>
//             <View style={styles.cardTop}>
//               <Ionicons name="sunny-outline" size={26} color="#3C2A1E" />
//               <Text style={styles.cardTitle}>Breakfast</Text>
//             </View>

//             <Text style={styles.time}>08:00 - 10:00</Text>

//             <View style={styles.line} />

//             <View style={styles.foodContainer}>
//               {renderFood(todayMenu.breakfast)}
//             </View>
//           </View>

//           {/* LUNCH */}
//           <View style={[styles.card, styles.lunchCard]}>
//             <View style={styles.cardTop}>
//               <Ionicons name="sunny" size={26} color="#3C2A1E" />
//               <Text style={styles.cardTitle}>Lunch</Text>
//             </View>

//             <Text style={styles.time}>12:00 - 14:00</Text>

//             <View style={styles.line} />

//             <View style={styles.foodContainer}>
//             {renderFood(todayMenu.lunch)}
//             </View>
//           </View>

// {/* EVENING SNACKS */}
// {/* EVENING SNACKS */}
// <View style={[styles.card, styles.eveningSnackCard]}>
//   <View style={styles.cardTop}>
//     <Ionicons name="cafe-outline" size={26} color="#73411dff" />
//     <Text style={styles.cardTitle}>Evening Snacks</Text>
//   </View>

//   <Text style={styles.time}>16:00 - 18:00</Text>

//   <View style={styles.line} />

//   <View style={styles.foodContainer}>
//     {renderFood(todayMenu.eveningSnacks)}
//   </View>
// </View>

//  {/* DINNER */}
//           <View style={[styles.card, styles.dinnerCard]}>
//             <View style={styles.cardTop}>
//               <Ionicons name="moon" size={26} color="#3C2A1E" />
//               <Text style={styles.cardTitle}>Dinner</Text>
//             </View>

//             <Text style={styles.time}>20:00 - 23:00</Text>

//             <View style={styles.line} />

//             <View style={styles.foodContainer}>
//                {renderFood(todayMenu.dinner)}
//             </View>
//           </View>


//         </>
//       ) : (
//         <Text style={styles.noData}>No Menu Available</Text>
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { backgroundColor: "#F8F3EB" },

//   headerImg: {
//     width: "100%",
//     height: 150,
//     borderBottomLeftRadius: 15,
//     borderBottomRightRadius: 15,
//   },

//   title: {
//     textAlign: "center",
//     fontSize: 26,
//     fontWeight: "700",
//     color: "#3C2A1E",
//     marginVertical: 10,
//   },

//   dayScroll: {
//     marginTop:20,
//     flexDirection: "row",
//     paddingHorizontal: 10,
//     marginBottom: 20,
    
//   },

//   dayBox: {
//     width: 45,
//     height: 54,
//     borderWidth: 1,
//     borderColor: "#CBBBA2",
//     borderRadius: 10,
//     marginRight: 10,
//     backgroundColor:'#AC9478',
//     alignItems: "center",
//     justifyContent: "center",
    
//   },

//   dayBoxActive: {
//     backgroundColor: "#3C2A1E",
//     borderColor: "#3C2A1E",
//   },

//   dayId: { fontSize: 16, fontWeight: "800", color: "#F7F7F7" },
//   dayName: { fontSize: 13, color: "#F7F7F7" },
//   white: { color: "#FFF" },

//   card: {
//     padding: 16,
//     borderRadius: 14,
//     marginHorizontal: 15,
//     marginBottom: 18,
//   },

//   card1: {
//     backgroundColor: "#AC9478",
//   },

//   card2: {
//     backgroundColor: "#D1C1AA",
//   },

//  breakfastCard: {
//     backgroundColor: "#FFE8A3", // Soft Yellow
//   },

//   lunchCard: {
//     backgroundColor: "#CDECCF", // Soft Green
//   },

//   eveningSnackCard: {
//     backgroundColor: "#FFD6B0", // Soft Orange/Peach
//   },

//   dinnerCard: {
//     backgroundColor: "#D9D4FF", // Soft Lavender
//   },


//   cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 6 },

//   cardTitle: { marginLeft: 10, fontSize: 15, fontWeight: "700", color: "#3C2A1E" },

//   time: { color: "#3C2A1E", marginBottom: 10 ,fontSize:14, textAlign: 'center'},

//   line: {
//     borderBottomWidth: 1,
//     borderColor: "#8B7355",
//     marginVertical: 10,
//   },

//   foodContainer: { 
//   alignItems: 'center',
//   justifyContent: 'center',
//   paddingVertical: 10,
//   flexWrap: 'wrap',
//   alignContent:'center'
// },

// foodText: {
//   fontSize: 16,
//   color: "#FFFFFF",
//   textAlign: "center",
//   lineHeight: 22,  // 🔥 18 → 22
//   fontFamily:'Quicksand-Bold',
//   alignItems:'center'
  
// },

//   noData: {
//     textAlign: "center",
//     color: "#3C2A1E",
//     marginTop: 20,
//     fontSize: 16,
//   },
// });