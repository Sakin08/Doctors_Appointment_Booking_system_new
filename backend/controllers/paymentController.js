import SSLCommerzPayment from "sslcommerz-lts";
import dotenv from "dotenv";
import appointmentModel from "../models/appointmentModel.js";

dotenv.config();

const {
  SSLCZ_STORE_ID,
  SSLCZ_STORE_PASS,
  SSLCZ_IS_LIVE,
  BACKEND_URL,
  FRONTEND_URL,
} = process.env;

const getBackendUrl = (req) => {
  try {
    if (req?.headers?.host && !req.headers.host.includes('localhost')) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      return `${protocol}://${req.headers.host}`;
    }
  } catch (error) {
    console.error("Error detecting backend URL:", error.message);
  }
  return BACKEND_URL || 'http://localhost:4000';
};

const getFrontendUrl = (req) => {
  try {
    const origin = req.headers?.origin || req.headers?.referer || '';
    if (origin.startsWith('http') && !origin.includes('localhost')) {
      return new URL(origin).origin;
    }
    if (req?.headers?.host && !req.headers.host.includes('localhost')) {
      return `https://${req.headers.host.replace(/^api\./, '')}`;
    }
  } catch (error) {
    console.error("Error detecting frontend URL:", error.message);
  }
  return FRONTEND_URL || 'http://localhost:5173';
};

