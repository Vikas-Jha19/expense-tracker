// index.js
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const routes = require('./routes'); // Import routes
const { router: userRoutes } = require('./users'); // Import user routes

const app = express();
const db = new sqlite3.Database('expense-tracker.db'); // Initialize database

app.use(bodyParser.json()); // Middleware for JSON parsing

// Use the routes defined in routes.js
app.use('/api', routes); // Transaction routes
app.use('/api/users', userRoutes); // User routes for registration and login

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Handle SQLite DB close when application exits
process.on('SIGINT', () => {
    db.close();
    console.log('Database connection closed.');
    process.exit(0);
});
