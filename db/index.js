const Pool = require('pg').Pool;
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
});

// Salt and encrypt password
const passwordHash = async (password, saltRounds) => {
    try{
        const salt = await bcrypt.genSalt(saltRounds);
        return await bcrypt.hash(password, salt);
    }
    catch (err) {console.log(err);}
    return null;
};

// Decrypt password and compare input
const comparePasswords = async (password, hash) => {
    try {
        const matchFound = await bcrypt.compare(password, hash);
        return matchFound;
    }
    catch (err) {console.log(err);}
    return false;
};

// user_account
const createUser = async (req, res) => {
    // Inserts new user, salts and hashes password
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
                res.status(409).send(`Either the username or email already exist, please try again`);
            } else {
                res.status(201).json(results.rows[0]);
            }
        }
    )
};

// LocalStratagy Helper: Verify username and password for login
const getUsernamePassword = (username, password, done) => {
    pool.query(
        'SELECT username, id, password FROM user_account WHERE username = $1',
        [username],
        async (error, user) => {
            const correctPassword = await comparePasswords(password, user.rows[0].password);
            if(error) {
                return done(error);
            } else if(user.rows[0] < 1) {
                return done(null, false, {message: 'user does not exist'});
            } else if(correctPassword == false) {
                return done(null, false, {message: 'incorrect password'});
            } else {
                // return username and id for use in req.session.passport
                const username = user.rows[0].username;
                const id = user.rows[0].id;
                const info = {username, id};
                return done(null, info);
            }
        }
    )
};

const getUser = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: Please log in to view your account information');
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
                    res.status(200).json(results.rows[0]);
                }
            }
        );
    }
};

const updateUser = async (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: Please log in to edit your account information');
    } else {
        const {username} = req.session.passport.user;
        const {email, first_name, last_name, password} = req.body;
        const hashedPassword = await passwordHash(password, 10);
        pool.query(
            'UPDATE user_account\
            SET email = $1, first_name = $2, last_name = $3, password = $4\
            WHERE username = $5\
            RETURNING id, username, email, first_name, last_name',
            [email, first_name, last_name, hashedPassword, username],
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
                    res.status(200).json(results.rows[0]);
                }
            }
        )
    }
};

const deleteUser = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to delete your account!');
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
                    res.status(204).send('No content');
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
                res.status(404).send(`Product with an id of ${id} does not exist.`);
            } else {
                res.status(200).json(results.rows[0]);
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
                res.status(404).send(`Product with an id of ${id} does not exist`);
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
                res.status(204).send('No content');
            }
        }
    )
};


// order 
const getUserOrders = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged to view your orders.');
    } else {
        const {username} = req.session.passport.user;
        pool.query(
            'SELECT\
                customer_order.id as order_id,\
                SUM(product_order.quantity * product.price) AS order_total\
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
                    res.status(204).send(`There are no orders for account ${username}`);
                } else {
                    res.status(200).json(results.rows);
                }
            }
        )
    }
};

const getOrder = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to view your orders.');
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
                SUM(product_order.quantity * product.price) AS product_total\
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
                product_order.quantity\
                )\
            ORDER BY product_name ASC',
            [orderId, id],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                } else if(results.rows.length < 1) {
                    res.status(404).send(
                        `Order with an id of ${orderId} does not exist on this account.`);
                } else {
                    res.status(200).json(results.rows);
                }
            }
        )
    }
};


// basket
const getUserBaskets = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged to view your basket.');
    } else {
        const {username} = req.session.passport.user;
        pool.query(
            'SELECT\
                customer_basket.id as basket_id,\
                SUM(product_basket.quantity * product.price) AS basket_total\
            FROM customer_basket\
            JOIN product_basket\
                ON customer_basket.id = product_basket.customer_basket_id\
            JOIN product\
                ON product_basket.product_id = product.id\
            JOIN user_account\
                ON customer_basket.user_account_id = user_account.id\
            WHERE user_account.username = $1\
            GROUP BY customer_basket.id;',
            [username],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                } else if(results.rows.length < 1) {
                    res.status(204).send(`There are no baskets for account ${username}`);
                } else {
                    res.status(200).json(results.rows);
                }
            }
        )
    }
};

const createNewBasket = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to create a new basket.');
    } else {
        const {id} = req.session.passport.user;
        pool.query(
            'INSERT INTO customer_basket (user_account_id)\
            VALUES ($1)\
            RETURNING\
                id AS basket_id',
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

const getBasket = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to view your basket.');
    } else {
        const {basketId} = req.params;
        const {id} = req.session.passport.user;
        pool.query(
            'SELECT\
                product_basket.customer_basket_id AS basket_id,\
                product.id AS product_id,\
                product.name AS product_name,\
                product.price AS price,\
                product_basket.quantity AS quantity,\
                SUM(product_basket.quantity * product.price) AS product_total\
            FROM product_basket\
            JOIN product\
                ON product_basket.product_id = product.id\
            JOIN customer_basket\
                ON product_basket.customer_basket_id = customer_basket.id\
            JOIN user_account\
            ON customer_basket.user_account_id = user_account.id\
            WHERE customer_basket_id = $1 AND user_account.id = $2\
            GROUP BY (\
                product_basket.customer_basket_id,\
                product.id,\
                product.name,\
                product.price,\
                product_basket.quantity\
                )\
            ORDER BY product_id ASC',
            [basketId, id],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                } else if(results.rows.length < 1) {
                    res.status(404).send(
                        `Basket with an id of ${basketId} does not exist on this account.`);
                } else {
                    res.status(200).json(results.rows);
                }
            }
        )
    }
};

