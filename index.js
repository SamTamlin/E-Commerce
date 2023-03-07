const express = require('express')
const app = express()
const db = require('./db/index.js')
require('dotenv').config()

const bodyParser = require('body-parser');

const port = process.env.PORT
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/account/register', (req, res, next) => {
  db.query('INSERT INTO user_account (email, first_name, last_name, password) VALUES($1, $2, $3, $4)',
    [req.body.email, req.body.first_name, req.body.last_name, req.body.password],
    (err, result) => {
      if (err) {
        return next(err)
      }
      res.status(200).send(req.body)
  })
})

app.get('/account/:id', (req, res, next) => {
    db.query('SELECT * FROM user_account WHERE id = $1', [req.params.id], (err, result) => {
      if (err) {
        return next(err)
      }
      res.send(result.rows[0])
    })
  })




app.listen(port, () => {
    console.log(`E-Commerce app listening on port ${port}`)
})