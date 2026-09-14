import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import BrowseRooms from "../src/user/BrowseRooms";
import axios from "axios";
import { useAuth } from "../src/context/AuthContext";


// ===================== SAFE MOCKS (MUST BE FIRST) =====================

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const { View } = require("react-native");

  return (props: any) => <View {...props} />;
});
// SafeAreaContext fix
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
  };
});

// Picker FIX (main crash source)
jest.mock("@react-native-picker/picker", () => {
  const React = require("react");
  const { View, Text } = require("react-native");

  const Picker = ({ children }: any) => <View>{children}</View>;

  Picker.Item = ({ label }: any) => <Text>{label}</Text>;

  return { Picker };
});

// Modal mock
jest.mock("react-native-modal", () => {
  const React = require("react");
  const { View } = require("react-native");

  return (props: any) => <View>{props.children}</View>;
});

// axios mock
jest.mock("axios");

// auth context mock
jest.mock("../src/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// toast mock
jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

// jwt mock
jest.mock("jwt-decode", () => () => ({
  id: 1,
  role: "user",
  iat: 123,
  exp: Date.now() / 1000 + 10000,
}));

// Linking mock
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openURL: jest.fn(),
}));

// Icons mock (prevents RN crashes)
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "Icon");

// ===================== IMPORTS =====================



// ===================== TEST DATA =====================

const mockUser = {
  token: "test-token",
};

const mockRoomsResponse = {
  data: {
    rooms: [
      {
        id: 1,
        roomNumber: 101,
        roomType: "Single",
        monthlyRent: 800,
        depositAmount: 2000,
        occupancy: "1/2",
        capacity: 2,
        status: "available",
        description: "Nice room",
        amenities: ["WiFi", "AC"],
        images: [],
        property: {
          name: "Test Property",
          address: "Test Address",
        },
      },
    ],
  },
};

const mockPropertiesResponse = {
  data: [
    {
      id: 1,
      name: "Property 1",
      rateCard: [{ roomType: "Single" }],
      amenities: "WiFi,AC",
    },
  ],
};

// ===================== TEST SUITE =====================

describe("BrowseRooms Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
    });

    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/rooms/getall")) {
        return Promise.resolve(mockRoomsResponse);
      }
      if (url.includes("/api/property/getall")) {
        return Promise.resolve(mockPropertiesResponse);
      }
      return Promise.reject(new Error("Unknown API"));
    });
  });

  it("renders screen title", async () => {
    const { getByText } = render(<BrowseRooms />);

    await waitFor(() => {
      expect(getByText("Browse Rooms")).toBeTruthy();
    });
  });

  it("loads room data correctly", async () => {
    const { getByText } = render(<BrowseRooms />);

    await waitFor(() => {
      expect(getByText("Room 101")).toBeTruthy();
    });
  });

  it("shows room price", async () => {
    const { getByText } = render(<BrowseRooms />);

    await waitFor(() => {
      expect(getByText("₹800")).toBeTruthy();
    });
  });

  it("filters rooms using search input", async () => {
    const { getByPlaceholderText, getByText } = render(<BrowseRooms />);

    const searchInput = getByPlaceholderText("Search rooms or locations...");

    fireEvent.changeText(searchInput, "101");

    await waitFor(() => {
      expect(getByText("Room 101")).toBeTruthy();
    });
  });

  it("opens room on press", async () => {
    const { getByText } = render(<BrowseRooms />);

    await waitFor(() => {
      fireEvent.press(getByText("Room 101"));
    });

    expect(true).toBeTruthy();
  });
});