export const initPayment = async (req, res) => {
  const { name, email, phone, amount, appointmentId } = req.body;

  try {
    const backendUrl = getBackendUrl(req);

    if (!backendUrl.startsWith('http')) {
      return res.status(500).json({ message: 'Invalid backend URL' });
    }

    const tran_id = `txn_${Math.floor(Math.random() * 1e9)}`;

    const data = {
      total_amount: amount || 500,
      currency: "BDT",
      tran_id,
      success_url: `${backendUrl}/api/payment/success/${tran_id}/${appointmentId || ''}`,
      fail_url: `${backendUrl}/api/payment/fail`,
      cancel_url: `${backendUrl}/api/payment/cancel`,
      ipn_url: `${backendUrl}/api/payment/ipn`,
      shipping_method: "NO",
      product_name: "Doctor Appointment",
      product_category: "Healthcare",
      product_profile: "general",
      cus_name: name || "Guest",
      cus_email: email || "test@example.com",
      cus_add1: "Dhaka",
      cus_add2: "Dhaka",
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: phone || "01811497418",
      cus_fax: "N/A",
    };

    if (appointmentId) {
      const appointment = await appointmentModel.findById(appointmentId);
      if (appointment) {
        appointment.paymentInfo = { tran_id };
        await appointment.save();
      }
    }

    const sslcz = new SSLCommerzPayment(SSLCZ_STORE_ID, SSLCZ_STORE_PASS, SSLCZ_IS_LIVE === 'true');
    const apiResponse = await sslcz.init(data);

    if (apiResponse?.GatewayPageURL) {
      return res.status(200).json({ url: apiResponse.GatewayPageURL });
    }

    return res.status(500).json({ message: "SSLCommerz payment initiation failed" });
  } catch (error) {
    console.error("❌ Payment init error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const paymentSuccess = async (req, res) => {
  const { tran_id, appointmentId } = req.params;
  const frontendUrl = getFrontendUrl(req);

  try {
    let appointment = null;

    if (appointmentId) {
      appointment = await appointmentModel.findById(appointmentId);
    }

    if (!appointment) {
      appointment = await appointmentModel.findOne({ "paymentInfo.tran_id": tran_id });
    }

    if (appointment) {
      appointment.payment = true;
      appointment.paymentMethod = "online";
      appointment.paymentInfo = {
        tran_id,
        paid_at: new Date(),
      };
      await appointment.save();
      console.log("✅ Payment recorded for appointment:", appointmentId || tran_id);
    } else {
      console.warn("⚠️ Payment success but appointment not found.");
    }

    return res.send(`
      <html>
        <head>
          <title>Payment Success</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #e6f4ea;
              color: #2e7d32;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            h1 {
              font-size: 3rem;
              margin-bottom: 12px;
              text-shadow: 1px 1px 4px rgba(46, 125, 50, 0.4);
            }
            p {
              font-size: 1.3rem;
              margin-bottom: 30px;
              max-width: 400px;
            }
            button {
              background-color: #4caf50;
              color: white;
              padding: 14px 28px;
              font-size: 1.1rem;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              box-shadow: 0 4px 8px rgba(76, 175, 80, 0.5);
              transition: background-color 0.3s ease, box-shadow 0.3s ease;
              user-select: none;
            }
            button:hover {
              background-color: #388e3c;
              box-shadow: 0 6px 12px rgba(56, 142, 60, 0.7);
            }
            @media (max-width: 480px) {
              h1 {
                font-size: 2.2rem;
              }
              p {
                font-size: 1.1rem;
                max-width: 90%;
              }
              button {
                width: 100%;
                padding: 16px 0;
                font-size: 1.2rem;
              }
            }
          </style>
        </head>
        <body>
          <h1>Payment Successful! 🎉</h1>
          <p>Your payment was processed successfully.</p>
          <button onclick="window.location.href='${frontendUrl}/my-appointment'">
            Go to My Appointments
          </button>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("❌ Error processing payment success:", error.message);
    return res.redirect(`${frontendUrl}/payment-success`);
  }
};

export const paymentFail = (req, res) => {
  const frontendUrl = getFrontendUrl(req); // Make sure this function is defined correctly

  console.log("❌ Payment failed");

  return res.send(`
    <html>
      <head>
        <title>Payment Failed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #fff5f5;
            color: #b00020;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
          }
          h1 {
            font-size: 3rem;
            margin-bottom: 12px;
            text-shadow: 1px 1px 3px rgba(176, 0, 32, 0.4);
          }
          p {
            font-size: 1.25rem;
            margin-bottom: 30px;
            max-width: 400px;
          }
          a.button {
            display: inline-block;
            background-color: #b00020;
            color: white;
            padding: 14px 28px;
            font-size: 1.1rem;
            text-decoration: none;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(176, 0, 32, 0.4);
            transition: background-color 0.3s ease, box-shadow 0.3s ease;
            user-select: none;
          }
          a.button:hover {
            background-color: #d32f2f;
            box-shadow: 0 6px 12px rgba(211, 47, 47, 0.6);
          }
          @media (max-width: 480px) {
            h1 {
              font-size: 2.2rem;
            }
            p {
              font-size: 1.1rem;
              max-width: 90%;
            }
            a.button {
              width: 100%;
              padding: 16px 0;
              font-size: 1.2rem;
              display: block;
            }
          }
        </style>
      </head>
      <body>
        <h1>❌ Payment Failed</h1>
        <p>Unfortunately, your payment could not be completed. Please try again or contact support if the issue persists.</p>
        <a class="button" href="${frontendUrl}/appointments">Go to My Appointments</a>
      </body>
    </html>
  `);
};



export const paymentCancel = (req, res) => {
  console.log("❌ Payment canceled");
  const frontendUrl = getFrontendUrl(req);
  res.redirect(`${frontendUrl}/payment-cancel`);
};

export const paymentIPN = (req, res) => {
  console.log("📩 IPN received:", req.body);
  res.status(200).json({ status: "received" });
};

export const testUrls = (req, res) => {
  const backendUrl = getBackendUrl(req);
  const frontendUrl = getFrontendUrl(req);

  return res.status(200).json({
    backendUrl,
    frontendUrl,
    envBackendUrl: BACKEND_URL,
    envFrontendUrl: FRONTEND_URL,
    host: req.headers.host,
    protocol: req.protocol,
    origin: req.headers.origin || '',
    referer: req.headers.referer || '',
  });
};
