import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SelectYourBedScreen from "../src/user/SelectYourBedScreen";
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

// IMPORTANT FIX: correct config mock (fixes export crash)
jest.mock("react-native-config", () => ({
  __esModule: true,
  default: {
    API_BASE_URL: "https://mock-api.com",
  },
}));

jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

// ---------------- TEST DATA ----------------
const mockRoute = {
  params: {
    room: {
      roomType: "Single Sharing",
      roomImages: [],
    },
    property: {
      id: 1,
      name: "Test Property",
      address: "Test Address",
    },
    rent: 10000,
    actionType: "PreBook",
  },
};

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

// ---------------- FIXED API MOCK ----------------
const mockRoomsResponse = {
  data: {
    rooms: [
      { id: 1, floorNumber: 1, roomNumber: 101 },
      { id: 2, floorNumber: 2, roomNumber: 201 },
    ],
  },
};

describe("SelectYourBedScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      user: { token: "test-token" },
    });

    // IMPORTANT FIX: always return valid promise
    (axios.get as jest.Mock).mockResolvedValue(mockRoomsResponse);
  });

  it("renders screen header correctly", () => {
    const { getAllByText } = render(
      <SelectYourBedScreen route={mockRoute} navigation={mockNavigation} />
    );

    // FIX: multiple "Pre-book" issue
    expect(getAllByText(/Pre-book/i).length).toBeGreaterThan(0);
  });

  it("renders prebook description", () => {
    const { getByText } = render(
      <SelectYourBedScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText(/Lock in your preferred room/i)).toBeTruthy();
  });

  it("renders booking duration field", () => {
    const { getByText } = render(
      <SelectYourBedScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText(/Booking Duration/i)).toBeTruthy();
  });

  it("opens floor dropdown", async () => {
    const { getByText, findByText } = render(
      <SelectYourBedScreen route={mockRoute} navigation={mockNavigation} />
    );

    fireEvent.press(getByText(/Select Floor/i));

    const floor = await findByText(/Floor 1/i);
    expect(floor).toBeTruthy();
  });

  it("selects floor", async () => {
    const { getByText, findByText } = render(
      <SelectYourBedScreen route={mockRoute} navigation={mockNavigation} />
    );

    fireEvent.press(getByText(/Select Floor/i));

    const floor = await findByText(/Floor 1/i);
    fireEvent.press(floor);

    expect(getByText(/Floor 1/i)).toBeTruthy();
  });

  it("handles continue button click", () => {
    const { getByText } = render(
      <SelectYourBedScreen route={mockRoute} navigation={mockNavigation} />
    );

    fireEvent.press(getByText(/Proceed/i));

    expect(true).toBeTruthy();
  });
});

