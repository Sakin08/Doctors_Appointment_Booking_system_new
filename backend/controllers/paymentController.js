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

// Function to dynamically determine the backend URL
const getBackendUrl = (req) => {
  try {
    // Check if deployed
    if (req && req.headers && req.headers.host && !req.headers.host.includes('localhost')) {
      // We're in production - use the current host
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      return `${protocol}://${req.headers.host}`;
    }
  } catch (error) {
    console.error('Error determining backend URL:', error);
    // Continue to fallback
  }
  
  // Fallback to environment variable or default for local development
  return BACKEND_URL || 'http://localhost:4000';
};

// Function to dynamically determine the frontend URL
const getFrontendUrl = (req) => {
  try {
    // For production - detect based on origin or host
    const origin = req && req.headers ? (req.headers.origin || req.headers.referer) : null;
    
    if (origin && typeof origin === 'string' && origin.startsWith('http') && !origin.includes('localhost')) {
      try {
        // Extract origin from headers
        const url = new URL(origin);
        return `${url.protocol}//${url.host}`;
      } catch (e) {
        console.error('Error parsing origin URL:', e);
        // Continue to next detection method
      }
    }
    
    // Check if backend host is available and not localhost
    if (req && req.headers && req.headers.host && !req.headers.host.includes('localhost')) {
      // Guess frontend URL by replacing api subdomain or using the same domain
      const host = req.headers.host;
      if (host.includes('api.')) {
        // If backend is api.example.com, frontend is probably example.com
        return `https://${host.replace('api.', '')}`;
      } else {
        // Otherwise use same domain (frontend might be on a different path)
        return `https://${host}`;
      }
    }
  } catch (error) {
    console.error('Error determining frontend URL:', error);
    // Continue to fallback
  }
  
  // Fallback to environment variable or default for local development
  return FRONTEND_URL || 'http://localhost:5173';
};

export const initPayment = async (req, res) => {
  const { name, email, phone, amount, appointmentId } = req.body;
  
  try {
    // Get backend URL with fallback
    const backendUrl = getBackendUrl(req);
    
    // Check if we have a valid backend URL
    if (!backendUrl || !backendUrl.includes('://')) {
      console.error('Invalid backend URL:', backendUrl);
      return res.status(500).json({ 
        success: false, 
        message: "Invalid server configuration" 
      });
    }

    const tran_id = `txn_${Math.floor(Math.random() * 1000000000)}`;
    const data = {
      total_amount: amount || 500,
      currency: "BDT",
      tran_id,
      // Include appointmentId in success URL for direct access
      success_url: appointmentId 
        ? `${backendUrl}/api/payment/success/${tran_id}/${appointmentId}`
        : `${backendUrl}/api/payment/success/${tran_id}`,
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

    // Log the URLs for debugging
    console.log('Payment callback URLs:', {
      success_url: data.success_url,
      fail_url: data.fail_url,
      cancel_url: data.cancel_url
    });

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
      return res.status(500).json({ 
        success: false, 
        message: "SSLCommerz payment initiation failed" 
      });
    }
  } catch (error) {
    console.error("Payment init error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Something went wrong", 
      error: error.message 
    });
  }
};

export const paymentSuccess = async (req, res) => {
  const { tran_id, appointmentId } = req.params;
  const frontendUrl = getFrontendUrl(req);
  
  try {
    // Check if we have an appointment ID directly from the URL
    let appointment;
    
    if (appointmentId) {
      console.log(`🔍 Looking for appointment by ID: ${appointmentId}`);
      appointment = await appointmentModel.findById(appointmentId);
    } 
    
    // Fallback: Try finding by transaction ID if no appointment found
    if (!appointment) {
      console.log(`🔍 Looking for appointment by transaction ID: ${tran_id}`);
      appointment = await appointmentModel.findOne({
        "paymentInfo.tran_id": tran_id
      });
    }

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
      console.log("❌ Payment successful but no matching appointment found. Transaction ID:", tran_id);
    }

    res.redirect(`${frontendUrl}/payment-success`);
  } catch (error) {
    console.error("Error updating appointment payment status:", error);
    res.redirect(`${frontendUrl}/payment-success`);
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

// Test endpoint to verify URL detection
export const testUrls = (req, res) => {
  try {
    const backendUrl = getBackendUrl(req);
    const frontendUrl = getFrontendUrl(req);
    
    return res.status(200).json({
      success: true,
      urls: {
        detectedBackendUrl: backendUrl,
        detectedFrontendUrl: frontendUrl,
        envBackendUrl: BACKEND_URL || 'not set',
        envFrontendUrl: FRONTEND_URL || 'not set',
        nodeEnv: process.env.NODE_ENV || 'not set',
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
      }
    });
  } catch (error) {
    console.error('Error in test URLs endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing URLs',
      error: error.message
    });
  }
};
