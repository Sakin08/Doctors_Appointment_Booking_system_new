import SSLCommerzPayment from "sslcommerz-lts";
import dotenv from "dotenv";
import appointmentModel from "../models/appointmentModel.js";

dotenv.config();

const {
  SSLCZ_STORE_ID,
  SSLCZ_STORE_PASS,
  SSLCZ_IS_LIVE,
} = process.env;

// ✅ Dynamic backend URL (no BACKEND_URL from .env)
const getBackendUrl = (req) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers.host;
    if (host && !host.includes('localhost')) {
      return `${protocol}://${host}`;
    }
  } catch (error) {
    console.error("Error detecting backend URL:", error.message);
  }
  return 'http://localhost:4000';
};

// ✅ Dynamic frontend URL (no FRONTEND_URL from .env)
const getFrontendUrl = (req) => {
  try {
    const origin = req.headers?.origin || req.headers?.referer || '';
    if (origin?.startsWith("http") && !origin.includes("localhost")) {
      return new URL(origin).origin;
    }
  } catch (error) {
    console.error("Error detecting frontend URL:", error.message);
  }
  return 'http://localhost:5173';
};

// ✅ Initiate Payment
export const initPayment = async (req, res) => {
  const { name, email, phone, amount, appointmentId } = req.body;

  try {
    const backendUrl = getBackendUrl(req);
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

    // Save transaction ID to appointment
    if (appointmentId) {
      const appointment = await appointmentModel.findById(appointmentId);
      if (appointment) {
        appointment.paymentInfo = { tran_id };
        await appointment.save();
      }
    }

    const sslcz = new SSLCommerzPayment(
      SSLCZ_STORE_ID,
      SSLCZ_STORE_PASS,
      SSLCZ_IS_LIVE === 'true'
    );
    const apiResponse = await sslcz.init(data);

    if (apiResponse?.GatewayPageURL) {
      return res.status(200).json({ url: apiResponse.GatewayPageURL });
    }

    return res.status(500).json({ message: "SSLCommerz payment initiation failed" });
  } catch (error) {
    console.error("❌ Payment init error:", error.message);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ✅ Payment Success
export const paymentSuccess = async (req, res) => {
  const { tran_id, appointmentId } = req.params;
  const frontendUrl = getFrontendUrl(req);

  try {
    let appointment = appointmentId
      ? await appointmentModel.findById(appointmentId)
      : await appointmentModel.findOne({ "paymentInfo.tran_id": tran_id });

    if (appointment) {
      appointment.payment = true;
      appointment.paymentMethod = "online";
      appointment.paymentInfo = {
        tran_id,
        paid_at: new Date(),
      };
      await appointment.save();
    }

    return res.redirect(`${frontendUrl}/payment-success`);
  } catch (error) {
    console.error("❌ Payment success error:", error.message);
    return res.redirect(`${frontendUrl}/payment-success`);
  }
};

// ✅ Payment Fail
export const paymentFail = (req, res) => {
  const frontendUrl = getFrontendUrl(req);
  return res.redirect(`${frontendUrl}/payment-fail`);
};

// ✅ Payment Cancel
export const paymentCancel = (req, res) => {
  const frontendUrl = getFrontendUrl(req);
  return res.redirect(`${frontendUrl}/payment-cancel`);
};

// ✅ SSLCommerz IPN
export const paymentIPN = (req, res) => {
  console.log("📩 IPN received:", req.body);
  res.status(200).json({ status: "received" });
};

// ✅ Test URL Detection
export const testUrls = (req, res) => {
  const backendUrl = getBackendUrl(req);
  const frontendUrl = getFrontendUrl(req);

  return res.status(200).json({
    backendUrl,
    frontendUrl,
    host: req.headers.host,
    origin: req.headers.origin || '',
    referer: req.headers.referer || '',
    protocol: req.protocol,
  });
};
