import React from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { motion } from 'framer-motion';

const Banner = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/login');
    window.scrollTo(0, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-[300px] w-full bg-gradient-to-r from-blue-100 via-blue-50 to-white px-6 md:px-16 flex flex-col md:flex-row items-center justify-between gap-10 py-12 rounded-lg shadow-lg font-sans"
    >
      {/* Left Side */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-4"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 leading-snug">
          Book Appointment
        </h1>
        <p className="text-xl text-blue-700 font-semibold">
          With 100+ Trusted Doctors
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full shadow-md font-semibold transition duration-300"
        >
          Create Account
        </motion.button>
      </motion.div>

      {/* Right Side */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        className="md:w-1/2 flex justify-center"
      >
        <motion.img
          src={assets.appointment_img}
          alt="Appointment"
          className="max-w-full h-auto rounded-xl shadow-lg"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.4 }}
        />
      </motion.div>
    </motion.div>
  );
};

export default Banner;
