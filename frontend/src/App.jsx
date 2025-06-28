import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'

// Import all your page components
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Doctors from './pages/Doctors'
import MyProfile from './pages/MyProfile'
import MyAppointment from './pages/MyAppointment'
import AppointmentHistory from './pages/AppointmentHistory'
import Login from './pages/Login'
import Appointment from './pages/Appointment'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

const App = () => {
  return (
    <>
      {/* Global Toast and Fixed Navbar */}
      <ToastContainer />
      <Navbar />

      {/* Main Page Content with Padding for Fixed Navbar */}
      <div className="pt-24 px-4 sm:px-[10%]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:speciality" element={<Doctors />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/my-appointment" element={<MyAppointment />} />
          <Route path="/appointment-history" element={<AppointmentHistory />} />
          <Route path="/login" element={<Login />} />
          <Route path="/appointment/:docId" element={<Appointment />} />
        </Routes>
        <Footer />
      </div>
    </>
  )
}

export default App
