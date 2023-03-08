const Pool = require('pg').Pool;

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
});

// LocalStratagy Helper
const getUsernamePassword = (username, password, cb) => {
    pool.query(
        'SELECT username, password FROM user_account WHERE username = $1',
        [username],
        function(error, user) {
            if(error) {return cb(error)}
            if(!user) {return cb(null, false, {message: 'username does not exist'})}
            if (password != user.rows[0].password) {
                return cb(null, false, {message: 'incorrect password'})
            }
            return cb(null, user);
        }
    )
};


// user_account
const getUser = (req, res) => {
    const username = req.session.passport.user;
    pool.query(
        'SELECT * FROM user_account WHERE username = $1',
        [username],
        (error, results) => {
            if(error) {
                throw error
            }
            res.status(200).json(results.rows)
        }
    );
};

const createUser = (req, res) => {
    const {username, email, first_name, last_name, password} = req.body;
    pool.query(
        'INSERT INTO user_account (username, email, first_name, last_name, password) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [username, email, first_name, last_name, password],
        (error, results) => {
            if(error) {
                throw error
            } else if (!Array.isArray(results.rows) || results.rows.length < 1) {
                throw error
            }
            res.status(201).json(results.rows)
        }
    )
};

const updateUser = (req, res) => {
    const username = req.session.passport.user;
    const {email, first_name, last_name, password} = req.body;
    pool.query(
        'UPDATE user_account SET email = $1, first_name = $2, last_name = $3, password = $4 WHERE username = $5 RETURNING *',
        [email, first_name, last_name, password, username],
        (error, results) => {
            if(error) {
                throw error
            }
            if (typeof results.rows == 'undefined') {
                res.status(404).send('Resource not found');
            } else if (Array.isArray(results.rows) && results.rows.length < 1) {
                res.status(404).send('User not found');
            } else {
                res.status(200).json(results.rows)
            }
        }
    )
};

const deleteUser = (req, res) => {
    const username = req.session.passport.user;
    pool.query(
        'DELETE FROM user_account WHERE username = $1',
        [username],
        (error, results) => {
            if(error) {
                throw error
            }
            res.status(204).send('No content')
        }
    )
};

// product
const getProducts = (req, res) => {
    pool.query(
        'SELECT * FROM product',
        (error, results) => {
            if(error) {
                throw error
            }
            res.status(200).json(results.rows)
        }
    )
};

const createProduct = (req, res) => {
    const {name, price} = req.body;
    pool.query(
        // create product
        'INSERT INTO product (name, price) VALUES ($1, $2) RETURNING *',
        [name, price],
        (error, results) => {
            if(error) {
                throw error
            } else if (!Array.isArray(results.rows) || results.rows.length < 1) {
                throw error
            }
            pool.query(
                // return product with product_id
                'SELECT * FROM product WHERE name = $1',
                [name],
                (error, results) => {
                    if(error) {throw error}
                    res.status(201).json(results.rows)
                }
            )
        }
    )
};

const getProduct = (req, res) => {
    const {id} = req.params;
    pool.query(
        'SELECT * FROM product WHERE id = $1',
        [id],
        (error, results) => {
            if(error) {throw error}
            if(results.rows < 1) {
                res.status(404).send(`Product with an id of ${id} does not exist.`)
            } else {
                res.status(200).json(results.rows)
            }
        }
    )
};

const updateProduct = (req, res) => {
    const {id} = req.params;
    const {name, price} = req.body;
    pool.query(
        'UPDATE product SET name = $1, price = $2 WHERE id = $3 RETURNING *',
        [name, price, id],
        (error, results) => {
            if(error) {throw error}
            if (typeof results.rows == 'undefined') {
                res.status(404).send('Resource not found');
            } else if (Array.isArray(results.rows) && results.rows.length < 1) {
                res.status(404).send('Product not found');
            } else {
                res.status(200).json(results.rows)
            }
        }
    )
};

const deleteProduct = (req, res) => {
    const {id} = req.params;
    pool.query(
        'DELETE FROM product WHERE id = $1',
        [id],
        (error, results) => {
            if(error) {throw error}
            res.status(204).send('No content')
        }
    )
};

module.exports = {
    // Local Stratagy helper
    getUsernamePassword,
    // user_account
    getUser,
    createUser,
    updateUser,
    deleteUser,
    // product
    getProducts,
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct,
};
