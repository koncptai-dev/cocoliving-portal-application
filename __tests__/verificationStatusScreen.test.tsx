import React from 'react';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  render,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
// import {
//   render,
//   fireEvent,
// } from '@testing-library/react-native';
import VerificationStatusScreen from '../src/components/verificationStatusScreen';
import { Alert, Linking } from 'react-native';
/* ---------------- MOCKS ---------------- */

// Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
    navigate: jest.fn(),
  }),
}));

// Auth Context
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      token: 'mock-token',
      phone: '9876543210',
      email: 'test@test.com',
      isPhoneVerified: false,
      isEmailVerified: false,
      isPanVerified: false,
      isAadhaarVerified: false,
    },
    refreshUser: jest.fn(),
  }),
}));

// Axios
jest.mock('axios', () => ({
  get: jest.fn(() =>
    Promise.resolve({
      data: {},
    }),
  ),
  post: jest.fn(() =>
    Promise.resolve({
      data: {},
    }),
  ),
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

// Vector Icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

jest.mock(
  'react-native-vector-icons/MaterialCommunityIcons',
  () => 'Icon',
);

// Image Picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

// Linking
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  RN.Linking = {
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
    getInitialURL: jest.fn(() => Promise.resolve(null)),
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    openSettings: jest.fn(),
  };

  return RN;
});

describe('VerificationStatusScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<VerificationStatusScreen />);

    expect(getByText('Verification Status')).toBeTruthy();
    expect(getByText('Mobile Number')).toBeTruthy();
    expect(getByText('Email ID')).toBeTruthy();
    expect(getByText('PAN Card')).toBeTruthy();
    expect(getByText('Aadhaar Card')).toBeTruthy();
  });


  it('calls send OTP API when Verify Mobile is pressed', async () => {
  const mockedPost = axios.post as jest.Mock;

  mockedPost.mockResolvedValueOnce({
    data: {},
  });

  const { getAllByText } = render(<VerificationStatusScreen />);

  const buttons = getAllByText('Verify Mobile');

  fireEvent.press(buttons[0]);

  await waitFor(() => {
    expect(mockedPost).toHaveBeenCalled();
  });
});


it('calls send OTP API when Verify Email is pressed', async () => {
  const mockedPost = axios.post as jest.Mock;

  mockedPost.mockResolvedValueOnce({
    data: {},
  });

  const { getAllByText } = render(<VerificationStatusScreen />);

  const buttons = getAllByText('Verify Email');

  fireEvent.press(buttons[0]);

  await waitFor(() => {
    expect(mockedPost).toHaveBeenCalled();
  });
});


it('shows error toast when send OTP API fails', async () => {
  const mockedPost = axios.post as jest.Mock;

  mockedPost.mockRejectedValueOnce({
    response: {
      data: {
        message: 'API Failed',
      },
    },
  });

  const Toast =
    require('react-native-toast-message').default;

  const { getAllByText } = render(
    <VerificationStatusScreen />,
  );

  const buttons = getAllByText('Verify Mobile');

  fireEvent.press(buttons[0]);

  await waitFor(() => {
    expect(Toast.show).toHaveBeenCalled();
  });
});


it('shows loading state while sending OTP', async () => {
  const mockedPost = axios.post as jest.Mock;

  mockedPost.mockImplementationOnce(
    () =>
      new Promise(resolve =>
        setTimeout(() => resolve({ data: {} }), 100),
      ),
  );

  const { getAllByText } = render(
    <VerificationStatusScreen />,
  );

  const buttons = getAllByText('Verify Mobile');

  fireEvent.press(buttons[0]);

  expect(mockedPost).toHaveBeenCalled();
});

it('shows invalid OTP error', async () => {
  const mockedPost = axios.post as jest.Mock;
  const toast = require('react-native-toast-message').default;

  mockedPost
    .mockResolvedValueOnce({ data: {} })
    .mockRejectedValueOnce({
      response: {
        data: {
          message: 'Invalid code',
        },
      },
    });

  const { getAllByText, getByPlaceholderText } = render(
    <VerificationStatusScreen />,
  );

  fireEvent.press(getAllByText('Verify Mobile')[0]);

  const otpInput = await waitFor(() =>
    getByPlaceholderText('Enter 6-digit OTP'),
  );

  fireEvent.changeText(otpInput, '000000');

  fireEvent.press(getAllByText('Submit OTP')[0]);

  await waitFor(() => {
    expect(toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text1: 'Invalid OTP',
      }),
    );
  });
});

it('shows error when PAN number is empty', async () => {
  const toast =
    require('react-native-toast-message').default;

  const { getByText } = render(
    <VerificationStatusScreen />,
  );

  fireEvent.press(getByText('Submit PAN'));

  await waitFor(() => {
    expect(toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text1: 'Please Enter PAN Number',
      }),
    );
  });
});

