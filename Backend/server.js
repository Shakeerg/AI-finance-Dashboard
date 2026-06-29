const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. Global Middlewares
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// 2. Health Check & Route Imports
// ==========================================
app.get('/health', (req, res) =>{
    res.status(200).json({status: 'healthy' , timestamp: newDate() });
});
// We will link our actual routes folder here in Phase 1 Day 3
// app.use('/api/v1/transactions', require('./routes/transactionRoutes'));

// ==========================================
// 3. Global Error Handling Middleware
// ==========================================
app.use((err, req, res, next) => {
    console.log('Backend Error Cache:' , err.stack);
    res.status(500).json({success:false, message: err.message ||'Internal Server Error Hook triggered.'});
});

// ==========================================
// 4. Server Initialization Listener
// ==========================================

app.listen(PORT, () => {console.log(`API Server Engine operational on PORT ${PORT}`)});