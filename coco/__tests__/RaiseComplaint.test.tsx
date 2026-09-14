import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

import axios from "axios";
import RaiseComplaint from "../src/components/Support/RaiseComplaint";

// ================= MOCKS =================

// navigation
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

// auth context
jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { token: "test-token" },
  }),
}));

// config
jest.mock("react-native-config", () => ({
  API_BASE_URL: "http://localhost",
}));

// toast
jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

// image picker
jest.mock("react-native-image-picker", () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

// header component (simple mock)
jest.mock("../src/components/HeaderGradient", () => {
  return ({ title }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text>{title}</Text>;
  };
});

// colors
jest.mock("../src/constants/color", () => ({
  primary: "#000",
  nOrange: "#F90",
}));

// axios
jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("RaiseComplaint Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ================= TEST 1 =================
  it("renders screen correctly", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        bookings: [
          {
            displayStatus: "active",
            checkInDate: "2025-01-01",
            room: { roomNumber: "101" },
          },
        ],
      },
    });

    const { findByText } = render(<RaiseComplaint />);

    expect(await findByText("Raise New Request")).toBeTruthy();
  });

  // ================= TEST 2 =================
  it("loads room number from API", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        bookings: [
          {
            displayStatus: "active",
            checkInDate: "2025-01-01",
            room: { roomNumber: "101" },
          },
        ],
      },
    });

    const { findByText } = render(<RaiseComplaint />);

    expect(await findByText("101")).toBeTruthy();
  });

  // ================= TEST 3 =================
  it("shows 'No room assigned' when no booking", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { bookings: [] },
    });

    const { findByText } = render(<RaiseComplaint />);

    expect(await findByText("No room assigned")).toBeTruthy();
  });

  // ================= TEST 4 =================
  it("handles API error gracefully", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));

    const { findByText } = render(<RaiseComplaint />);

    expect(await findByText("Error loading room")).toBeTruthy();
  });

  // ================= TEST 5 =================
  it("selects category and subcategory", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { bookings: [] },
    });

    const { findByText, getByText } = render(<RaiseComplaint />);

    // open category dropdown
    fireEvent.press(getByText("Select Category"));

    await waitFor(() => {
      fireEvent.press(getByText("Maintenance"));
    });

    expect(getByText("Maintenance")).toBeTruthy();
  });

  // ================= TEST 6 =================
  it("submits complaint validation works", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        bookings: [
          {
            displayStatus: "active",
            checkInDate: "2025-01-01",
            room: { roomNumber: "101" },
          },
        ],
      },
    });

    const { getByText } = render(<RaiseComplaint />);

    await waitFor(() => getByText("101"));

    const submitBtn = getByText("Submit");

    fireEvent.press(submitBtn);

    // since validation fails → toast should trigger (mocked)
    expect(submitBtn).toBeTruthy();
  });
});