const deleteBasket = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to delete a basket.');
    } else {
        const {id} = req.session.passport.user;
        const {basketId} = req.params;
        pool.query(
            'DELETE FROM customer_basket\
            WHERE id = $1 AND user_account_id = $2\
            RETURNING *',
            [basketId, id],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                }
                res.status(204).send('No content');
            }
        )
    }
};

const addProductToBasket = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to edit a basket.');
    } else {
        const {basketId} = req.params;
        const {product_id, quantity} = req.body;
        pool.query(
            'INSERT INTO product_basket(customer_basket_id, product_id, quantity)\
            VALUES($1, $2, $3)\
            ON CONFLICT (customer_basket_id, product_id) DO NOTHING RETURNING *;',
            [basketId, product_id, quantity],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                } else if(results.rows < 1) {
                    res.status(404).send(
                        `Product_id ${product_id} already exists in basketId ${basketId},\
                         no change has been made`);
                } else {
                    res.status(200).redirect(`/account/basket/${basketId}`);
                }
            }
        )
    }
};

const editProductQty = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to edit a basket.');
    } else {
        const {basketId} = req.params;
        const {product_id, quantity} = req.body;
        pool.query(
            'UPDATE product_basket\
            SET quantity = $1\
            WHERE customer_basket_id = $2 AND product_id = $3\
            RETURNING *',
            [quantity, basketId, product_id],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                } else if(results.rows < 1) {
                    res.status(404).send(
                        `Product_id ${product_id} does not exist in basketId ${basketId},\
                         no change has been made`);
                } else {
                    res.status(200).redirect(`/account/basket/${basketId}`);
                }
            }
        )
    }
};

const deleteProductFromBasket = (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to delete an item from a basket.');
    } else {
        const {id} = req.session.passport.user;
        const {basketId} = req.params;
        const {product_id} = req.body
        pool.query(
            'DELETE FROM product_basket\
            WHERE customer_basket_id = $1 AND product_id = $2;',
            [basketId, product_id],
            (error, results) => {
                if(error) {
                    console.log(error);
                    res.status(500).send('Internal server error');
                }
                res.status(204).send('No content');
            }
        )
    }
}

const checkout = async (req, res) => {
    if(typeof req.session.passport == 'undefined') {
        res.status(401).send('Unauthorized: You must be logged in to checkout.');
    } else {
        // Connect to a client
        const client = await pool.connect();
        const {id, username} = req.session.passport.user;
        const {basketId} = req.params;
        let order_processed = false;
        try {
            // Begin the transaction
            await client.query('BEGIN');

            // Get data on basket to move to order
            const customerBasketSelectText =
                'SELECT id AS order_id, product_id, quantity\
                FROM customer_basket\
                JOIN product_basket\
                    ON customer_basket.id = product_basket.customer_basket_id\
                WHERE customer_basket.id = $1 AND user_account_id = $2';
            const customerBasketResult = await client.query(customerBasketSelectText, [basketId, id]);
            console.log(customerBasketResult);
            if(customerBasketResult.rows.length >= 1) {
                // Copy contents of customer_basket into customer_order
                const customerOrderQueryText = 
                    'INSERT INTO customer_order (id, user_account_id) VALUES ($1, $2)';
                await client.query(customerOrderQueryText, [basketId, id]);

                // Copy contents of product_basket into product_order 
                const productOrderQueryText = 
                    'INSERT INTO product_order (customer_order_id, product_id, quantity)\
                        VALUES ($1, $2, $3)';
                // Copy each row from first query
                customerBasketResult.rows.forEach(async(row) => {
                    await client.query(productOrderQueryText, [basketId, row.product_id, row.quantity]);
                });
                // Delete product_basket rows
                const productBasketQueryText = 
                    'DELETE FROM product_basket\
                    WHERE customer_basket_id = $1 AND product_id = $2';
                // Delete each row from first query
                customerBasketResult.rows.forEach(async(row) => {
                    await client.query(productBasketQueryText, [basketId, row.product_id]);
                })
                
                // Delete customer_basket row
                const customerBasketQueryText = 'DELETE FROM customer_basket WHERE id = $1';
                await client.query(customerBasketQueryText, [basketId]);

                // Commit the transaction
                order_processed = true;
                await client.query('COMMIT');
            }
        }
        catch (error) {
            // Rollback the transaction
            await client.query('ROLLBACK');
            console.log(error);
            res.status(500).send('Internal server error');
        } finally {
            // Disconnect from client
            client.release()
            if(!order_processed) {
                res.status(404).send(`basket_id ${basketId} does not exist for user ${username}.`);
            } else {
               res.status(200).send('Order is being processed');
            }
        }
    }
};

module.exports = {
    // Local Stratagy helper
    getUsernamePassword,
    // account endpoints
    createUser,
    getUser,
    
    updateUser,
    deleteUser,
    // product endpoints
    getProducts,
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct,
    //order endpoints
    getUserOrders,
    getOrder,
    // basket endpoints
    getUserBaskets,
    createNewBasket,
    getBasket,
    deleteBasket,
    addProductToBasket,
    editProductQty,
    deleteProductFromBasket,
    checkout,
};
