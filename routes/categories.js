const express = require('express');
const pool = require('../scripts/db')
const cors = require('cors');
const router = express.Router();

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

/* GET home page. */
// router.get('/', function(req, res, next) {
//     res.send('categories route');
// });

router.get('/', async (req, res, next) => {
    try {
        // Query to fetch categories from the 'categories' table
        const result = await pool.query('SELECT category_name FROM Category'); // Assuming 'categories' table has 'id' and 'category_name'

        // Extract category names from the query result
        const categories = result.rows.map(row => row.category_name);

        // Send categories as JSON
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// TODO:change path or do smth else
// router.get('/:categoryId', (req, res) => {
//     const categoryId = req.params.categoryId; // Get the categoryId from the URL
//     res.send(`You are viewing category with ID: ${categoryId} Will be done soon`);
// });

// Route to get products by category name (e.g. /products/category/electronics?limit=10)
router.get('/:category', async (req, res) => {
    const { category } = req.params; // Get the category name from the URL
    const limit = parseInt(req.query.limit, 10); // Get the 'limit' query parameter

    try {
        // Query to fetch products by category name with rating information (join Product, Category, and Rating tables)
        let query = `
            SELECT p.id_product, p.product_name, p.image, p.price, p.description, r.rate, r.rating_count, c.category_name
            FROM Product p
                     JOIN Category c ON p.id_category = c.id_category
                     LEFT JOIN Rating r ON p.id_rating = r.id_rating
            WHERE c.category_name = $1
        `;
        let params = [category];

        // If a limit is specified, add it to the query
        if (limit) {
            query += ' LIMIT $2';
            params.push(limit); // Add the limit value to the parameters
        }

        // Execute the query
        const result = await pool.query(query, params);

        // Map the result rows to match the desired object structure
        const products = result.rows.map((product) => ({
            id: Number(product.id_product),  // Ensure 'id' is a number
            title: product.product_name,  // Map 'product_name' to 'title'
            price: parseFloat(product.price),  // Ensure 'price' is a number
            description: product.description,
            category: product.category_name, // Ensure 'category_name' is mapped to 'category'
            image: product.image,
            rating: {
                rate: parseFloat(product.rate) || 0,  // Ensure 'rate' is a number
                count: Number(product.rating_count) || 0  // Ensure 'count' is an integer (handle null or missing cases)
            }
        }));

        // Send the mapped products as a JSON response
        res.json(products);
    } catch (err) {
        console.error('Error fetching products for category:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




module.exports = router;