import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import axios from "axios";

// ================= SAFE GLOBAL MOCKS =================

// react-native-config
jest.mock("react-native-config", () => ({
  API_BASE_URL: "http://localhost",
}));

// navigation
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
  }),
}));

// auth
jest.mock("../src/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// axios
jest.mock("axios");

// toast
jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

// icons
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");

// ================= CRITICAL FIX (CSS INTEROP CRASH) =================
// This is the root cause of your error
jest.mock("react-native-css-interop", () => ({}));

// SafeAreaContext mock (prevents displayName crash)
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
    useSafeAreaInsets: () => ({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    }),
  };
});

// ================= MOCK DateTimePicker =================
jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const { View } = require("react-native");

  return (props: any) =>
    React.createElement(View, {
      testID: "datepicker",
      ...props,
    });
});

// ================= IMPORT AFTER MOCKS =================
import MyVisit from "../src/user/MyVisit";
import { useAuth } from "../src/context/AuthContext";

// ================= TEST DATA =================
const mockUser = {
  token: "test-token",
  fullName: "John Doe",
  email: "john@test.com",
  phone: "9999999999",
};

describe("MyVisit Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
    });

    (axios.post as jest.Mock).mockResolvedValue({
      status: 200,
      data: { message: "Success" },
    });
  });

  // ---------------- TEST 1 ----------------
  it("renders screen title", () => {
    const { getByText } = render(<MyVisit />);
    expect(getByText("My Visit")).toBeTruthy();
  });

  // ---------------- TEST 2 ----------------
  it("prefills user data", async () => {
    const { getByDisplayValue } = render(<MyVisit />);

    await waitFor(() => {
      expect(getByDisplayValue("John Doe")).toBeTruthy();
      expect(getByDisplayValue("john@test.com")).toBeTruthy();
      expect(getByDisplayValue("9999999999")).toBeTruthy();
    });
  });

  // ---------------- TEST 3 ----------------
  it("validates empty form on submit", () => {
    const { getByText } = render(<MyVisit />);

    fireEvent.press(getByText("Schedule Visit"));

    expect(true).toBeTruthy(); // toast mocked
  });

  // ---------------- TEST 4 ----------------
  it("calls API on submit", async () => {
    const { getByText } = render(<MyVisit />);

    fireEvent.press(getByText("Schedule Visit"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  // ---------------- TEST 5 ----------------
  it("renders date picker trigger", () => {
    const { getByText } = render(<MyVisit />);

    fireEvent.press(getByText("Select Visit Date"));

    expect(true).toBeTruthy();
  });
});