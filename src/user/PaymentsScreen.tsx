import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ToastAndroid,
  Platform,
} from "react-native";

import WebView from "react-native-webview";
import Print from "react-native-print";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import RNFS from "react-native-fs";
import Config from "react-native-config";

export const API_BASE_URL = Config.API_BASE_URL;

const rupee = (n?: number) =>
  `₹${(n || 0).toLocaleString("en-IN")}`;

const friendlyDate = (iso?: string) => {
  if (!iso) return "—";

  const date = new Date(iso);

  const day = date
    .getDate()
    .toString()
    .padStart(2, "0");

  const month = date.toLocaleString("en-US", {
    month: "short",
  });

  const year = date.getFullYear();

  let hours = date.getHours();

  const minutes = date
    .getMinutes()
    .toString()
    .padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${day} ${month} ${year} · ${hours}:${minutes} ${ampm}`;
};

const printableInvoiceHtml = (payment: any) => {
  const brand = "COCO LIVING";

  const title = "Invoice for Transaction";

  const order = payment.merchantOrderId || "—";

  const amount = rupee(payment.amountRupees ?? 0);

  const status = payment.status || "—";

  const phonepe = payment.phonepeOrderId || "—";

  const created = friendlyDate(payment.createdAt);

  const paymentMode = payment.paymentMode || "—";

  const advanceRent = rupee(payment.advanceRent);
const securityDeposit = rupee(payment.securityDeposit);
const amcCharges = rupee(payment.amcCharges);
const mealSubscriptionCharges = rupee(payment.mealSubscriptionCharges);
const mealSubscriptionDuration =
  payment.mealSubscriptionDuration || 0;
const totalAmount = rupee(payment.totalAmount);

  // const paymentType = payment.paymentType || "—";
const paymentType =
  payment.offlinePaymentType ||
  payment.paymentType ||
  "—";
  const adminNote = payment.adminNote || "";

  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Invoice - ${order}</title>

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      />

      <style>
        @page {
          margin: 1cm;
        }

        body {
          margin: 0;
          padding: 20px;
          font-family: -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            "Helvetica Neue",
            Arial;

          color: #111827;
        }

        .wrap {
          max-width: 800px;
          margin: 0 auto;
        }

        .brand {
          text-align: center;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.6px;
        }

        .title {
          text-align: center;
          font-size: 16px;
          font-weight: 500;
          margin-top: 4px;
        }

        .order {
          text-align: center;
          font-size: 15px;
          font-weight: 600;
          margin-top: 2px;
        }

        .date-block {
          text-align: right;
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 20px;
        }

        .box {
          border: 1px solid #e5e7eb;
          padding: 14px;
          border-radius: 8px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dashed #eee;
        }

        .row:last-child {
          border-bottom: none;
        }

        .label {
          color: #6b7280;
          font-size: 13px;
        }

        .thank {
          margin-top: 24px;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
        }

        .small-note {
          font-size: 11px;
          color: #6b7280;
          text-align: center;
          margin-top: 30px;
        }
      </style>
    </head>

    <body>
      <div class="wrap">

        <div class="date-block">
          ${created}
        </div>

        <div class="brand">
          ${brand}
        </div>

        <div class="title">
          ${title}
        </div>

        <div class="order">
          ${order}
        </div>

        <div class="box">

          <div class="row">
            <div class="label">Amount</div>
            <div>
              <strong>${amount}</strong>
            </div>
          </div>

          <div class="row">
            <div class="label">Status</div>
            <div>${status}</div>
          </div>

          <div class="row">
            <div class="label">Type</div>
            <div>${payment.type || "—"}</div>
          </div>

          <div class="row">
            <div class="label">Payment Mode</div>
            <div>${paymentMode}</div>
          </div>

          ${
            payment.paymentMode === "ONLINE"
              ? `
          <div class="row">
            <div class="label">PhonePe Order</div>
            <div>${phonepe}</div>
          </div>
          `
              : `
          <div class="row">
            <div class="label">Payment Type</div>
            <div>${paymentType}</div>
          </div>

          <div class="row">
            <div class="label">Admin Note</div>
            <div>${adminNote}</div>
          </div>
          `
          }

          ${
  payment.paymentType === "Initial"
    ? `
<div class="row">
  <div class="label">Advance Rent</div>
  <div>${advanceRent}</div>
</div>

<div class="row">
  <div class="label">Security Deposit</div>
  <div>${securityDeposit}</div>
</div>

<div class="row">
  <div class="label">AMC Charges</div>
  <div>${amcCharges}</div>
</div>

<div class="row">
  <div class="label">Meal Subscription</div>
  <div>${mealSubscriptionCharges}</div>
</div>

<div class="row">
  <div class="label">Meal Duration</div>
  <div>${mealSubscriptionDuration} Month${
        mealSubscriptionDuration > 1 ? "s" : ""
      }</div>
</div>

<div class="row">
  <div class="label"><strong>Total Amount</strong></div>
  <div><strong>${totalAmount}</strong></div>
</div>
`
    : ""
}

        </div>

        <div class="thank">
          Thank you for choosing Coco Living.
        </div>

        <div class="small-note">
          This is a computer-generated invoice
          and does not require a physical signature.
        </div>

      </div>
    </body>
  </html>
  `;
};

