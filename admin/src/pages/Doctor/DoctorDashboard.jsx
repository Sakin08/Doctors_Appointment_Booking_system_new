import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FaUserAlt,
  FaCalendarCheck,
  FaCalendarTimes,
  FaCalendarAlt,
  FaClock,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaCheckCircle,
  FaSync,
} from 'react-icons/fa';

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium uppercase">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
  </div>
);

// Patient Avatar Component
const PatientAvatar = ({ patient }) => {
  if (!patient) return null;

  return (
    <div className="flex items-center">
      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
        {patient.image ? (
          <img
            src={patient.image}
            alt={patient.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <FaUserAlt className="h-5 w-5 text-blue-500" />
        )}
      </div>
      <div className="ml-4">
        <div className="text-sm font-medium text-gray-900">{patient.name || 'Unknown Patient'}</div>
        {patient.age && <div className="text-sm text-gray-500">{patient.age} years</div>}
        {patient.phone && <div className="text-xs text-gray-500">{patient.phone}</div>}
      </div>
    </div>
  );
};

const DoctorDashboard = () => {
  const { dToken, backendUrl } = useContext(DoctorContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    pendingAppointments: 0,
    todayAppointments: [],
    recentAppointments: []
  });
  const [processingAppointments, setProcessingAppointments] = useState(new Set());

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${backendUrl}/api/doctor/dashboard-stats`,
        { headers: { dtoken: dToken } }
      );
      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus, patientName) => {
    if (newStatus === 'cancelled') {
      toast.warn(
        <div>
          <p className="font-medium mb-2">Cancel Appointment?</p>
          <p className="text-sm mb-4">Are you sure you want to cancel the appointment with {patientName}?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                toast.dismiss();
                processStatusChange(appointmentId, newStatus);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Yes, Cancel
            </button>
            <button
              onClick={() => toast.dismiss()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              No, Keep
            </button>
          </div>
        </div>,
        {
          position: "top-center",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          closeButton: false,
          className: "confirmation-toast"
        }
      );
    } else {
      await processStatusChange(appointmentId, newStatus);
    }
  };

  const processStatusChange = async (appointmentId, newStatus) => {
    try {
      setProcessingAppointments(prev => new Set([...prev, appointmentId]));

      if (newStatus === 'confirmed') {
        const { data } = await axios.put(
          `${backendUrl}/api/doctor/confirm-appointment`,
          { appointmentId },
          { headers: { dtoken: dToken } }
        );
        
        if (data.success) {
          toast.success('Appointment confirmed successfully');
          await fetchDashboardStats();
        } else {
          toast.error(data.message || 'Failed to confirm appointment');
        }
      } else if (newStatus === 'completed') {
        const { data } = await axios.put(
          `${backendUrl}/api/doctor/complete-appointment`,
          { appointmentId, patientVisited: true },
          { headers: { dtoken: dToken } }
        );

        if (data.success) {
          toast.success('Appointment marked as completed');
          await fetchDashboardStats();
        } else {
          toast.error(data.message || 'Failed to complete appointment');
        }
      } else if (newStatus === 'cancelled') {
        const { data } = await axios.put(
          `${backendUrl}/api/doctor/cancel-appointment`,
          { appointmentId },
          { headers: { dtoken: dToken } }
        );

        if (data.success) {
          toast.success('Appointment cancelled successfully');
          await fetchDashboardStats();
        } else {
          toast.error(data.message || 'Failed to cancel appointment');
        }
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error(
        error.response?.data?.message || 
        'Failed to update appointment status. Please try again.'
      );
    } finally {
      setProcessingAppointments(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (dToken) {
      fetchDashboardStats();
      const refreshInterval = setInterval(fetchDashboardStats, 30000);
      return () => clearInterval(refreshInterval);
    }
  }, [dToken]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('_');
    return `${month}/${day}/${year}`;
  };

  const formatTime = (timeString) => {
    return timeString || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-b-4 border-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
            Doctor Dashboard
          </h1>
          <p className="mt-2 text-gray-600">Welcome back! Here's your practice overview</p>
          <div className="mt-1 h-1 w-24 bg-gradient-to-r from-blue-600 to-teal-500 mx-auto rounded-full"></div>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Appointments"
          value={stats.totalAppointments}
          icon={FaCalendarAlt}
          color="text-blue-600"
        />
        <StatCard
          title="Completed"
          value={stats.completedAppointments}
          icon={FaCalendarCheck}
          color="text-green-600"
        />
        <StatCard
          title="Confirmed"
          value={stats.confirmedAppointments}
          icon={FaCheckCircle}
          color="text-blue-600"
        />
        <StatCard
          title="Pending"
          value={stats.pendingAppointments}
          icon={FaClock}
          color="text-yellow-600"
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelledAppointments}
          icon={FaCalendarTimes}
          color="text-red-600"
        />
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Today's Appointments</h2>
          <button 
            onClick={fetchDashboardStats}
            className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <FaSync className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {stats.todayAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No appointments scheduled for today
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.todayAppointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PatientAvatar patient={appointment.userData} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(appointment.time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.paymentMode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {!appointment.isConfirmed && !appointment.isCompleted && !appointment.cancelled && (
                          <button
                            onClick={() => handleStatusChange(appointment._id, 'confirmed', appointment.patientName)}
                            disabled={processingAppointments.has(appointment._id)}
                            className={`flex items-center px-3 py-1 rounded-lg text-white text-sm transition-colors duration-200 ${
                              processingAppointments.has(appointment._id)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                          >
                            {processingAppointments.has(appointment._id) ? (
                              <FaSpinner className="animate-spin mr-1" />
                            ) : (
                              <FaCheck className="mr-1" />
                            )}
                            Confirm
                          </button>
                        )}
                        {appointment.isConfirmed && !appointment.isCompleted && !appointment.cancelled && (
                          <button
                            onClick={() => handleStatusChange(appointment._id, 'completed', appointment.patientName)}
                            disabled={processingAppointments.has(appointment._id)}
                            className={`flex items-center px-3 py-1 rounded-lg text-white text-sm transition-colors duration-200 ${
                              processingAppointments.has(appointment._id)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600'
                            }`}
                          >
                            {processingAppointments.has(appointment._id) ? (
                              <FaSpinner className="animate-spin mr-1" />
                            ) : (
                              <FaCheck className="mr-1" />
                            )}
                            Complete
                          </button>
                        )}
                        {!appointment.isCompleted && !appointment.cancelled && (
                          <button
                            onClick={() => handleStatusChange(appointment._id, 'cancelled', appointment.patientName)}
                            disabled={processingAppointments.has(appointment._id)}
                            className={`flex items-center px-3 py-1 rounded-lg text-white text-sm transition-colors duration-200 ${
                              processingAppointments.has(appointment._id)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600'
                            }`}
                          >
                            {processingAppointments.has(appointment._id) ? (
                              <FaSpinner className="animate-spin mr-1" />
                            ) : (
                              <FaTimes className="mr-1" />
                            )}
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Appointments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentAppointments.map((appointment) => (
                <tr key={appointment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PatientAvatar patient={appointment.userData} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(appointment.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(appointment.time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      appointment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;