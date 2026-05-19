// __tests__/Login.test.tsx

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../src/pages/login";
import axios from "axios";
// ---------------- MOCKS ----------------
import { act } from "@testing-library/react-native";

jest.useFakeTimers();
// ✅ notification service (IMPORTANT)





jest.mock("../src/user/notificationservice", () => ({
  requestNotificationPermission: jest.fn(),
  getFcmToken: jest.fn(),
  syncFcmTokenToBackend: jest.fn(),
  createNotificationChannel: jest.fn(),
  listenForegroundNotifications: jest.fn(),
  listenNotificationOpen: jest.fn(),
}));

// axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// ✅ navigation
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// auth context
jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    setUser: jest.fn(),
  }),
}));

// toast
jest.mock("react-native-toast-message", () => {
  const React = require("react");
  const { View } = require("react-native");

  const Toast = () => <View testID="toast" />;

  Toast.show = jest.fn();

  return Toast;
});

// vector icons
jest.mock("react-native-vector-icons/Ionicons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return (props: any) => <Text>Icon</Text>;
});

// ✅ FIXED OTP INPUT MOCK (VERY IMPORTANT)
jest.mock("react-native-otp-textinput", () => {
  const React = require("react");
  const { TextInput } = require("react-native");

  return (props: any) => <TextInput {...props} />;
});

// config
jest.mock("react-native-config", () => ({
  API_BASE_URL: "https://mock-api.com",
}));

// Linking
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openURL: jest.fn(),
}));

// OTP verify
jest.mock("react-native-otp-verify", () => ({
  getHash: jest.fn(() => Promise.resolve(["hash"])),
  getOtp: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
}));

// ✅ MOCK IMAGE (VERY IMPORTANT)
jest.mock("../assets/images/mainImage.jpeg", () => 1);



jest.mock("react-native-otp-verify", () => ({
  getHash: jest.fn(() => Promise.resolve(["hash"])),
  getOtp: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
}));
// ---------------- TESTS ----------------

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 👉 RUN ONE TEST AT A TIME

  // it.only("renders login screen correctly", () => {
  //   const { getByPlaceholderText } = render(<LoginScreen />);

  //   expect(getByPlaceholderText("Mobile Number")).toBeTruthy();
  //   expect(getByPlaceholderText("Email ID")).toBeTruthy();
  // });

  
it("renders login screen correctly", async () => {
  const { getByPlaceholderText } = render(<LoginScreen />);

  await waitFor(() => {
    expect(getByPlaceholderText("Mobile Number")).toBeTruthy();
  });

  expect(getByPlaceholderText("Email ID")).toBeTruthy();
});

  it("shows error when no input provided", async () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByText("Enter email or mobile number")).toBeTruthy();
    });
  });



it("navigates to signup if account does not exist", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { exists: false },
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email ID"), "test@mail.com");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("Signup", {
        verifiedEmail: "test@mail.com",
      });
    });
  });

 
  it("sends OTP when account exists", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { exists: true, loginAs: "user" },
    });

    mockedAxios.post.mockResolvedValueOnce({});

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email ID"), "test@mail.com");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });
 
 it("shows error for invalid email", async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email ID"), "invalid-email");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByText("Invalid email address")).toBeTruthy();
    });
  });


 it("shows error for invalid phone", async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Mobile Number"), "123");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByText("Enter valid 10-digit mobile number")).toBeTruthy();
    });
  });

  





it("shows error when OTP is empty on verify", async () => {
  const {
    getByPlaceholderText,
    getByText,
    findByText,
    queryByTestId,
    queryByText,
  } = render(<LoginScreen />);

  mockedAxios.post.mockResolvedValueOnce({
    data: { exists: true, loginAs: "user" },
  });

  mockedAxios.post.mockResolvedValueOnce({});

  fireEvent.changeText(
    getByPlaceholderText("Email ID"),
    "test@mail.com"
  );

  fireEvent.press(getByText("Login"));

  // ⏩ FAST-FORWARD LOADER (VERY IMPORTANT)
  act(() => {
    jest.runAllTimers();
  });

  // ✅ wait until loader disappears
  await waitFor(() => {
    expect(queryByTestId("loading-indicator")).toBeNull();
  });

  // ✅ NOW button exists
  const verifyBtn = await findByText("Verify");

  fireEvent.press(verifyBtn);

  await waitFor(() => {
    expect(queryByText("OTP is required")).toBeTruthy();
  });
});

 



  

 
  
});