const PaymentHistoryScreen = () => {
  const { user } = useAuth();

  const token = user?.token;

  const navigation = useNavigation();

  const [payments, setPayments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);

  const limit = 100;

  const [totalPages, setTotalPages] = useState(1);

  const [selectedPayment, setSelectedPayment] =
    useState<any | null>(null);

  // const fetchPayments = async (p = 1) => {
  //   try {
  //     setLoading(true);

  //     const res = await axios.get(
  //       `${API_BASE_URL}/api/payments/user-transactions?page=${p}&limit=${limit}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     setPayments(res.data.payments || []);

  //     setTotalPages(res.data.totalPages || 1);

  //     setPage(p);
  //   } catch (err) {
  //     console.log("Payment fetch error", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const fetchPayments = async (p = 1) => {
  try {
    setLoading(true);

    console.log("========== FETCH PAYMENTS START ==========");
    console.log("Page:", p);

    const url =
      `${API_BASE_URL}/api/payments/user-transactions?page=${p}&limit=${limit}`;

    console.log("API URL:", url);

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("========== PAYMENT API RESPONSE ==========");
    console.log(JSON.stringify(res.data, null, 2));

    console.log("========== PAYMENTS ARRAY ==========");
    console.log(
      JSON.stringify(res.data.payments, null, 2)
    );

    console.log(
      "Total Payments:",
      res.data.payments?.length
    );

    if (res.data.payments?.length > 0) {
      console.log(
        "First Payment Item:",
        JSON.stringify(
          res.data.payments[0],
          null,
          2
        )
      );
    }

    setPayments(res.data.payments || []);

    setTotalPages(res.data.totalPages || 1);

    setPage(p);

    console.log("========== FETCH PAYMENTS END ==========");
  } catch (err: any) {
    console.log("========== PAYMENT FETCH ERROR ==========");

    console.log("Error Message:", err?.message);

    console.log(
      "Error Response:",
      JSON.stringify(err?.response?.data, null, 2)
    );

    console.log("Full Error:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (token) {
      fetchPayments(1);
    }
  }, [token]);

  const showToast = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(
        message,
        ToastAndroid.LONG
      );
    }
  };

  // const handleInvoicePress = (item: any) => {
  //   const invoiceUrl =
  //     `${API_BASE_URL}/uploads/invoices/INV-${item.id}.pdf`;

  //   setSelectedPayment({
  //     ...item,
  //     invoiceUrl,
  //   });
  // };

const handleInvoicePress = (item: any) => {
  const invoiceUrl = `${API_BASE_URL}/${item.invoicePdfPath}`;

  console.log("Invoice URL:", invoiceUrl);

  setSelectedPayment({
    ...item,
    invoiceUrl,
  });
};


  const handleSavePdf = async () => {
    if (!selectedPayment) return;

    try {
      const downloadDest =
        `${RNFS.DocumentDirectoryPath}/invoice-${selectedPayment.id}.pdf`;

      await RNFS.downloadFile({
        fromUrl: selectedPayment.invoiceUrl,
        toFile: downloadDest,
      }).promise;

      await Print.print({
        filePath: downloadDest,
      });

      showToast("PDF downloaded successfully!");
    } catch (error) {
      console.log("Print error:", error);

      showToast("Failed to save PDF");
    }
  };

  const htmlContent = selectedPayment
    ? printableInvoiceHtml(selectedPayment)
    : "";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F6F3EC",
      }}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color="#4b3426"
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Payment History
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#6A4A3C"
        />
      ) : (
        <>
          <FlatList
            data={payments}
            keyExtractor={(item) =>
              item.id.toString()
            }
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 20,
            }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  {/* <Text style={styles.orderId}>
                    {item.merchantOrderId}
                  </Text> */}

