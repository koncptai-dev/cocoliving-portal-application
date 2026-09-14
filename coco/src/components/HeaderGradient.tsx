
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ImageBackground,
  Text,
  StyleSheet,
  Dimensions,
  ImageSourcePropType,
  TouchableOpacity,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
// import { useNavigation } from '@react-navigation/native';
import {
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';

import axios from 'axios';
import Config from 'react-native-config';
const { width } = Dimensions.get('window');

// 375x263 image → ratio = 0.7013
const IMAGE_RATIO = 200 / 375;
const IMAGE_HEIGHT = width * IMAGE_RATIO;

export const baseURL = Config.API_BASE_URL;

type Props = {
  title: string;
  image?: ImageSourcePropType;
};

const HeaderGradient: React.FC<Props> = ({ title, image }) => {
  const { user } = useAuth();
  const token = user?.token;
  const navigation = useNavigation<any>();

  // const username = user?.fullName || 'User';
  // const firstName = username.split(' ')[0];
  // const firstLetter = username.charAt(0).toUpperCase();


const [parentName, setParentName] = useState('');

const isParent = user?.loginAs === 'parent';

const displayName = isParent
  ? parentName?.trim() || 'Parent'
  : user?.fullName?.trim() || 'User';

const firstName = displayName.split(/\s+/)[0] || 'User';
const firstLetter = displayName.charAt(0).toUpperCase();

  const [location, setLocation] = useState('Navrangpura');

  const fetchLocation = async () => {
    if (!token) return;

    try {
      const res = await axios.get(
        `${baseURL}/api/book-room/getUserBookings?page=1&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bookings = res.data.bookings || [];
      const active = bookings.find(
        (b: any) =>
          b.displayStatus?.toLowerCase() === 'active' ||
          b.displayStatus?.toLowerCase() === 'approved'
      );

      if (active?.room?.property?.address) {
        setLocation(active.room.property.address);
      }
    } catch (err) {
      console.log('Error fetching location:', err);
    }
  };


const loadUser = async () => {
  if (!token || !user?.id) return;

  try {
    const res = await axios.get(
      `${baseURL}/api/user/getUser/${user.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const u = res.data.user;

    console.log('Header user profile:', u);
    console.log('Header parent name:', u?.parentName);

    setParentName(u?.parentName || '');
  } catch (error: any) {
    console.log(
      'Header profile fetch failed:',
      error?.response?.data || error?.message || error
    );
  }
};


  // useEffect(() => {
  //   fetchLocation();
  // }, [token]);

// useEffect(() => {
//   fetchLocation();

//   if (user?.loginAs === 'parent') {
//     loadUser();
//   }
// }, [token, user?.id, user?.loginAs]);

useFocusEffect(
  useCallback(() => {
    fetchLocation();

    if (user?.loginAs === 'parent') {
      loadUser();
    }

    return () => {
      // cleanup if needed
    };
  }, [token, user?.id, user?.loginAs])
);

  return (
    <View style={[styles.container, { height: IMAGE_HEIGHT }]}>
      <ImageBackground
        source={image || require('../../assets/images/premium.png')}
        style={styles.image}
        resizeMode="cover"
        imageStyle={styles.imageRadius} // ✅ IMPORTANT
      >
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['#4b3426ee', '#4b3426aa', 'transparent']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientLayer}
        />

        <View style={styles.contentContainer}>
          {/* Top Row */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ padding: 5 }}
                activeOpacity={0.3}
              >
                <Ionicons name="chevron-back" size={25} color="#fff" />
              </TouchableOpacity> */}


<TouchableOpacity
  onPress={() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: "HomeTabs" }],
      });
    }
  }}
  style={{ padding: 5 }}
  activeOpacity={0.3}
>
  <Ionicons name="chevron-back" size={25} color="#fff" />
</TouchableOpacity>

              <View style={{ marginLeft: 8 }}>
                <Text style={styles.hello}>Hey {firstName}!</Text>
                <View style={styles.locationRow}>
                  {/* <Ionicons name="location-outline" size={12} color="#fff" /> */}
                  {/* <Text style={styles.location}>{location}</Text> */}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.profileCircle}
              onPress={() => navigation.navigate('ProfileScreen')}
              activeOpacity={0.8}
            >
              {user?.profileImage ? (
                <Image
                  source={{ uri: `${baseURL}${user.profileImage}` }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.profileLetter}>{firstLetter}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Title */}
          <Text style={styles.title}>{title}</Text>
        </View>
      </ImageBackground>
    </View>
  );
};

export default HeaderGradient;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden', // ✅ REQUIRED for border radius
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  image: {
    flex: 1,
  },

  imageRadius: {
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 20,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  hello: {
    fontSize: 23,
    // fontWeight: '700',
    fontFamily:'Quicksand-Bold',
    color: '#fff',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  profileCircle: {
    width: 45,
    height: 45,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    marginRight:10
  },

  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },

  profileLetter: {
    fontSize: 24,
    // fontWeight: '700',
    fontFamily:'Quicksand-Bold',
    color: '#4b3426',
  },

  title: {
    fontSize: 27,
    color: '#f7f7f7',
    textAlign: 'center',
    fontFamily: 'Quicksand-Bold',
  },
});