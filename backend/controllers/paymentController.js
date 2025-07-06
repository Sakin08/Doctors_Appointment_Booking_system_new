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
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            button {
              padding: 12px 24px;
              font-size: 18px;
              cursor: pointer;
              background-color: #4CAF50;
              color: white;
              border: none;
              border-radius: 5px;
              margin-top: 20px;
            }
            button:hover { background-color: #45a049; }
          </style>
        </head>
        <body>
          <h1>Payment Successful! 🎉</h1>
          <p>Your payment was processed successfully.</p>
          <button onclick="window.location.href='https://medicare-seven-sigma.vercel.app/my-appointment'">
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
  console.log("❌ Payment failed");
  const frontendUrl = getFrontendUrl(req);
  res.redirect(`${frontendUrl}/payment-fail`);
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