<Text style={styles.orderId}>
  {item.paymentType === "Initial"
    ? `INITIAL-${item.id}`
    : item.paymentMode === "OFFLINE"
    ? item.type
    : item.merchantOrderId}
</Text>

                  <View
                    style={[
                      styles.badge,

                      item.status === "SUCCESS"
                        ? styles.success
                        : item.status === "FAILED"
                        ? styles.failed
                        : styles.pending,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* PAYMENT MODE */}

                <Text style={styles.subText}>
                  Payment Mode:{" "}
                  {item.paymentMode || "N/A"}
                </Text>

                {/* ONLINE */}

               



                {item.paymentMode === "ONLINE" && (
  <Text style={styles.subText}>
    {item.type === "ELECTRICITY_RECHARGE"
      ? "ELECTRICITY_RECHARGE"
      : item.phonepeOrderId || "PhonePe ID not available"}
  </Text>
)}

                {/* OFFLINE */}

                {item.paymentMode ===
                  "OFFLINE" && (
                  <>
                    {/* <Text style={styles.subText}>
                      Payment Type:{" "}
                      {item.paymentType || "N/A"}
                    </Text> */}

<Text style={styles.subText}>
  Payment Type:{" "}
  {item.offlinePaymentType || "N/A"}
</Text>

                    {!!item.adminNote && (
                      <Text style={styles.noteText}>
                        Note: {item.adminNote}
                      </Text>
                    )}
                  </>
                )}



{/* {item.additionalDetails && (
  <View style={styles.initialPaymentContainer}>
    <Text style={styles.breakupTitle}>Payment Details</Text>

<View style={styles.breakupRow}>
      <Text style={styles.breakupLabel}>Payment Mode</Text>
      <Text style={styles.breakupValue}>
        {item.paymentMode || "N/A"}
      </Text>
    </View>

    <View style={styles.breakupRow}>
      <Text style={styles.breakupLabel}>Payment Type</Text>
      <Text style={styles.breakupValue}>
        {item.offlinePaymentType || "N/A"}
      </Text>
    </View>

 <View style={styles.breakupRow}>
    <Text style={styles.breakupLabel}>Payment Category</Text>
    <Text style={styles.breakupValue}>
      {item.paymentType || "N/A"}
    </Text>
  </View>

    <View style={styles.breakupRow}>
      <Text style={styles.breakupLabel}>Advance Rent</Text>
      <Text style={styles.breakupValue}>
        {rupee(item.advanceRent)}
      </Text>
    </View>

    <View style={styles.breakupRow}>
      <Text style={styles.breakupLabel}>Security Deposit</Text>
      <Text style={styles.breakupValue}>
        {rupee(item.securityDeposit)}
      </Text>
    </View>

    <View style={styles.breakupRow}>
      <Text style={styles.breakupLabel}>AMC Charges</Text>
      <Text style={styles.breakupValue}>
        {rupee(item.amcCharges)}
      </Text>
    </View>

    <View style={styles.breakupRow}>
      <Text style={styles.breakupLabel}>
        Meal Subscription
      </Text>
      <Text style={styles.breakupValue}>
        {rupee(item.mealSubscriptionCharges)}
      </Text>
    </View>

    <View style={styles.breakupRow}>
      <Text style={styles.breakupLabel}>
        Meal Duration
      </Text>
      <Text style={styles.breakupValue}>
        {item.mealSubscriptionDuration} Month
        {item.mealSubscriptionDuration > 1 ? "s" : ""}
      </Text>
    </View>

    <View style={[styles.breakupRow, styles.totalRow]}>
      <Text style={styles.totalLabel}>Total Amount</Text>
      <Text style={styles.totalValue}>
        {rupee(item.totalAmount)}
      </Text>
    </View>
  </View>
)} */}

{item.additionalDetails && (
  <View style={styles.detailsCard}>
   
  
    {/* Row 1 */}
    <View style={styles.gridRow}>
     
      <View style={styles.gridItem}>
        <Text style={styles.gridLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>
          {rupee(item.totalAmount)}
        </Text>
      </View>
     
      <View style={styles.gridItem}>
        <Text style={styles.gridLabel}>AMC Charges</Text>
        <Text style={styles.gridValue}>
          {rupee(item.amcCharges)}
        </Text>
      </View>
      

     
    </View>

    {/* Row 2 */}
    <View style={styles.gridRow}>
      <View style={styles.gridItem}>
        <Text style={styles.gridLabel}>Advance Rent</Text>
        <Text style={styles.gridValue}>
          {rupee(item.advanceRent)}
        </Text>
      </View>

      <View style={styles.gridItem}>
        <Text style={styles.gridLabel}>Security Deposit</Text>
        <Text style={styles.gridValue}>
          {rupee(item.securityDeposit)}
        </Text>
      </View>
    </View>

    {/* Row 3 */}
    <View style={styles.gridRow}>
     
       <View style={styles.gridItem}>
        <Text style={styles.gridLabel}>Meal Duration</Text>
        <Text style={styles.gridValue}>
          {item.mealSubscriptionDuration} Month
          {item.mealSubscriptionDuration > 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.gridItem}>
        <Text style={styles.gridLabel}>Meal Subscription</Text>
        <Text style={styles.gridValue}>
          {rupee(item.mealSubscriptionCharges)}
        </Text>
      </View>
    </View>

    {/* Row 4 */}
    {/* <View style={styles.gridRow}>
     

      <View style={styles.gridItem} />
    </View> */}


  </View>
)}


                <View style={styles.amountRow}>
                  <Text style={styles.amount}>
                    {rupee(item.amountRupees)}
                  </Text>

                 
                    
                   {item.status === "SUCCESS" && 
                   item.invoicePdfPath && (
                    <TouchableOpacity
                      style={styles.downloadBtn}
                      onPress={() =>
                        handleInvoicePress(item)
                      }
                    >
                      <Ionicons
                        name="download-outline"
                        size={16}
                        color="#fff"
                      />

                      <Text
                        style={styles.downloadText}
                      >
                        Invoice
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.dateText}>
                  {new Date(
                    item.createdAt
                  ).toLocaleString()}
                </Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />

          {/* PAGINATION */}

          <View style={styles.pagination}>
            <TouchableOpacity
              disabled={page === 1}
              onPress={() =>
                fetchPayments(page - 1)
              }
              style={[
                styles.pageBtn,
                page === 1 &&
                  styles.disabled,
              ]}
            >
              <Text style={styles.pageText}>
                Prev
              </Text>
            </TouchableOpacity>

            <Text style={styles.pageInfo}>
              Page {page} of {totalPages}
            </Text>

            <TouchableOpacity
              disabled={page === totalPages}
              onPress={() =>
                fetchPayments(page + 1)
              }
              style={[
                styles.pageBtn,
                page === totalPages &&
                  styles.disabled,
              ]}
            >
              <Text style={styles.pageText}>
                Next
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.totalInfo}>
            Total pages available:{" "}
            {totalPages}
          </Text>
        </>
      )}

      {/* MODAL */}

      <Modal
        visible={!!selectedPayment}
        animationType="slide"
        onRequestClose={() =>
          setSelectedPayment(null)
        }
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "#fff",
          }}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() =>
                setSelectedPayment(null)
              }
            >
              <Ionicons
                name="close"
                size={28}
                color="#000"
              />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              Invoice
            </Text>

            <TouchableOpacity
              onPress={handleSavePdf}
            >
              <Ionicons
                name="download-outline"
                size={26}
                color="#D07D23"
              />

              <Text
                style={{
                  color: "#D07D23",
                  marginLeft: 4,
                  fontWeight: "bold",
                }}
              >
                Save PDF
              </Text>
            </TouchableOpacity>
          </View>

          {/* <WebView
            source={{
              uri: `https://docs.google.com/gview?embedded=true&url=${selectedPayment?.invoiceUrl}`,
            }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator
                  size="large"
                  color="#D07D23"
                />
              </View>
            )}
          /> */}
       {/* <WebView
  originWhitelist={["*"]}
  source={{ html: htmlContent }}
  style={{ flex: 1 }}
  javaScriptEnabled
  domStorageEnabled
  startInLoadingState
  renderLoading={() => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator
        size="large"
        color="#D07D23"
      />
    </View>
  )}
/> */}


  {/* <WebView
  source={{
    uri: selectedPayment?.invoiceUrl,
  }}
  style={{ flex: 1 }}
  javaScriptEnabled={true}
  domStorageEnabled={true}
  startInLoadingState={true}
  renderLoading={() => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator
        size="large"
        color="#D07D23"
      />
    </View>
  )}
/> */}


