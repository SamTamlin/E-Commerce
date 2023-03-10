const Pool = require('pg').Pool;
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
});

const passwordHash = async (password, saltRounds) => {
    try{
        const salt = await bcrypt.genSalt(saltRounds);
        return await bcrypt.hash(password, salt);
    }
    catch (err) {console.log(err);}
    return null;
};

const comparePasswords = async (password, hash) => {
    try {
        const matchFound = await bcrypt.compare(password, hash);
        return matchFound;
    }
    catch (err) {console.log(err);}
    return false;
};

// LocalStratagy Helper
const getUsernamePassword = (username, password, done) => {
    pool.query(
        'SELECT username, id, password FROM user_account WHERE username = $1',
        [username],
        function(error, user) {
            if(error) {return done(error)}
            if(!user.rows[0]) {return done(null, false, {message: 'user does not exist'})}
            if(!comparePasswords(password, user.rows[0].password)) {
                return done(null, false, {message: 'incorrect password'})
            }
            const username = user.rows[0].username;
            const id = user.rows[0].id;
            const info = {username, id};
            return done(null, info);
        }
    )
};


// user_account
const getUser = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: Please log in to view your account information')
    } 
    else {
        const {username} = req.session.passport.user;
        pool.query(
            'SELECT id, username, email, first_name, last_name\
            FROM user_account\
            WHERE username = $1',
            [username],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                } else {
                    res.status(200).json(results.rows);
                }
            }
        );
    }
};

const createUser = async (req, res) => {
    const {username, email, first_name, last_name, password} = req.body;
    const hashedPassword = await passwordHash(password, 10);
    pool.query(
        'INSERT INTO user_account (username, email, first_name, last_name, password)\
        VALUES ($1, $2, $3, $4, $5)\
        RETURNING id, username, email, first_name, last_name',
        [username, email, first_name, last_name, hashedPassword],
        (error, results) => {
            if(error) {
                console.log(error);
                res.status(409).send(`The username: ${username} already exists, please login`)
            } else {
                res.status(201).json(results.rows)
            }
        }
    )
};

const updateUser = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: Please log in to edit your account information')
    } else {
        const {username} = req.session.passport.user;
        const {email, first_name, last_name, password} = req.body;
        pool.query(
            'UPDATE user_account SET email = $1, first_name = $2, last_name = $3, password = $4 WHERE username = $5 RETURNING *',
            [email, first_name, last_name, password, username],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                }
                if (typeof results.rows == 'undefined') {
                    res.status(404).send('Resource not found');
                } else if (Array.isArray(results.rows) && results.rows.length < 1) {
                    res.status(404).send('User not found');
                } else {
                    res.status(200).json(results.rows[0])
                }
            }
        )
    }
};

const deleteUser = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to delete your account!')
    } else {
        const {username} = req.session.passport.user;
        pool.query(
            'DELETE FROM user_account WHERE username = $1',
            [username],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                } else {
                    res.status(204).redirect('/account/login')
                }
            }
        )
    }
};


// product
const getProducts = (req, res) => {
    pool.query(
        'SELECT * FROM product',
        (error, results) => {
            if(error) {
                console.log(error);
                res.status(500).send('Internal server error');
            } else {
                res.status(200).json(results.rows);
            }
        }
    )
};

const createProduct = (req, res) => {
    const {name, price} = req.body;
    pool.query(
        'INSERT INTO product (name, price) VALUES ($1, $2) RETURNING *',
        [name, price],
        (error, results) => {
            if(error) {
                console.log(error);
                res.status(500).send('Internal server error');
            } else {
                res.status(201).json(results.rows[0]);
            }
        }
    )
};

