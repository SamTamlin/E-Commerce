const express = require('express')
const app = express()
const db = require('./db/index.js')
require('dotenv').config()


const port = process.env.PORT


app.get('/', (req, res) => {
    res.send('Hello World!')
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