<WebView
  source={{
    uri: `https://docs.google.com/gview?embedded=true&url=${selectedPayment?.invoiceUrl}`,
  }}
  style={{ flex: 1 }}
  javaScriptEnabled
  domStorageEnabled
  startInLoadingState
  renderLoading={() => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator
        size="large"
        color="#D07D23"
      />
    </View>
  )}
/>

        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default PaymentHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F3EC",
    padding: 16,
    paddingHorizontal: 20,
  },
detailsCard: {
  marginTop: 12,
  padding: 12,
  borderRadius: 10,
  backgroundColor: "#FAF7F2",
  borderWidth: 1,
  borderColor: "#EFE3D5",
},

gridRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 12,
},

gridItem: {
  width: "48%",
},

gridLabel: {
  fontFamily: "Quicksand-Regular",
  fontSize: 12,
  color: "#8A7160",
},

gridValue: {
  marginTop: 4,
  fontFamily: "Quicksand-Bold",
  fontSize: 14,
  color: "#3E2A1F",
},
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: 30,
    marginBottom: 10,
  },

  title: {
    fontSize: 25,
    fontFamily: "Quicksand-Bold",
    color: "#4b3426",
    marginLeft: 12,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
initialPaymentContainer: {
  marginTop: 12,
  padding: 12,
  borderRadius: 10,
  backgroundColor: "#FAF7F2",
  borderWidth: 1,
  borderColor: "#EFE3D5",
},

breakupTitle: {
  fontFamily: "Quicksand-Bold",
  fontSize: 14,
  color: "#4b3426",
  marginBottom: 8,
},

breakupRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  paddingVertical: 4,
},

