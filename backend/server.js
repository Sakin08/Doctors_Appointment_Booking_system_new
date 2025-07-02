import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js'; // Add `.js` if using ES modules
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import userRouter from './routes/userRoute.js';
import uploadRouter from './routes/uploadRoute.js';
// Connect to MongoDB


// App config
const app = express();
const port = process.env.PORT || 4000;

connectDB()
connectCloudinary()
// Middleware
app.use(express.json());
// Enable CORS for all routes and origins
app.use(cors({
  origin: true,
  credentials: true
}));

//api endpoint
app.use('/api/admin',adminRouter)
app.use('/api/doctor',doctorRouter)
app.use('/api/user',userRouter)
app.use('/api/upload', uploadRouter)
//localhost:4000/api/admin

// Routes
app.get('/', (req, res) => {
  res.send('API working great ✅');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error: err.message
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
