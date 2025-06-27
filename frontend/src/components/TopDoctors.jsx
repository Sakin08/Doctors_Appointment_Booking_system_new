import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';

const TopDoctors = () => {
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);

  const handleNavigate = (path) => {
    window.scrollTo(0, 0);
    navigate(path);
  };

  return (
    <div className="px-6 py-12 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-extrabold text-blue-900 mb-4 text-center tracking-wide"
      >
        Top Doctors to Book
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center text-blue-700 max-w-3xl mx-auto mb-12 text-lg font-light leading-relaxed"
      >
        Browse our trusted doctors and schedule your appointment effortlessly.
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {doctors.slice(0, 10).map((item, index) => (
          <motion.div
            key={index}
            onClick={() => handleNavigate(`/appointment/${item._id}`)}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center cursor-pointer 
                       transition-all duration-300 hover:shadow-2xl hover:border-blue-500 border border-transparent"
          >
            <motion.img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="h-28 w-28 object-cover rounded-full mb-5 border-4 border-blue-200 hover:border-green-400 transition-colors duration-300"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <div className="text-center">
              <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-3 shadow-sm">
                ✅ Available
              </span>
              <h2 className="text-xl font-bold text-blue-900 mb-1">{item.name}</h2>
              <p className="text-sm text-gray-600">{item.speciality}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="flex justify-center mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.button
          onClick={() => handleNavigate('/doctors')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-full font-semibold
                     shadow-lg hover:shadow-xl transition duration-300 ease-in-out cursor-pointer"
        >
          More
        </motion.button>
      </motion.div>
    </div>
  );
};

export default TopDoctors;
