const express = require('express');
const pool = require('../scripts/db')
const cors = require('cors');
const router = express.Router();

const categoriesRouter = require('./categories')
router.use('/category', categoriesRouter);

const corsOptions = {
  origin: 'http://localhost:5173',  // Разрешаем запросы с этого домена
  methods: ['GET'],  // Разрешаем только GET-запросы
  credentials: true,  // Разрешаем отправку cookies
  allowedHeaders: ['Content-Type'],
  exposedHeaders: ['Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 200,
  // strict-origin-when-cross-origin: позволяет делать запросы с определенного источника,
  // если запрос сделан с другого источника.
};

router.use(cors(corsOptions));

/* GET all products */
router.get('/', async (req, res, next) => {
  try {
    // Perform the SQL query to retrieve all products along with category and rating
    const query = `
      SELECT p.id_product, p.product_name, p.price, p.description, p.image,
             c.category_name, r.rate, r.rating_count
      FROM Product p
      JOIN Category c ON p.id_category = c.id_category
      LEFT JOIN Rating r ON p.id_rating = r.id_rating;
    `;

    const result = await pool.query(query);  // Run the query using your db pool

    // Map the query result rows to the desired format
    const products = result.rows.map((product) => ({
      id: Number(product.id_product),  // Ensure 'id' is a number
      title: product.product_name,  // Map 'product_name' to 'title'
      price: parseFloat(product.price),  // Ensure 'price' is a number
      description: product.description,
      category: product.category_name,  // Map 'category_name' to 'category'
      image: product.image,
      rating: {
        rate: parseFloat(product.rate) || 0,  // Ensure 'rate' is a number, fallback to 0
        count: Number(product.rating_count) || 0  // Ensure 'count' is an integer, fallback to 0
      }
    }));

    // Send the response
    res.json(products);  // Respond with the mapped products
  } catch (err) {
    console.error('Error retrieving products:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/* GET product by ID */
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;  // Extract product ID from URL parameters

  try {
    // SQL query to retrieve a single product by its ID, along with category and rating
    const query = `
      SELECT p.id_product, p.product_name, p.price, p.description, p.image,
             c.category_name, r.rate, r.rating_count
      FROM Product p
      JOIN Category c ON p.id_category = c.id_category
      LEFT JOIN Rating r ON p.id_rating = r.id_rating
      WHERE p.id_product = $1;
    `;

    // Execute the query, passing the product ID as a parameter to prevent SQL injection
    const result = await pool.query(query, [id]);

    // Check if the product was found
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });  // Return a 404 if no product found
    }

    // Map the result row to the desired format
    const product = result.rows[0];  // We expect only one product to be returned

    const formattedProduct = {
      id: Number(product.id_product),
      title: product.product_name,
      price: parseFloat(product.price),
      description: product.description,
      category: product.category_name,
      image: product.image,
      rating: {
        rate: parseFloat(product.rate) || 0,
        count: Number(product.rating_count) || 0
      }
    };

    // Send the formatted product as JSON
    res.json(formattedProduct);
  } catch (err) {
    console.error('Error retrieving product by ID:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
