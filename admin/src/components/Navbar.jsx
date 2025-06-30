import React, { useContext } from 'react';
import { assets } from '../assets/assets';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/DoctorContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
  const { aToken, setAToken } = useContext(AdminContext);
  const { dToken, setDToken } = useContext(DoctorContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (aToken) {
      localStorage.removeItem('aToken');
      setAToken(null);
    } else if (dToken) {
      localStorage.removeItem('dToken');
      setDToken(null);
    }
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        {/* Menu Button and Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <img src={assets.list_icon} alt="Menu" className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <img src={assets.admin_logo} alt="Logo" className="h-8 w-auto" />
            <span className="hidden sm:inline px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
              {aToken ? 'Admin' : 'Doctor'}
            </span>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white text-sm rounded-md font-medium hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
