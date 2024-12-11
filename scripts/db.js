// db.js
const { Pool } = require('pg');

// Create a new pool instance
const pool = new Pool({
    user: 'postgres',     // your database username
    host: 'localhost',          // database server (default: localhost)
    database: 'webstore',  // your database name
    password: '3455',  // your database password
    port: 5432,                 // default PostgreSQL port
});

// Export the pool for use in your app
module.exports = pool;