breakupLabel: {
  fontFamily: "Quicksand-Regular",
  fontSize: 13,
  color: "#6A4A3C",
},

breakupValue: {
  fontFamily: "Quicksand-SemiBold",
  fontSize: 13,
  color: "#3E2A1F",
},

totalRow: {
  marginTop: 8,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: "#DDD",
},

totalLabel: {
  fontFamily: "Quicksand-Bold",
  fontSize: 14,
  color: "#4b3426",
},

totalValue: {
  fontFamily: "Quicksand-Bold",
  fontSize: 15,
  color: "#D07D23",
},
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  orderId: {
    fontFamily: "Quicksand-SemiBold",
    fontSize: 14,
    color: "#3E2A1F",
  },

  subText: {
    fontFamily: "Quicksand-Regular",
    fontSize: 12,
    color: "#7A6A5E",
    marginTop: 4,
  },

  noteText: {
    marginTop: 4,
    fontSize: 12,
    color: "#6A4A3C",
    fontFamily: "Quicksand-Medium",
    fontStyle: "italic",
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  amount: {
    fontFamily: "Quicksand-Bold",
    fontSize: 18,
    color: "#4b3426",
  },

  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D07D23",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  downloadText: {
    color: "#fff",
    fontFamily: "Quicksand-SemiBold",
    fontSize: 12,
    marginLeft: 4,
  },

  dateText: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#8A7160",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },

  badgeText: {
    fontSize: 11,
    fontFamily: "Quicksand-Bold",
    color: "#fff",
  },

  success: {
    backgroundColor: "#2E7D32",
  },

  failed: {
    backgroundColor: "#C62828",
  },

  pending: {
    backgroundColor: "#ED6C02",
  },

  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 16,
  },

  pageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#4b3426",
    borderRadius: 10,
  },

  pageText: {
    color: "#fff",
    fontFamily: "Quicksand-SemiBold",
  },

  disabled: {
    opacity: 0.4,
  },

  pageInfo: {
    fontFamily: "Quicksand-SemiBold",
    color: "#4b3426",
  },

  totalInfo: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    marginBottom: 15,
    fontFamily: "Quicksand-Regular",
    color: "#6A4A3C",
    paddingHorizontal: 16,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },

  modalTitle: {
    fontSize: 18,
    fontFamily: "Quicksand-Bold",
    color: "#4b3426",
  },
});















