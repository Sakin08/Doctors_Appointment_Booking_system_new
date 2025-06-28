import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Doctors = () => {
  const { speciality } = useParams();
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);
  const [filterDoc, setFilterDoc] = useState([]);

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

  const handleDoctorClick = (doctor) => {
    if (!doctor.available) {
      return; // Do nothing if doctor is unavailable
    }
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
    'Infectious Disease Specialist'
  ];

  return (
    <div className="flex min-h-screen px-4 py-6 gap-6">
      {/* LEFT SIDEBAR */}
      <div className="w-1/4 bg-white shadow-md rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 text-blue-800">Filter by Speciality</h2>
        <ul className="space-y-2">
          {specialities.map((item, i) => (
            <li
              key={i}
              onClick={() => navigate(`/doctors/${item}`)}
              className={`cursor-pointer px-3 py-2 rounded-md text-sm ${
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

      {/* RIGHT DOCTORS DISPLAY */}
      <div className="w-3/4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filterDoc.map((item, index) => (
          <div
            key={index}
            onClick={() => handleDoctorClick(item)}
            className={`bg-white rounded-xl shadow-md p-5 flex flex-col items-center 
              ${item.available ? 'cursor-pointer hover:shadow-xl hover:scale-[1.03]' : 'opacity-75'} 
              transition-transform duration-300 ease-in-out`}
          >
            <img
              src={item.image}
              alt={item.name}
              className="h-28 w-28 object-cover rounded-full mb-4 border-4 border-blue-100"
            />
            <div className="w-full text-center">
              <div className="mb-2">
                <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full
                  ${item.available 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.available ? 'Available' : 'Not Available'}
                </span>
              </div>
              <p className="text-xl font-semibold text-blue-900">{item.name}</p>
              <p className="text-blue-600 text-sm">{item.speciality}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Doctors;