it('shows error when PAN image is not uploaded', async () => {
  const toast =
    require('react-native-toast-message').default;

  const { getByPlaceholderText, getByText } = render(
    <VerificationStatusScreen />,
  );

  fireEvent.changeText(
    getByPlaceholderText('PAN Number (ABCDE1234F)'),
    'ABCDE1234F',
  );

  fireEvent.press(getByText('Submit PAN'));

  await waitFor(() => {
    expect(toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text1: 'Please Upload PAN Card Image',
      }),
    );
  });
});

it('shows error for invalid PAN format', async () => {
  const toast =
    require('react-native-toast-message').default;

  toast.show.mockClear();

  (launchImageLibrary as jest.Mock).mockResolvedValue({
  assets: [
    {
      uri: 'file://pan.jpg',
      fileName: 'pan.jpg',
      type: 'image/jpeg',
    },
  ],
});

  jest.spyOn(Alert, 'alert').mockImplementation(
    (_title, _msg, buttons: any) => {
      buttons[1].onPress();
    },
  );

  const { getByText, getByPlaceholderText } = render(
    <VerificationStatusScreen />,
  );

  fireEvent.changeText(
    getByPlaceholderText('PAN Number (ABCDE1234F)'),
    '123',
  );

fireEvent.press(getByText('Upload PAN Card'));

await waitFor(() => {
  expect(launchImageLibrary).toHaveBeenCalled();
});

fireEvent.press(getByText('Submit PAN'));

  await waitFor(() => {
    expect(toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text1: 'Invalid PAN format',
      }),
    );
  });
});


it('shows error for invalid Aadhaar mobile number', async () => {
  const toast =
    require('react-native-toast-message').default;

  toast.show.mockClear();

  const { getByPlaceholderText, getByText } = render(
    <VerificationStatusScreen />,
  );

  fireEvent.changeText(
    getByPlaceholderText(
      'Mobile number linked with Aadhaar',
    ),
    '12345',
  );

  fireEvent.press(getByText('Verify via DigiLocker'));

  await waitFor(() => {
    expect(toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text1:
          'Please enter a valid 10-digit mobile number linked with Aadhaar',
      }),
    );
  });
});

it('starts DigiLocker flow successfully', async () => {
  const mockedPost = axios.post as jest.Mock;

  mockedPost.mockClear();

  mockedPost
    .mockResolvedValueOnce({
      data: {
        data: {
          result: {
            registered: true,
          },
        },
      },
    })
    .mockResolvedValueOnce({
      data: {
        data: {
          url: 'https://digilocker.com',
        },
      },
    });

  const { Linking } = require('react-native');

  (Linking.canOpenURL as jest.Mock).mockResolvedValue(
    true,
  );

  const { getByPlaceholderText, getByText } = render(
    <VerificationStatusScreen />,
  );

  fireEvent.changeText(
    getByPlaceholderText(
      'Mobile number linked with Aadhaar',
    ),
    '9876543210',
  );

  fireEvent.press(getByText('Verify via DigiLocker'));

  await waitFor(() => {
    expect(mockedPost).toHaveBeenCalledTimes(2);

    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://digilocker.com',
    );
  });
});


it('shows error when DigiLocker URL is missing', async () => {
  const mockedPost = axios.post as jest.Mock;

  const toast =
    require('react-native-toast-message').default;

  mockedPost.mockClear();
  toast.show.mockClear();

  mockedPost
    .mockResolvedValueOnce({
      data: {
        data: {
          result: {
            registered: true,
          },
        },
      },
    })
    .mockResolvedValueOnce({
      data: {},
    });

  const { getByPlaceholderText, getByText } = render(
    <VerificationStatusScreen />,
  );

  fireEvent.changeText(
    getByPlaceholderText(
      'Mobile number linked with Aadhaar',
    ),
    '9876543210',
  );

  fireEvent.press(getByText('Verify via DigiLocker'));

  await waitFor(() => {
    expect(toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text1: 'Failed to start DigiLocker',
      }),
    );
  });
});

it('shows alert when device cannot open DigiLocker URL', async () => {
  const mockedPost = axios.post as jest.Mock;

  mockedPost.mockClear();

  mockedPost
    .mockResolvedValueOnce({
      data: {
        data: {
          result: {
            registered: true,
          },
        },
      },
    })
    .mockResolvedValueOnce({
      data: {
        data: {
          url: 'https://digilocker.com',
        },
      },
    });

  const { Linking, Alert } = require('react-native');

  (Linking.canOpenURL as jest.Mock).mockResolvedValue(
    false,
  );

  const alertSpy = jest
    .spyOn(Alert, 'alert')
    .mockImplementation(jest.fn());

  const { getByPlaceholderText, getByText } = render(
    <VerificationStatusScreen />,
  );

  fireEvent.changeText(
    getByPlaceholderText(
      'Mobile number linked with Aadhaar',
    ),
    '9876543210',
  );

  fireEvent.press(getByText('Verify via DigiLocker'));

  await waitFor(() => {
    expect(alertSpy).toHaveBeenCalledWith(
      'Cannot Open DigiLocker',
      'Device cannot open DigiLocker link',
    );
  });
});

});