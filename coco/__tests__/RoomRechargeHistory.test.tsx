import React from "react";
import {
  render,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import axios from "axios";
import { TouchableOpacity } from "react-native";

import RoomRechargeHistoryScreen from "../src/user/RoomRechargeHistory";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("react-native-config", () => ({
  API_BASE_URL: "http://localhost",
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => {
  const React = require("react");

  return {
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),

    useFocusEffect: (callback: any) => {
      React.useEffect(() => {
        callback();
      }, []);
    },
  };
});

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      token: "mock-token",
    },
  }),
}));

jest.mock("react-native-vector-icons/Ionicons", () => "Ionicons");

describe("RoomRechargeHistoryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders recharge history successfully", async () => {
  mockedAxios.get
    .mockResolvedValueOnce({
      data: {
        bookings: [
          {
            id: 1,
            roomId: 101,
            displayStatus: "active",
          },
        ],
      },
    })
    .mockResolvedValueOnce({
      data: {
        data: {
          currentBalance: 250,
          recharges: [
            {
              userName: "Alex",
              amount: 100,
              rechargeDate: "2025-05-01T10:00:00Z",
            },
          ],
        },
      },
    });

  const screen = render(
    <RoomRechargeHistoryScreen />
  );

  await waitFor(() => {
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  expect(
    screen.getByText(/Room Electricity Recharge History/i)
  ).toBeTruthy();

  expect(
    screen.getByText("Alex")
  ).toBeTruthy();

  expect(
    screen.getByText(/250\.00/)
  ).toBeTruthy();

  expect(
    screen.getByText(/100\.00/)
  ).toBeTruthy();
});

  it("shows empty state when no recharge history exists", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          bookings: [
            {
              roomId: 101,
              displayStatus: "active",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            currentBalance: 0,
            recharges: [],
          },
        },
      });

    const screen = render(
      <RoomRechargeHistoryScreen />
    );

    expect(
      await screen.findByText(
        "No Recharge History Found"
      )
    ).toBeTruthy();

    expect(
      await screen.findByText(
        "Electricity recharge history will appear here."
      )
    ).toBeTruthy();
  });

  it("navigates back when back button is pressed", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          bookings: [
            {
              roomId: 101,
              displayStatus: "active",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            currentBalance: 0,
            recharges: [],
          },
        },
      });

    const screen = render(
      <RoomRechargeHistoryScreen />
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    const buttons =
      screen.UNSAFE_getAllByType(
        TouchableOpacity
      );

    fireEvent.press(buttons[0]);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it("navigates to BookingDetails screen", async () => {
    const booking = {
      id: 1,
      roomId: 101,
      displayStatus: "active",
    };

    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          bookings: [booking],
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            currentBalance: 150,
            recharges: [],
          },
        },
      });

    const screen = render(
      <RoomRechargeHistoryScreen />
    );

    const button =
      await screen.findByText(
        "Recharge Electricity Account"
      );

    fireEvent.press(button);

    expect(mockNavigate).toHaveBeenCalledWith(
      "BookingDetails",
      {
        booking,
      }
    );
  });

  it("handles booking not found", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        bookings: [],
      },
    });

    const screen = render(
      <RoomRechargeHistoryScreen />
    );

    expect(
      await screen.findByText(
        "Room Electricity Recharge History"
      )
    ).toBeTruthy();

    expect(
      await screen.findByText(
        "No Recharge History Found"
      )
    ).toBeTruthy();
  });

  it("handles api error gracefully", async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: {
        status: 500,
        data: {
          message: "Server Error",
        },
      },
    });

    const screen = render(
      <RoomRechargeHistoryScreen />
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    expect(screen).toBeTruthy();
  });
});
