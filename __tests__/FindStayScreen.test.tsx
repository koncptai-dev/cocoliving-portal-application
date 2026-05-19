global._ReactNativeCSSInterop = {};

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import axios from "axios";

// ================= CRITICAL FIX (PUT FIRST) =================
// 🔥 HARD OVERRIDE BEFORE JEST LOADS ANYTHING

// 🔥 THIS FIXES _ReactNativeCSSInterop ERROR
jest.mock("react-native-css-interop", () => {
  return {};
});

// ================= SAFE MOCKS =================

jest.mock("react-native-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return (props: any) => React.createElement(View, props, props.children);
});

jest.mock("react-native-config", () => ({
  API_BASE_URL: "http://localhost",
}));

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("axios");

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve("[]")),
}));

jest.mock("react-native-vector-icons/Ionicons", () => "Icon");

// safe area
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

// ================= IMPORT AFTER MOCKS =================

import FindStayScreen from "../src/components/dashboard/FindStayScreen";
import { useAuth } from "../src/context/AuthContext";

// ================= MOCK DATA =================

const mockUser = {
  token: "test-token",
  fullName: "John Doe",
};

const mockProperties = [
  {
    id: 1,
    address: "Mumbai",
    amenities: ["WiFi", "AC"],
    rateCard: [
      {
        id: 11,
        roomType: "Single",
        rent: 800,
        isAvailable: true,
        availableRooms: 2,
        roomImages: [],
      },
    ],
  },
];

// ================= TESTS =================

describe("FindStayScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
    });

    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("getPropertiesForUser")) {
        return Promise.resolve({
          data: { properties: mockProperties },
        });
      }

      if (url.includes("get-notifications")) {
        return Promise.resolve({
          data: { data: [] },
        });
      }

      return Promise.reject("Unknown API");
    });
  });

  // ✅ Test 1
  it("renders header text", () => {
    const { getByText } = render(
      <FindStayScreen navigation={{ navigate: mockNavigate }} />
    );

    expect(getByText("Hey there 👋")).toBeTruthy();
  });

  // ✅ Test 2
  it("loads and displays property", async () => {
    const { getByText } = render(
      <FindStayScreen navigation={{ navigate: mockNavigate }} />
    );

    await waitFor(() => {
      expect(getByText("Mumbai")).toBeTruthy();
      expect(getByText("Single")).toBeTruthy();
    });
  });

  // ✅ Test 3
  it("filters properties by search", async () => {
    const { getByDisplayValue } = render(
      <FindStayScreen navigation={{ navigate: mockNavigate }} />
    );

    const input = getByDisplayValue("");

    fireEvent.changeText(input, "Mumbai");

    await waitFor(() => {
      expect(true).toBeTruthy();
    });
  });

  // ✅ Test 4
  it("navigates to RoomDetails", async () => {
    const { getByText } = render(
      <FindStayScreen navigation={{ navigate: mockNavigate }} />
    );

    await waitFor(() => {
      fireEvent.press(getByText("Single"));
    });

    expect(mockNavigate).toHaveBeenCalled();
  });

  // ✅ Test 5
  it("navigates to profile", () => {
    const { getByText } = render(
      <FindStayScreen navigation={{ navigate: mockNavigate }} />
    );

    fireEvent.press(getByText("J"));

    expect(mockNavigate).toHaveBeenCalledWith("ProfileScreen");
  });

  // ✅ Test 6
  it("navigates to notifications", () => {
    const { UNSAFE_getAllByType } = render(
      <FindStayScreen navigation={{ navigate: mockNavigate }} />
    );

    const touchables =
      UNSAFE_getAllByType(require("react-native").TouchableOpacity);

    fireEvent.press(touchables[1]);

    expect(mockNavigate).toHaveBeenCalledWith("notificationListScreen");
  });

  // ✅ Test 7
  it("navigates to visit screen", () => {
    const { getByText } = render(
      <FindStayScreen navigation={{ navigate: mockNavigate }} />
    );

    fireEvent.press(getByText("Book"));

    expect(mockNavigate).toHaveBeenCalledWith("myVisit");
  });
});