import React from "react";
import { Text, StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LegalScreen from "./LegalScreen";

const AboutUs = () => {
  const isDark = useColorScheme() === "dark";

  const textStyle = [styles.text, isDark && styles.darkText];
  const headingStyle = [styles.heading, isDark && styles.darkText];

  return (
    <SafeAreaView style={styles.container}>
      <LegalScreen title="About Us">

        <Text style={headingStyle}>
          PRAMAAN App – A Modern Transformation in Attendance and Leave Management for Traffic Police
        </Text>

        <Text style={textStyle}>
          In today’s rapidly growing cities, effective traffic management requires not only manpower but also transparency, accountability, and real-time coordination. Previously, traffic police attendance and leave management relied entirely on manual processes—register entries, physical presence at stations, and verbal communication.
        </Text>

        <Text style={textStyle}>
          This system had several limitations, such as inaccurate records, delays, and lack of clear visibility into the actual presence of personnel in the field.
        </Text>

        <Text style={textStyle}>
          To address these challenges, the PRAMAAN App has been developed as a secure, modern, and intelligent digital solution that enhances efficiency and transparency in the functioning of the traffic police department.
        </Text>

        <Text style={headingStyle}>Challenges in the Manual System</Text>

        <Text style={textStyle}>• Attendance was recorded manually in registers, leading to possible errors and mismanagement.</Text>
        <Text style={textStyle}>• Real-time information about field personnel was not available.</Text>
        <Text style={textStyle}>• Monitoring punctuality and duty attendance was difficult.</Text>
        <Text style={textStyle}>• Leave processes were paper-based, causing delays and lack of clarity.</Text>
        <Text style={textStyle}>• There was no reliable way to verify whether personnel were present at their assigned locations.</Text>

        <Text style={headingStyle}>How PRAMAAN App Brings Improvement</Text>

        <Text style={headingStyle}>Digital Attendance and Real-Time Tracking</Text>
        <Text style={textStyle}>
          Traffic police personnel can now mark attendance using a mobile application. The system captures:
        </Text>
        <Text style={textStyle}>• Live GPS location</Text>
        <Text style={textStyle}>• Attendance timestamp</Text>
        <Text style={textStyle}>• Device authentication checks</Text>

        <Text style={textStyle}>
          This ensures that attendance is recorded only when the personnel are physically present at their assigned duty location.
        </Text>

        <Text style={headingStyle}>Location Verification and Prevention of Fake Attendance</Text>
        <Text style={textStyle}>
          The app uses advanced location validation technology. If a user attempts to mark attendance using fake GPS or spoofed location, the system can detect it. This reduces false attendance practices and ensures complete accountability.
        </Text>

        <Text style={headingStyle}>Simple and Transparent Leave Management</Text>
        <Text style={textStyle}>• Online leave application</Text>
        <Text style={textStyle}>• Transparent tracking of leave status</Text>
        <Text style={textStyle}>
          This eliminates paperwork and speeds up the overall process.
        </Text>

        <Text style={headingStyle}>Real-Time Monitoring for Senior Officers</Text>
        <Text style={textStyle}>• Live dashboard with field personnel data</Text>
        <Text style={textStyle}>• Attendance reports and analytics</Text>
        <Text style={textStyle}>• Alert system for irregularities</Text>

        <Text style={textStyle}>
          This helps in better decision-making and efficient management.
        </Text>

        <Text style={headingStyle}>Impact on Traffic Management</Text>
        <Text style={textStyle}>• Discipline and accountability among personnel increase</Text>
        <Text style={textStyle}>• Proper staff deployment at critical traffic points is ensured</Text>
        <Text style={textStyle}>• Administrative workload is reduced</Text>
        <Text style={textStyle}>• Transparency across the system improves</Text>

        <Text style={textStyle}>
          As a result, traffic management becomes more organized and the quality of public service improves.
        </Text>

        <Text style={headingStyle}>Conclusion</Text>
        <Text style={textStyle}>
          The PRAMAAN App represents a significant step toward digital governance in law enforcement. By replacing traditional manual systems, it provides a secure, transparent, and efficient platform, serving as a reliable solution for the traffic police department.
        </Text>

      </LegalScreen>
    </SafeAreaView>
  );
};

export default AboutUs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 15,
    marginBottom: 10,
    color: "#000",
    lineHeight: 22,
  },
  heading: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
    color: "#000",
  },
  darkText: {
    color: "#fff",
  },
});

// import React from "react";
// import { Text, StyleSheet, useColorScheme } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import LegalScreen from "./LegalScreen";

// const AboutUs = () => {
//   const isDark = useColorScheme() === "dark";

//   return (
//     <SafeAreaView style={styles.container}>
//       <LegalScreen title="About Us">
//         <Text style={[styles.text, isDark && styles.darkText]}>
//           Traffic Police Management System is a mobile application designed to
//           streamline duty management, monitoring, and verification for traffic
//           police personnel and inspectors.
//         </Text>

//         <Text style={[styles.text, isDark && styles.darkText]}>
//           The app enables GPS-based check-in/check-out, real-time duty tracking,
//           and efficient supervision.
//         </Text>

//         <Text style={[styles.text, isDark && styles.darkText]}>
//           Our goal is to improve transparency, accountability, and operational
//           efficiency using modern digital solutions.
//         </Text>
//       </LegalScreen>
//     </SafeAreaView>
//   );
// };

// export default AboutUs;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   text: {
//     fontSize: 16,
//     marginBottom: 12,
//     color: "#000",
//   },
//   darkText: {
//     color: "#fff",
//   },
// });