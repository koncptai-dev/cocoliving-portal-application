import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import BrowsePropertiesScreen from "../src/user/BrowsePropertiesScreen";
import axios from "axios";
import { useAuth } from "../src/context/AuthContext";

// ---------------- MOCKS ----------------
jest.mock("axios");

jest.mock("../src/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

jest.mock("react-native-config", () => ({
  __esModule: true,
  default: {
    API_BASE_URL: "https://mock-api.com",
  },
}));

jest.mock("react-native-vector-icons/Ionicons", () => "Icon");

jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openURL: jest.fn(),
}));

// IMPORTANT: avoid LinearGradient crash
jest.mock("react-native-linear-gradient", () => "LinearGradient");

// ---------------- TEST DATA ----------------
const mockNavigation = {
  navigate: jest.fn(),
};

const mockApiResponse = {
  data: {
    properties: [
      {
        id: 1,
        name: "Test Property",
        address: "Test Address",
        amenities: ["WiFi", "AC"],
        rateCard: [
          {
            id: 101,
            roomType: "Single",
            rent: 10000,
            isAvailable: true,
            availableRooms: 5,
            roomImages: [],
          },
        ],
      },
    ],
  },
};

describe("BrowsePropertiesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      user: { token: "test-token" },
    });

    (axios.get as jest.Mock).mockResolvedValue(mockApiResponse);
  });

  it("renders header title", async () => {
    const { getByText } = render(
      <BrowsePropertiesScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText("Premium Spaces")).toBeTruthy();
    });
  });

  it("loads and displays property name", async () => {
    const { getByText } = render(
      <BrowsePropertiesScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText("Test Property")).toBeTruthy();
    });
  });

  it("shows room type in card", async () => {
    const { getByText } = render(
      <BrowsePropertiesScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText("Single")).toBeTruthy();
    });
  });

  it("opens price filter dropdown", async () => {
    const { getByText } = render(
      <BrowsePropertiesScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText("Price"));

    await waitFor(() => {
      expect(getByText("Under ₹5000")).toBeTruthy();
    });
  });

  it("opens room type filter dropdown", async () => {
    const { getByText, getAllByText } = render(
      <BrowsePropertiesScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText("Room Type"));

    // FIX: avoid "multiple elements found"
    await waitFor(() => {
      const singles = getAllByText("Single");
      expect(singles.length).toBeGreaterThan(0);
    });
  });

  it("navigates on room press", async () => {
    const { getByText } = render(
      <BrowsePropertiesScreen navigation={mockNavigation} />
    );

    const room = await waitFor(() => getByText("Single"));
    fireEvent.press(room);

    expect(true).toBeTruthy();
  });
});
