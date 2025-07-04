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

export const initPayment = async (req, res) => {
  const { name, email, phone, amount, appointmentId } = req.body;

  const tran_id = `txn_${Math.floor(Math.random() * 1000000000)}`;
  const data = {
    total_amount: amount || 500,
    currency: "BDT",
    tran_id,
    success_url: `${BACKEND_URL}/api/payment/success/${tran_id}`,
    fail_url: `${BACKEND_URL}/api/payment/fail`,
    cancel_url: `${BACKEND_URL}/api/payment/cancel`,
    ipn_url: `${BACKEND_URL}/api/payment/ipn`,
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

  try {
    // Store the transaction ID in the appointment record first
    if (appointmentId) {
      const appointment = await appointmentModel.findById(appointmentId);
      if (appointment) {
        if (!appointment.paymentInfo) {
          appointment.paymentInfo = {};
        }
        appointment.paymentInfo.tran_id = tran_id;
        await appointment.save();
      }
    }
    
    const sslcz = new SSLCommerzPayment(SSLCZ_STORE_ID, SSLCZ_STORE_PASS, SSLCZ_IS_LIVE === 'true');
    const apiResponse = await sslcz.init(data);

    if (apiResponse?.GatewayPageURL) {
      return res.status(200).json({ url: apiResponse.GatewayPageURL });
    } else {
      return res.status(500).json({ message: "SSLCommerz payment initiation failed" });
    }
  } catch (error) {
    console.error("Payment init error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const paymentSuccess = async (req, res) => {
  const { tran_id } = req.params;

  try {
    // Find the appointment by transaction ID (stored in paymentInfo)
    const appointment = await appointmentModel.findOne({
      "paymentInfo.tran_id": tran_id
    });

    if (appointment) {
      // Update the appointment payment status
      appointment.payment = true;
      appointment.paymentMethod = "online";
      
      // If paymentInfo doesn't exist yet, create it
      if (!appointment.paymentInfo) {
        appointment.paymentInfo = {};
      }
      
      // Store transaction info
      appointment.paymentInfo.tran_id = tran_id;
      appointment.paymentInfo.paid_at = new Date();
      
      await appointment.save();
      console.log("✅ Payment successful. Transaction ID:", tran_id, "Appointment updated");
    } else {
      console.log("✅ Payment successful but no matching appointment found. Transaction ID:", tran_id);
    }

    res.redirect(`${FRONTEND_URL}/payment-success`);
  } catch (error) {
    console.error("Error updating appointment payment status:", error);
    res.redirect(`${FRONTEND_URL}/payment-success`);
  }
};

export const paymentFail = (req, res) => {
  console.log("❌ Payment failed");
  res.redirect(`${FRONTEND_URL}/payment-fail`);
};

export const paymentCancel = (req, res) => {
  console.log("❌ Payment canceled");
  res.redirect(`${FRONTEND_URL}/payment-cancel`);
};

export const paymentIPN = (req, res) => {
  console.log("📩 IPN received:", req.body);
  res.status(200).json({ status: "received" });
};
