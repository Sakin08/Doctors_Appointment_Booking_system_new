import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const AppointmentHistory = () => {
  const { backendUrl, token } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null); // Track which appointment is being deleted

  const getAppointmentHistory = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        // Show all non-pending appointments (confirmed, completed, cancelled, missed)
        const historicalAppointments = data.appointments.filter(
          apt => apt.status !== 'pending'
        ).sort((a, b) => {
          // Sort by date, most recent first
          const [dayA, monthA, yearA] = a.slotDate.split('_');
          const [dayB, monthB, yearB] = b.slotDate.split('_');
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          return dateB - dateA;
        });
        setAppointments(historicalAppointments);
      } else {
        toast.error(data.message || "Failed to fetch appointment history");
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

  const handleDeleteAppointment = async (appointmentId) => {
    const confirmDelete = window.confirm("Are you sure you want to remove this appointment from history?");
    if (!confirmDelete) return;

    setDeleting(appointmentId);
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/user/delete-appointment/${appointmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
        toast.success(data.message || "Appointment removed from history successfully");
      } else {
        toast.error(data.message || "Failed to remove appointment");
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error(error.response?.data?.message || "Failed to remove appointment");
    } finally {
      setDeleting(null);
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
      getAppointmentHistory();
    } else {
      setAppointments([]);
      setLoading(false);
    }
  }, [token]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-4xl font-bold mb-10 text-center text-gray-800 underline underline-offset-8 decoration-indigo-500">
        Appointment History
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {appointments.length > 0 ? (
            appointments.map((item, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-white via-blue-50 to-blue-100 border border-blue-200 rounded-2xl shadow-lg p-6 flex gap-6 items-start transition-all duration-300 hover:shadow-2xl relative"
              >
                {/* Delete Button - Top Right */}
                <button
                  onClick={() => handleDeleteAppointment(item._id)}
                  disabled={deleting === item._id}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors duration-200"
                  title="Remove from history"
                >
                  {deleting === item._id ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Status Badge - Below Delete Button */}
                <div className="absolute top-14 right-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadgeClass(item.status)} capitalize`}>
                    {item.status}
                  </span>
                </div>

                {/* Doctor Image */}
                <div className="w-24 h-24 shrink-0">
                  <img
                    src={item.docData.image}
                    alt={item.docData.name}
                    className={`w-full h-full object-cover rounded-full border-4 ${
                      item.status === 'cancelled' 
                        ? 'border-gray-300 filter grayscale' 
                        : 'border-green-200'
                    } transition duration-300`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2">
                  <h3 className="text-2xl font-semibold text-gray-800">{item.docData.name}</h3>
                  <p className="text-indigo-600 font-medium">{item.docData.speciality}</p>
                  <div className="text-gray-700 text-sm mt-3 space-y-1">
                    <p><span className="font-semibold">Address:</span></p>
                    <p>{item.docData.address.line1}</p>
                    <p>{item.docData.address.line2}</p>
                  </div>

                  <div className="mt-4 bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg border border-gray-200 inline-flex items-center text-sm tracking-wide transform hover:bg-gray-100 transition-colors duration-200 ease-in-out">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatAppointmentDate(item.slotDate)}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{item.slotTime}</span>
                  </div>

                  {/* Payment Status */}
                  <div className="mt-4 text-sm">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full ${
                      item.payment ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {item.payment ? 'Paid Online' : 'Cash Payment'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-gray-500 text-lg">No appointment history found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentHistory; 