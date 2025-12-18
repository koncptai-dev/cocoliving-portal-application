import React, { useEffect, useState } from 'react';
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
import { useAuth } from '../context/AuthContext'; // Adjust path if needed (in most files it's ../../ or ../)
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const { width } = Dimensions.get('window');

// 375x263 image → ratio = 0.7013
const IMAGE_RATIO = 263 / 375;
const IMAGE_HEIGHT = width * IMAGE_RATIO;

const baseURL = 'https://staging.cocoliving.in';

type Props = {
  title: string;
  image?: ImageSourcePropType; // Dynamic image (fallback remains)
};

const HeaderGradient: React.FC<Props> = ({ title, image,route }) => {
  const { user } = useAuth();
  const token = user?.token;
  const navigation = useNavigation<any>();

  const username = user?.fullName || 'User';
  const firstName = username.split(' ')[0];
  const firstLetter = username.charAt(0).toUpperCase();

  const [location, setLocation] = useState('Navrangpura'); // Initial fallback like dashboard

  // Fetch active booking → only for location (same logic as dashboard)
  const fetchLocation = async () => {
    if (!token) return;

    try {
      const res = await axios.get(
        `${baseURL}/api/book-room/getUserBookings?page=1&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bookings = res.data.bookings || [];
      const active = bookings.find(
        (b) =>
          b.displayStatus?.toLowerCase() === 'active' ||
          b.displayStatus?.toLowerCase() === 'approved'
      );

      if (active && active.room?.property?.address) {
        setLocation(active.room.property.address);
      }
      // else keep initial/fallback
    } catch (err) {
      console.log('Error fetching location:', err);
      // Keep fallback
    }
  };

  useEffect(() => {
    fetchLocation();
  }, [token]);

  return (
    <View style={[styles.container, { height: IMAGE_HEIGHT }]}>
      <ImageBackground
        source={image || require('../../assets/images/browseRoomsImage.png')}
        style={styles.image}
        resizeMode="cover"
      >
        {/* Dark gradient overlay – exactly like dashboard for visibility & consistency */}
        <LinearGradient
          colors={['#4b3426ee', '#4b3426aa', 'transparent']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientLayer}
        />

        {/* Main content: top user info + bottom title */}
        <View style={styles.contentContainer}>
          {/* Top row: name + location (left) & profile (right) */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.hello}>Hey {firstName}!</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color="#fff" />
                <Text style={styles.location}>{location}</Text>
              </View>
            </View>

            {/* Profile circle – clickable + dynamic image/letter (same as dashboard) */}
            <TouchableOpacity
              style={styles.profileCircle}
              onPress={() => navigation.navigate('ProfileScreen')}
              activeOpacity={0.8}
            >
              {user?.profileImage ? (
                <Image
                  source={{ uri: `https://staging.cocoliving.in${user.profileImage}` }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.profileLetter}>{firstLetter}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Title at bottom center */}
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
  },
  image: {
    flex: 1,
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55, // Safe area like dashboard
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hello: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    fontSize: 13,
    color: '#fff',
    marginLeft: 3,
  },
  profileCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  profileLetter: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4b3426',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});