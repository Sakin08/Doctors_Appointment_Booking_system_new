import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from 'axios';

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currencySymbol = '৳';
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Load token initially from localStorage (or false if none)
  const [token, setToken] = useState(localStorage.getItem('token') || false);
  const [doctors, setDoctors] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);

  const [userData, setUserData] = useState(false);

  // Whenever token changes, sync it to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const getDoctorsData = async () => {
    try {
      // Get all doctors (sorted by appointment count)
      const { data } = await axios.get(backendUrl + '/api/doctor/list');
      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }

      // Get top doctors with appointment counts
      const topData = await axios.get(backendUrl + '/api/doctor/top-doctors');
      if (topData.data.success) {
        setTopDoctors(topData.data.doctors);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const loadUserProfileData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/get-profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        setUserData(data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const value = {
    doctors,
    topDoctors,
    currencySymbol,
    backendUrl,
    token,
    setToken,
    userData,
    setUserData,
    loadUserProfileData
  };

  useEffect(() => {
    // Initial fetch
    getDoctorsData();

    // Set up polling every 10 seconds to keep doctor availability up-to-date
    const interval = setInterval(() => {
      getDoctorsData();
    }, 10000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (token) {
      loadUserProfileData();
    } else {
      setUserData(false);
    }
  }, [token]);

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
