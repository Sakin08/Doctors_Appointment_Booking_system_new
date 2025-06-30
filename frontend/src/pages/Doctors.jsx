import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const Doctors = () => {
  const { speciality } = useParams();
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);
  const [filterDoc, setFilterDoc] = useState([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(true);

  const applyFilter = () => {
    if (speciality) {
      setFilterDoc(doctors.filter((doc) => doc.speciality === speciality));
    } else {
      setFilterDoc(doctors);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [doctors, speciality]);

  const handleSpecialityClick = (item) => {
    navigate(`/doctors/${item}`);
    if (window.innerWidth < 768) {
      setIsMobileFilterOpen(false); // Hide filter on mobile
    }
  };

  const handleDoctorClick = (doctor) => {
    if (!doctor.available) return;
    navigate(`/appointment/${doctor._id}`);
  };

  const specialities = [
    'General Physician',
    'Pediatrician',
    'Gynecologist',
    'Dermatologist',
    'ENT Specialist',
    'Ophthalmologist',
    'Dentist',
    'Cardiologist',
    'Neurologist',
    'Gastroenterologist',
    'Nephrologist',
    'Endocrinologist',
    'Pulmonologist',
    'General Surgeon',
    'Orthopedic Surgeon',
    'Urologist',
    'Psychiatrist',
    'Oncologist',
    'Rheumatologist',
    'Infectious Disease Specialist',
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen px-4 py-6 gap-6 bg-gray-50">
      {/* MOBILE HEADER BUTTON */}
      {!isMobileFilterOpen && (
        <button
          className="md:hidden mb-4 self-start px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg shadow"
          onClick={() => setIsMobileFilterOpen(true)}
        >
          Change Filter
        </button>
      )}

      {/* SIDEBAR */}
      {(isMobileFilterOpen || window.innerWidth >= 768) && (
        <div className="md:w-1/4 w-full bg-white shadow rounded-lg p-4 md:sticky top-4">
          <h2 className="text-lg font-semibold mb-4 text-blue-800">Filter by Speciality</h2>
          <ul className="space-y-2 max-h-[70vh] overflow-y-auto">
            {specialities.map((item, i) => (
              <li
                key={i}
                onClick={() => handleSpecialityClick(item)}
                className={`cursor-pointer px-3 py-2 rounded-md text-sm transition-colors ${
                  item === speciality
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* DOCTOR GRID */}
      <div className="md:w-3/4 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="wait">
          {filterDoc.map((item) => (
            <motion.div
              key={item._id}
              onClick={() => handleDoctorClick(item)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className={`bg-white rounded-xl shadow p-5 flex flex-col items-center 
                ${item.available ? 'cursor-pointer hover:shadow-lg hover:scale-[1.03]' : 'opacity-60'} 
                transition-transform duration-300 ease-in-out`}
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-24 w-24 object-cover rounded-full mb-4 border-4 border-blue-100"
              />
              <div className="w-full text-center">
                <div className="mb-2">
                  <span
                    className={`inline-block text-xs font-semibold px-3 py-1 rounded-full
                      ${item.available
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                      }`}
                  >
                    {item.available ? 'Available' : 'Not Available'}
                  </span>
                </div>
                <p className="text-lg font-semibold text-blue-900">{item.name}</p>
                <p className="text-blue-600 text-sm">{item.speciality}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Doctors;
