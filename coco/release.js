const { execSync } = require("child_process");

try {
  console.log("=================================");
  console.log("STEP 1: Running Jest Tests");
  console.log("=================================");

  execSync("npm test", {
    stdio: "inherit",
  });

  console.log("=================================");
  console.log("STEP 2: Sending Report");
  console.log("=================================");

  execSync("node sendReport.js", {
    stdio: "inherit",
  });

  console.log("=================================");
  console.log("STEP 3: Building APK");
  console.log("=================================");

  execSync(
    process.platform === "win32"
      ? "cd android && gradlew assembleRelease"
      : "cd android && ./gradlew assembleRelease",
    {
      stdio: "inherit",
    }
  );

  console.log("=================================");
  console.log("APK Generated Successfully");
  console.log("=================================");

} catch (error) {
  console.error("Process Failed");
  process.exit(1);
}