const getProduct = (req, res) => {
    const {id} = req.params;
    pool.query(
        'SELECT * FROM product WHERE id = $1',
        [id],
        (error, results) => {
            if(error) {
                console.log(error);
                res.status(500).send('Internal server error');
            } else if(results.rows.length < 1) {
                res.status(404).send(`Product with an id of ${id} does not exist.`)
            } else {
                res.status(200).json(results.rows[0])
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
            if(error) {
                console.log(error);
                res.status(500).send('Internal server error');
            } else if (typeof results.rows == 'undefined' || results.rows.length < 1) {
                res.status(404).send('Product not found');
            } else {
                res.status(200).json(results.rows[0]);
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
            if(error) {
                console.log(error);
                res.status(500).send('Internal server error');
            } else {
                res.status(204).send('No content')
            }
        }
    )
};


// order
const getUserOrders = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged to view your orders.')
    } else {
        const {username} = req.session.passport.user;
        pool.query(
            'SELECT\
                customer_order.id as order_id,\
                SUM(product_order.quantity * product.price) AS basket_total,\
                customer_order.transaction_complete AS payment_received\
            FROM customer_order\
            JOIN product_order\
                ON customer_order.id = product_order.customer_order_id\
            JOIN product\
                ON product_order.product_id = product.id\
            JOIN user_account\
                ON customer_order.user_account_id = user_account.id\
            WHERE user_account.username = $1\
            GROUP BY customer_order.id;',
            [username],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                } else if(results.rows.length < 1) {
                    res.status(204).send('No Content');
                } else {
                    res.status(200).json(results.rows)
                }
            }
        )
    }
};

const createNewOrder = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to create a new order.')
    } else {
        const {id} = req.session.passport.user;
        pool.query(
            'INSERT INTO customer_order (user_account_id, transaction_complete)\
            VALUES ($1, false)\
            RETURNING\
                id AS order_id,\
                transaction_complete',
            [id],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                } else {
                    res.status(200).json(results.rows[0]);
                }
            }
        )
    }
};

const getOrder = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to view your orders.')
    } else {
        const {orderId} = req.params;
        const {id} = req.session.passport.user;
        pool.query(
            'SELECT\
                product_order.customer_order_id AS order_id,\
                product.id AS product_id,\
                product.name AS product_name,\
                product.price AS price,\
                product_order.quantity AS quantity,\
                SUM(product_order.quantity * product.price) AS product_total,\
                customer_order.transaction_complete AS transaction_complete\
            FROM product_order\
            JOIN product\
                ON product_order.product_id = product.id\
            JOIN customer_order\
                ON product_order.customer_order_id = customer_order.id\
            JOIN user_account\
            ON customer_order.user_account_id = user_account.id\
            WHERE customer_order_id = $1 AND user_account.id = $2\
            GROUP BY (\
                product_order.customer_order_id,\
                product.id,\
                product.name,\
                product.price,\
                product_order.quantity,\
                customer_order.transaction_complete\
            )\
            ORDER BY product_name ASC',
            [orderId, id],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                } else if(results.rows.length < 1) {
                    res.status(404).send(`Order with an id of ${orderId} does not exist on this account.`)
                } else {
                    res.status(200).json(results.rows);
                }
            }
        )
    }
};

const editOrderQty = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to edit an order.')
    } else {
        const {orderId} = req.params;
        const {product_id, quantity} = req.body;
        pool.query(
            'UPDATE product_order\
            SET quantity = $1\
            WHERE customer_order_id = $2 AND product_id = $3;',
            [quantity, orderId, product_id],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                }
                res.status(200).redirect(`/account/order/${orderId}`)
            }
        )
    }
};

const addOrderProduct = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to edit an order.')
    } else {
        const {orderId} = req.params;
        const {product_id, quantity} = req.body;
        pool.query(
            'INSERT INTO product_order\
            VALUES($1, $2, $3);',
            [orderId, product_id, quantity],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                }
                res.status(200).redirect(`/account/order/${orderId}`)
            }
        )
    }
};

const checkoutOrder = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to checkout.')
    } else {
        const {id} = req.session.passport.user;
        const {orderId} = req.params;
        pool.query(
            'UPDATE customer_order\
            SET transaction_complete = true\
            WHERE id = $1 AND user_account_id = $2\
            RETURNING\
                id AS order_id,\
                transaction_complete',
            [orderId, id],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                }
                res.status(200).send(results.rows[0]);
            }
        )
    }
};

const deleteOrder = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to checkout.')
    } else {
        const {id} = req.session.passport.user;
        const {orderId} = req.params;
        pool.query(
            'DELETE FROM customer_order\
            WHERE id = $1 AND user_account_id = $2\
            RETURNING *',
            [orderId, id],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                }
                res.status(204).send(results.rows);
            }
        )
    }
};

module.exports = {
    // Local Stratagy helper
    getUsernamePassword,
    // account endpoint
    getUser,
    createUser,
    updateUser,
    deleteUser,
    // product endpoint
    getProducts,
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct,
    //order endpoint
    getUserOrders,
    createNewOrder,
    getOrder,
    editOrderQty,
    addOrderProduct,
    checkoutOrder,
    deleteOrder,
};
