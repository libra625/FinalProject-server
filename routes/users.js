const express = require('express');
const pool = require('../scripts/db')
const cors = require('cors');
const bcrypt = require('bcryptjs');
const router = express.Router();

const corsOptions = {
  origin: 'http://localhost:5173',  // Разрешаем запросы с этого домена
  methods: ['GET', 'POST'],  // Разрешаем только GET-запросы
  credentials: true,  // Разрешаем отправку cookies
  allowedHeaders: ['Content-Type'],
  exposedHeaders: ['Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 200,
  // strict-origin-when-cross-origin: позволяет делать запросы с определенного источника,
  // если запрос сделан с другого источника.
};

router.use(cors(corsOptions));

// Login route
router.get('/', async (req, res) => {
  try {
    // Query to fetch all users excluding the password column
    const result = await pool.query('SELECT id_customer, first_name, last_name, phone_number, email, role FROM Customer');

    // Send the result as the response
    res.status(200).json(result.rows); // Send the array of users
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body)

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if the user exists in the database
    const result = await pool.query('SELECT * FROM Customer WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the stored hashed password from the database
    const user = result.rows[0];

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'mismatch' });
    }

    // If the user exists and the password matches, return a success message
    res.status(200).json({ message: 'EXISTS AND MATCHES' , role : user.role, first_name: user.first_name});

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password } = req.body;

  // Validate input fields
  if (!firstName || !lastName || !email || !phoneNumber || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if the email already exists
    const result = await pool.query('SELECT * FROM Customer WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store the new user in the database
    const newUser = await pool.query(
        'INSERT INTO Customer (first_name, last_name, phone_number, password, email, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_customer, first_name, last_name, email, phone_number, role',
        [firstName, lastName, phoneNumber, hashedPassword, email, 'user']
    );

    // Return success message (you can exclude sensitive data like password here)
    res.status(201).json({ message: 'REGISTERED' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
