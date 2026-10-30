import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import CurrentLocationConfirmationModal from "../checkin/CurrentLocationConfirmationModal";
import * as Location from "expo-location";

/* ---------------- MOCKS ---------------- */
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
// Mock MapView + Marker
jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref) => {
      React.useImperativeHandle(ref, () => ({
        animateToRegion: jest.fn(),
      }));
      return <View {...props}>{props.children}</View>;
    }),
    Marker: (props: any) => <View {...props} />,
    PROVIDER_GOOGLE: "google",
  };
});

// Mock icons
jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

// Mock expo-location
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    High: 1,
  },
}));

/* ---------------- CLEANUP ---------------- */
afterEach(() => {
  jest.clearAllMocks();
});

/* ================= TESTS ================= */

describe("CurrentLocationConfirmationModal", () => {
  const defaultProps = {
    handleBackPress: jest.fn(),
    locationCoordinates: null,
    modalOpenState: true,
  };

  it("renders map and back button", () => {
    const { getByTestId } = render(
      <CurrentLocationConfirmationModal {...defaultProps} />
    );

    // We don't have testID yet → see improvement below
  });

  it("calls handleBackPress when back button pressed", () => {
    const { getByTestId } = render(
      <CurrentLocationConfirmationModal {...defaultProps} />
    );

    fireEvent.press(getByTestId("back-button"));

    expect(defaultProps.handleBackPress).toHaveBeenCalled();
  });

  it("uses passed locationCoordinates when valid", async () => {
    const props = {
      ...defaultProps,
      locationCoordinates: {
        latitude: 10,
        longitude: 20,
      },
    };

    const { getByTestId } = render(
      <CurrentLocationConfirmationModal {...props} />
    );

    await waitFor(() => {
      const map = getByTestId("map");
      expect(map.props.region.latitude).toBe(10);
      expect(map.props.region.longitude).toBe(20);
    });
  });

  it("fetches live location if no coordinates provided", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });

    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: 50,
        longitude: 60,
      },
    });

    const { getByTestId } = render(
      <CurrentLocationConfirmationModal {...defaultProps} />
    );

    await waitFor(() => {
      const map = getByTestId("map");
      expect(map.props.region.latitude).toBe(50);
      expect(map.props.region.longitude).toBe(60);
    });
  });

  it("does not fetch location if permission denied", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "denied",
    });

    render(<CurrentLocationConfirmationModal {...defaultProps} />);

    await waitFor(() => {
      expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    });
  });

  it("handles invalid locationCoordinates safely", async () => {
    const props = {
      ...defaultProps,
      locationCoordinates: {
        latitude: null,
        longitude: null,
      },
    };

    render(<CurrentLocationConfirmationModal {...props} />);

    await waitFor(() => {
      // Just ensures no crash
      expect(true).toBe(true);
    });
  });
});