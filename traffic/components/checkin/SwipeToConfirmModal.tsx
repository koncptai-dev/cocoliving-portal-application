import {
  Modal,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Pressable,
} from "react-native";

import { ChevronsRight } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import SwipeButton from "rn-swipe-button";
import { t } from "i18next";
import { BlurView } from "expo-blur";

const screenWidth = Dimensions.get("window").width;

const CONTAINER_PADDING = 40;
const BUTTON_WIDTH = 50;
const BUTTON_MARGIN_LEFT = 5;
const CONTAINER_WIDTH = screenWidth - CONTAINER_PADDING;
const MAX_TRANSLATE_X = CONTAINER_WIDTH - BUTTON_WIDTH - BUTTON_MARGIN_LEFT;
const SWIPE_THRESHOLD = MAX_TRANSLATE_X * 0.8;

export default function SwipeToConfirmModal({
  state,
  showSwipeModal,
  setShowSwipeModal,
  onSwipeSuccess,
}) {
  return (
    <Modal
      transparent
      visible={showSwipeModal}
      animationType="fade"
      onRequestClose={() => setShowSwipeModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => {
          setShowSwipeModal(false);
        }}
      >
        <View style={styles.swipeContainer}>
          <View style={{ width: "100%" }}>
            <SwipeButton
              // forceReset={ (reset: any) => {
              //   forceResetLastButton = reset
              // }}
              finishRemainingSwipeAnimationDuration={100}
              // forceCompleteSwipe={ (forceComplete: any) => {
              //   forceCompleteCallback = forceComplete
              // }}
              railBackgroundColor={Colors.primary.background}
              railStyles={{
                backgroundColor: "#020181",
                borderColor: "#020181",
              }}
              containerStyles={{ width: "100%" }}
              thumbIconBackgroundColor="#FFFFFF"
              thumbIconComponent={() => (
  <ChevronsRight
    size={18}
    color="black"
    strokeWidth={2.5}
  />
)}
              title={state === "punch-in" ? t("slide-to-punch-in") : t("slide-to-punch-out")}
              titleColor="white"
              onSwipeSuccess={()=>{onSwipeSuccess(state)}}
            />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  swipeContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  swipeTrack: {
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingLeft: 10,
    overflow: "hidden",
  },
  swipeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 5,
  },
  swipeText: {
    flex: 1,
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 60,
  },
});
