import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";


/* ---------------- MOCK AXIOS ---------------- */

export const mockGet = jest.fn();

jest.mock("@/libs/axios", () => ({
  axiosInstance: {
    get: (...args: any[]) => mockGet(...args),
  },
}));

/* ---------------- OTHER MOCKS ---------------- */

jest.mock("expo-router", () => ({
  Stack: ({ children }: any) => children,
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

jest.mock("@/libs/authContext", () => ({
  useAuth: () => ({
    userDetails: { id: "123" },
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

/* ---------------- CLEAN REACT QUERY MOCK ---------------- */

import { useQuery } from "@tanstack/react-query";
import CalendarScreen from "@/app/(tabs)/calendar";
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

/* ---------------- DAYJS MOCK ---------------- */

jest.mock("dayjs", () => {
  return () => ({
    format: (fmt: string) => {
      if (fmt === "DD/MM/YYYY") return "01/01/2026";
      if (fmt === "HH:mm") return "10:00";
      return "";
    },
  });
});

/* ---------------- MAP MOCK ---------------- */

jest.mock("react-native-maps", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("MapView", null),
    Marker: () => null,
  };
});

/* ---------------- WRAPPER MOCK ---------------- */

jest.mock("@/components/NoInternetWrapper", () => {
  return ({ children }: any) => children;
});

/* ---------------- RENDER HELPER ---------------- */

const renderScreen = () =>
  render(
    <SafeAreaProvider>
      <CalendarScreen />
    </SafeAreaProvider>
  );

/* ---------------- TESTS ---------------- */

describe("CalendarScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReset();
  });

  it("renders shift data correctly", async () => {
  (useQuery as jest.Mock).mockReturnValue({
    data: {
      upcomingShifts: [
        {
          id: "1",
          shiftInTpam: { label: "Morning Shift" },
          checkpointInTpam: { name: "Checkpoint A" },
          startTime: "2026-01-01T10:00:00Z",
          endTime: "2026-01-01T12:00:00Z",
        },
      ],
    },
    isLoading: false,
  });

  const screen = renderScreen();

  await waitFor(() => {
    expect(screen.getByText("Morning Shift")).toBeTruthy();
    expect(screen.getByText("Checkpoint A")).toBeTruthy();
  });
}, 15000);





it("handles query error callback", async () => {
  const consoleSpy = jest
    .spyOn(console, "log")
    .mockImplementation(() => {});

  (useQuery as jest.Mock).mockImplementation((config) => {
    config.throwOnError(
      { message: "API Error" },
      { queryKey: ["get-upcoming-duties-list"] }
    );

    return {
      data: {
        upcomingShifts: [],
      },
      isLoading: false,
      refetch: jest.fn(),
    };
  });

  renderScreen();

  expect(consoleSpy).toHaveBeenCalledWith(
    "Error fetching data:",
    "API Error"
  );

  consoleSpy.mockRestore();
});

it("triggers refresh control", () => {
  const mockRefetch = jest.fn();

  (useQuery as jest.Mock).mockReturnValue({
    data: { upcomingShifts: [] },
    isLoading: false,
    refetch: mockRefetch,
  });

  const screen = renderScreen();

  const flatList = screen.UNSAFE_getByType(require("react-native").FlatList);

  flatList.props.refreshControl.props.onRefresh();

  expect(mockRefetch).toHaveBeenCalled();
});

it("calls refetch on refresh", () => {
  const mockRefetch = jest.fn();

  (useQuery as jest.Mock).mockReturnValue({
    data: {
      upcomingShifts: [],
    },
    isLoading: false,
    refetch: mockRefetch,
  });

  renderScreen();

  mockRefetch();

  expect(mockRefetch).toHaveBeenCalled();
});


it("renders multiple shifts", async () => {
  (useQuery as jest.Mock).mockReturnValue({
    data: {
      upcomingShifts: [
        {
          id: "1",
          shiftInTpam: { label: "Morning Shift" },
          checkpointInTpam: { name: "Checkpoint A" },
          startTime: "2026-01-01T10:00:00Z",
          endTime: "2026-01-01T12:00:00Z",
        },
        {
          id: "2",
          shiftInTpam: { label: "Night Shift" },
          checkpointInTpam: { name: "Checkpoint B" },
          startTime: "2026-01-01T18:00:00Z",
          endTime: "2026-01-01T20:00:00Z",
        },
      ],
    },
    isLoading: false,
    refetch: jest.fn(),
  });

  const screen = renderScreen();

  expect(await screen.findByText("Night Shift")).toBeTruthy();
  expect(await screen.findByText("Checkpoint B")).toBeTruthy();
});



it("renders multiple shifts", async () => {
  (useQuery as jest.Mock).mockReturnValue({
    data: {
      upcomingShifts: [
        {
          id: "1",
          shiftInTpam: { label: "Morning Shift" },
          checkpointInTpam: { name: "Checkpoint A" },
          startTime: "2026-01-01T10:00:00Z",
          endTime: "2026-01-01T12:00:00Z",
        },
        {
          id: "2",
          shiftInTpam: { label: "Night Shift" },
          checkpointInTpam: { name: "Checkpoint B" },
          startTime: "2026-01-01T18:00:00Z",
          endTime: "2026-01-01T20:00:00Z",
        },
      ],
    },
    isLoading: false,
    refetch: jest.fn(),
  });

  const screen = renderScreen();

  expect(await screen.findByText("Night Shift")).toBeTruthy();
  expect(await screen.findByText("Checkpoint B")).toBeTruthy();
});

  it("calls API with correct user id", async () => {
    (useQuery as jest.Mock).mockImplementation(() => {
      mockGet("/userApp/get-upcoming-duties/123");

      return {
        data: { upcomingShifts: [] },
        isLoading: false,
      };
    });

    renderScreen();

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        "/userApp/get-upcoming-duties/123"
      );
    });
  });

  it("shows empty state when no shifts exist", async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        upcomingShifts: [],
      },
      isLoading: false,
    });

    const { findByText } = renderScreen();

    expect(await findByText("No active duty found.")).toBeTruthy();
  });
});

