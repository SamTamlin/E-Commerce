const request = require('supertest');
const expect = require('chai').expect;

const app = require('../index');

describe('/product routes', () => {
    describe('GET /product', () => {
        it('responds with json containing an array', () => {
            return request(app)
                .get('/product')
                .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).to.be.an.instanceOf(Array)
            });
        });

        it('returns an array of products', () => {
            return request(app)
            .get('/product')
            .expect(200)
            .then((response) => {
                // expect(response.body.length).to.be.equal(42);
                response.body.forEach((product) => {
                    expect(product).to.have.ownProperty('id');
                    expect(product).to.have.ownProperty('name');
                    expect(product).to.have.ownProperty('price');
                });
            });
        });
    });

    describe('GET product/:id', () => {
        it('respondes with json contain one product', () => {
            return request(app)
                .get('/product/1')
                .expect(200)
                .then((response) => {
                    const product = response.body;
                    expect(product).to.have.ownProperty('id');
                    expect(product).to.have.ownProperty('name');
                    expect(product).to.have.ownProperty('price');
                })
        });
    });

    describe('POST product/', () => {
        it('creates a new product and returns name and price', () => {
            let newProduct = {
                name: 'Lemonade',
                price: 1.29
            }
            return request(app)
            .post('/product')
            .send(newProduct)
            .expect(201)
            .then((response) => {
                const product = response.body;
                expect(product).to.have.ownProperty('id');
                expect(product).to.have.property('name').equal('Lemonade');
                expect(product).to.have.property('price').equal('1.29');
            })
        })
    })
});


