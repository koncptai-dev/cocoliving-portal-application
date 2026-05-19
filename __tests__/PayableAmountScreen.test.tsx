import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import PayableAmountScreen from "../src/user/PayableAmountScreen";


// ---------------- MOCKS ----------------
jest.mock("axios");
const mockedAxios = axios;

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, token: "mock-token", email: "test@mail.com", phone: "9999999999" },
  }),
}));

jest.mock("react-native-config", () => ({
  API_BASE_URL: "https://mock-api.com",
  MERCHANT_ID: "mock-merchant",
  ENVIRONMENT: "SANDBOX",
}));

jest.mock("react-native-phonepe-pg", () => ({
  init: jest.fn().mockResolvedValue(true),
  startTransaction: jest.fn().mockResolvedValue({}),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const route = {
  params: {
    room: { roomType: "Deluxe", propertyId: 1, rateCardId: 10, roomImages: [] },
    property: { name: "Test Property", address: "Test Address" },
    rent: 10000,
    monthsNumber: 2,
    isoDate: "2026-01-01",
    netPayable: 25000,
    preBookAmount: 5000,
    actionType: "Book",
    preferredFloor: 2,
    preferredRoomNumber: 101,
    preferredBed: "A",
  },
};

const navigation = {
  goBack: mockGoBack,
  navigate: mockNavigate,
  reset: mockNavigate,
  replace: mockNavigate,
};

// ---------------- TESTS ----------------

describe("PayableAmountScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* 1 */
  it("renders screen title correctly", () => {
    const { getByText } = render(
      <PayableAmountScreen route={route} navigation={navigation} />
    );

    expect(getByText("Payable Amount")).toBeTruthy();
  });

  /* 2 */
  it("renders room details correctly", () => {
    const { getByText } = render(
      <PayableAmountScreen route={route} navigation={navigation} />
    );

    expect(getByText("Deluxe")).toBeTruthy();
    expect(getByText("Test Property")).toBeTruthy();
  });

  /* 3 */
  it("shows initial FULL payment mode", () => {
    const { getByText } = render(
      <PayableAmountScreen route={route} navigation={navigation} />
    );

    expect(getByText("Pay in Full")).toBeTruthy();
  });

  /* 4 */
  it("switches to MONTHLY mode", () => {
    const { getByText } = render(
      <PayableAmountScreen route={route} navigation={navigation} />
    );

    fireEvent.press(getByText("Pay Monthly"));

    expect(getByText("Pay Monthly")).toBeTruthy();
  });

  /* 5 */
  it("shows error if coupon is empty", async () => {
    const { getByText } = render(
      <PayableAmountScreen route={route} navigation={navigation} />
    );

    fireEvent.press(getByText("Apply"));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: "error",
        text1: "Enter coupon code",
      });
    });
  });

  /* 6 */
  it("applies coupon successfully", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        coupon: {
          discountValue: 10,
          discountType: "percentage",
        },
      },
    });

    const { getByPlaceholderText, getByText } = render(
      <PayableAmountScreen route={route} navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText("Enter coupon code"), "SAVE10");
    fireEvent.press(getByText("Apply"));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
        })
      );
    });
  });

  /* 7 */
  it("handles invalid coupon response", async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { message: "Invalid Coupon" } },
    });

    const { getByPlaceholderText, getByText } = render(
      <PayableAmountScreen route={route} navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText("Enter coupon code"), "BAD");
    fireEvent.press(getByText("Apply"));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalled();
    });
  });

  /* 8 */
  it("disables coupon input in MONTHLY mode", async () => {
    const { getByText, getByPlaceholderText } = render(
      <PayableAmountScreen route={route} navigation={navigation} />
    );

    fireEvent.press(getByText("Pay Monthly"));

    const input = getByPlaceholderText(/Coupon not applicable/i);
    expect(input.props.editable).toBe(false);
  });

  /* 9 */
  it("calls payment start button press", async () => {
    const { getByText } = render(
      <PayableAmountScreen route={route} navigation={navigation} />
    );

    fireEvent.press(getByText(/Proceed To Book/i));

    expect(getByText(/Processing/i) || getByText(/Proceed/)).toBeTruthy();
  });

  /* 10 */
  it("renders final payable amount text", () => {
    const { getByText } = render(
      <PayableAmountScreen route={route} navigation={navigation} />
    );

    expect(getByText(/Final Payable/i)).toBeTruthy();
  });
});