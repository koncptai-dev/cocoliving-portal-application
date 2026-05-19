import 'react-native-gesture-handler/jestSetup';

// Optional: remove if causing issue
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
//   default: {},
// }));

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('@react-native-firebase/app', () => () => ({}));