import SSLCommerzPayment from "sslcommerz-lts";

const store_id = "sakin685442aa87347";
const store_passwd = "sakin685442aa87347@ssl";
const is_live = false; // use sandbox

export const initPayment = async (req, res) => {
  const { name, email, phone, amount } = req.body;

  const tran_id = `txn_${Math.floor(Math.random() * 1000000000)}`;
  const data = {
    total_amount: amount || 500,
    currency: "BDT",
    tran_id,
    success_url: `http://localhost:4000/api/payment/success/${tran_id}`,
    fail_url: "http://localhost:4000/api/payment/fail",
    cancel_url: "http://localhost:4000/api/payment/cancel",
    ipn_url: "http://localhost:4000/api/payment/ipn",
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
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
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

  // TODO: mark appointment as paid in database based on tran_id or session key

  return res.redirect("http://localhost:5173/payment-success"); // frontend thank-you page
};

export const paymentFail = (req, res) => {
  return res.redirect("http://localhost:5173/payment-fail");
};

export const paymentCancel = (req, res) => {
  return res.redirect("http://localhost:5173/payment-cancel");
};

export const paymentIPN = (req, res) => {
  // IPN (Instant Payment Notification) handling (optional)
  console.log("IPN received:", req.body);
  res.status(200).json({ status: "received" });
};
