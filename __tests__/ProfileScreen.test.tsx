import React from 'react';
import axios from 'axios';

import {
  render,
  waitFor,
  fireEvent,
} from '@testing-library/react-native';

import ProfileScreen from '../src/components/ProfileScreen';

/* ---------------- MOCKS ---------------- */

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockLogout = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),

  useFocusEffect: (callback: any) => callback(),
}));

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      token: 'mock-token',
      fullName: 'Mustafa',
      userType: 'professional',
      profileImage: null,
    },

    logout: mockLogout,
  }),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
}));

jest.mock('react-native-config', () => ({
  API_BASE_URL: 'https://mock-api.com',
}));

jest.mock('react-native-toast-message', () => {
  const React = require('react');

  const toast = {
    show: jest.fn(),
  };

  return {
    __esModule: true,
    default: Object.assign(() => null, toast),
  };
});

jest.mock(
  'react-native-vector-icons/Ionicons',
  () => 'Icon',
);

jest.mock(
  'react-native-linear-gradient',
  () => 'LinearGradient',
);

jest.mock('../src/constants/color', () => ({
  nOrange: '#FFA500',
}));

/* ---------------- TESTS ---------------- */

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user information correctly', async () => {
    const mockedGet = axios.get as jest.Mock;

    mockedGet.mockResolvedValue({
      data: {
        bookings: [],
      },
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Profile')).toBeTruthy();

      expect(getByText('Mustafa')).toBeTruthy();

      expect(getByText('Professional')).toBeTruthy();
    });
  });

  it('shows non-booked menu items', async () => {
    const mockedGet = axios.get as jest.Mock;

    mockedGet.mockResolvedValue({
      data: {
        bookings: [],
      },
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(
        getByText('Personal Information'),
      ).toBeTruthy();

      expect(
        getByText('Visit'),
      ).toBeTruthy();

      expect(
        getByText('About Us'),
      ).toBeTruthy();
    });
  });

  it('shows booked menu items when active booking exists', async () => {
    const mockedGet = axios.get as jest.Mock;

    mockedGet.mockResolvedValue({
      data: {
        bookings: [
          {
            displayStatus: 'active',
          },
        ],
      },
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(
        getByText('Payment history'),
      ).toBeTruthy();

      expect(
        getByText('My Bookings'),
      ).toBeTruthy();

      expect(
        getByText('Guest Pass'),
      ).toBeTruthy();
    });
  });

  it('opens logout modal', async () => {
    const mockedGet = axios.get as jest.Mock;

    mockedGet.mockResolvedValue({
      data: {
        bookings: [],
      },
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Logout')).toBeTruthy();
    });

    fireEvent.press(getByText('Logout'));

    expect(
      getByText('Confirm Logout'),
    ).toBeTruthy();

    expect(
      getByText(
        'Are you sure you want to logout?',
      ),
    ).toBeTruthy();
  });

  it('logs out successfully', async () => {
    const mockedGet = axios.get as jest.Mock;

    mockedGet.mockResolvedValue({
      data: {
        bookings: [],
      },
    });

    const toast =
      require('react-native-toast-message').default;

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Logout')).toBeTruthy();
    });

    fireEvent.press(getByText('Logout'));

    fireEvent.press(getByText('Logout'));

    expect(mockLogout).toHaveBeenCalled();

    expect(toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text1: 'Logged out successfully',
      }),
    );
  });
});