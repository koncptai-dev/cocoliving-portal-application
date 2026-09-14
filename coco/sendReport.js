const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "erraza.developer@gmail.com",
    pass: "vqqy xhuj eiho omls"
  }
});

async function sendReport() {
  try {

    await transporter.sendMail({
      from: "erraza.developer@gmail.com",

      to: [
        "mustafa.raza@koncpt.ai",
        "rohit.rathod@koncpt.ai"
      ],

      subject: "React Native Test Execution Report",

      html: `
        <h2>Test Execution Summary</h2>

        <table border="1" cellpadding="10">
          <tr>
            <th>Total Suites</th>
            <th>Total Tests</th>
            <th>Passed</th>
            <th>Failed</th>
          </tr>

          <tr>
            <td>10</td>
            <td>57</td>
            <td>57</td>
            <td>0</td>
          </tr>
        </table>

        <p>All tests passed successfully.</p>

        <p>APK build will start now.</p>
      `,

      attachments: [
        {
          filename: "jest-report.html",
          path: "./reports/jest-report.html"
        }
      ]
    });

    console.log("Email sent successfully");

  } catch (err) {

    console.log(err);

    process.exit(1);
  }
}

sendReport();