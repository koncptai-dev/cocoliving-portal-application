import React from 'react';
import axios from 'axios';

import {
  render,
  waitFor,
} from '@testing-library/react-native';

import NotificationListScreen from '../src/components/notificationScreen';

/* ---------------- MOCKS ---------------- */

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

// Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),

  useFocusEffect: (callback: any) => callback(),
}));

// Auth Context
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      token: 'mock-token',
    },
  }),
}));

// Axios
jest.mock('axios', () => ({
  get: jest.fn(),
}));

// Config
jest.mock('react-native-config', () => ({
  API_BASE_URL: 'https://mock-api.com',
}));

// Toast
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

// AsyncStorage
jest.mock(
  '@react-native-async-storage/async-storage',
  () => ({
    getItem: jest.fn().mockResolvedValue('[]'),

    setItem: jest
      .fn()
      .mockResolvedValue(null),

    removeItem: jest
      .fn()
      .mockResolvedValue(null),
  }),
);

// Vector Icons
jest.mock(
  'react-native-vector-icons/Ionicons',
  () => 'Icon',
);

/* ---------------- TESTS ---------------- */

describe('NotificationListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notifications correctly', async () => {
    const mockedGet = axios.get as jest.Mock;

    mockedGet.mockResolvedValue({
      status: 200,
      data: {
        success: true,
        data: [
          {
            id: 1,
            _id: '1',
            title: 'Test Notification',
            message: 'This is test message',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });

    const { getByText } = render(
      <NotificationListScreen />,
    );

    await waitFor(
      () => {
        expect(
          getByText('Test Notification'),
        ).toBeTruthy();

        expect(
          getByText('This is test message'),
        ).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });
});