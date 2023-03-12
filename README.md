# Codecadamy project: E-Commerce App (REST API)
Node/Express REST API to provide typical functionality found in an ecommerce website.  Users can create accounts, view products, add products to a cart, and place/view orders.

## Running the app
To run locally, `npm install`, the `node index.js`

This project requires a [PostgreSQL](https://ww/postgresql.org) database to be running locally. The E-commerce ERD file in the `Documents` folder of this repo describes the structure of the tables. [pgAdmin](https://www.pgaadmin.org) to interact with the database manually.

A `.env` file needs to be added to the base folder of the repo which includes the environment variables for your local environment. The following variables are required:
- PORT
- SESSION_SECRET
- PGHOST
- PGUSER
- PGDATABASE
- PGPASSWORD
- PGPORT

Commands for creating the full PostgreSQL database can be found in the root folder in the file `e-commerce-db.sql`, this will create all of the tables and populate the tables with data.

**Note:** Some endpoints are protected and require authentication. In order tp properly access these endpoints, you will need a session cookie present when making the request. This is accessed by using the `/account/login` endpoint first. Usernames and Passwords of existing users can be found in the .txt file within the Documents folder.

## Resources
- [REST Architecture](https://www.codecademy.com/articles/what-is-rest)
- [Setting up Postman](https://learning.postman.com/docs/getting-started/settings/)
- [Using pgAdmin](https://www.pgadmin.org/docs/pgadmin4/development/getting_started.html)
- [Postgres Cheat Sheet](https://www.postgresqltutorial.com/postgresql-cheat-sheet/)
- [Documenting your API with Swagger](https://swagger.io/resources/articles/documenting-apis-with-swagger/)
