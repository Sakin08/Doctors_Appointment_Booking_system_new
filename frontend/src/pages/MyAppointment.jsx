import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

const MyAppointment = () => {
  const { backendUrl, token } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const getUserAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        const pendingAppointments = data.appointments.filter(
          apt => apt.status === 'pending' && !apt.isConfirmed
        );
        setAppointments(pendingAppointments);
      } else {
        toast.error(data.message || "Failed to fetch appointments");
        setAppointments([]);
      }
    } catch (error) {
      console.error("Axios error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message || "An error occurred");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this appointment?");
    if (!confirmCancel) return;

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(data.message);
        setAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
      } else {
        toast.error(data.message || "Failed to cancel appointment");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const formatAppointmentDate = (dateString) => {
    const [day, month, year] = dateString.split('_');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleCashPayment = async (appointmentId) => {
    const confirmPay = window.confirm("Confirm payment with cash?");
    if (!confirmPay) return;

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/pay-cash`,
        { appointmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (data.success) {
        toast.success(data.message || "Payment recorded successfully");
        setAppointments(prev => 
          prev.map(apt => 
            apt._id === appointmentId ? { 
              ...apt, 
              payment: true,
              paymentMethod: 'cash',
              paymentInfo: {
                method: 'cash',
                recordedAt: new Date(),
                recordedBy: 'user'
              }
            } : apt
          )
        );
      } else {
        toast.error(data.message || "Failed to record payment");
      }
    } catch (error) {
      console.error("Cash payment error:", error);
      toast.error(error.response?.data?.message || "Failed to record payment");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'missed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppointments();
      const interval = setInterval(getUserAppointments, 30000);
      return () => clearInterval(interval);
    } else {
      setAppointments([]);
      setLoading(false);
    }
  }, [token]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-center text-gray-800 underline underline-offset-8 decoration-indigo-500">
        My Appointments
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          <AnimatePresence>
            {appointments.length > 0 ? (
              appointments.map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-gradient-to-br from-white via-blue-50 to-blue-100 border border-blue-200 rounded-2xl shadow-md hover:shadow-2xl p-6 flex flex-col sm:flex-row gap-4 sm:gap-6"
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadgeClass(item.status)} capitalize`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Image */}
                  <div className="shrink-0 mx-auto sm:mx-0 w-24 h-24">
                    <img
                      src={item.docData.image}
                      alt={item.docData.name}
                      className={`w-full h-full object-cover rounded-full border-4 ${
                        item.status === 'cancelled'
                          ? 'border-gray-300 grayscale'
                          : item.status === 'completed'
                          ? 'border-green-200'
                          : 'border-blue-200'
                      }`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <h3 className="text-xl font-semibold text-gray-800">{item.docData.name}</h3>
                    <p className="text-indigo-600 font-medium">{item.docData.speciality}</p>
                    <div className="text-gray-700 text-sm mt-2">
                      <p className="font-semibold">Address:</p>
                      <p>{item.docData.address.line1}</p>
                      <p>{item.docData.address.line2}</p>
                    </div>
                    <div className="mt-3 text-sm flex flex-wrap justify-center sm:justify-start items-center gap-2 text-gray-600 font-medium">
                      <span className="flex items-center gap-1">
                        📅 {formatAppointmentDate(item.slotDate)}
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="flex items-center gap-1">
                        ⏰ {item.slotTime}
                      </span>
                    </div>

                    {item.status === 'cancelled' && (
                      <p className="text-red-600 text-sm font-medium mt-2">
                        This appointment has been cancelled
                      </p>
                    )}
                    {item.status === 'completed' && (
                      <p className="text-green-600 text-sm font-medium mt-2">
                        Appointment completed successfully
                      </p>
                    )}
                    {item.status === 'confirmed' && (
                      <p className="text-blue-600 text-sm font-medium mt-2">
                        Appointment confirmed by doctor
                      </p>
                    )}
                    {item.status === 'missed' && (
                      <p className="text-orange-600 text-sm font-medium mt-2">
                        Appointment was missed
                      </p>
                    )}
                    
                    {/* Payment Status */}
                    {item.payment && (
                      <div className="mt-3 flex items-center">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-200 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          PAID
                        </span>
                        <span className="ml-2 text-gray-600 text-sm">
                          {item.paymentMethod === 'cash' ? 'Cash payment' : 
                           item.paymentMethod ? `Paid via ${item.paymentMethod}` : 
                           ' CASH Payment '}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex sm:flex-col flex-row gap-2 sm:mt-0 mt-4 justify-center sm:justify-end items-center">
                    {!item.payment && item.status === 'pending' && (
                      <button  
                        onClick={() => handleCashPayment(item._id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm shadow-md transition">
                        Pay Cash
                      </button>
                    )}
                    {item.status === 'pending' && (
                      <button
                        onClick={() => handleCancelAppointment(item._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm shadow-md transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                className="col-span-2 text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-gray-500 text-lg">No appointments found</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MyAppointment;
