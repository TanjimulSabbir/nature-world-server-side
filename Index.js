const express = require("express")
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const { json } = require('express');

// Middleware
app.use(cors());
app.use(express.json());

// Port
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("Nature World Server is Running");
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_USER_PASSWORD}@cluster0.vli9jdy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    const BookingCollections = client.db("Nature-World").collection("Booking");
    const LoginUsersCollections = client.db("Nature-World").collection("AllUser");

    try {
        // create jwt token
        app.post('/jwt', async (req, res) => {
            try {
                const user = req.body;
                const token = jwt.sign(user, process.env.JWT_SECREATE_KEY, { expiresIn: '2h' })
                res.status(201).send({ message: 'Jwt Token created Successfully', data: token, status: 201 })
            } catch (error) {
                res.status(500).send({ message: 'Failed to Create Token', status: 500 })
            }
        })
        // JWT Verify MiddleWare/Function
        function VerifyJWT(req, res, next) {
            const AuthHeader = req.headers.authorization;
            if (!AuthHeader) {
                return res.status(401).send({ message: 'unauthorized access', status: 401 })
            }
            const Token = AuthHeader.split(' ')[1]
            if (!Token) {
                return res.status(401).send({ message: 'unauthorized access', status: 401 })
            }
            jwt.verify(Token, process.env.ACCESS_TOKEN_SERECT_KEY, (err, decoded) => {
                if (err) {
                    return res.status(403).send({ message: 'Forbidden Access', status: 403 })
                }
                req.decoded = decoded;
                next();
            })
        };
        // Check here User Login email and JWT Verification email Matched
        const CheckLoginAndJWTEmail = async (req, res, next) => {
            const decoded = req.decoded;
            const UserEmail = req.params.id;
            if (!UserEmail) {
                return res.status(404).send({ message: 'Forbidden Access', status: 404 });
            }

            if (decoded.email !== UserEmail) {
                return res.status(401).send({ message: 'Unauthorized Access', status: 401 });
            }
            next()
        }
        app.get('/home/:id', (req, res) => {
            res.status(200).send({ message: "Jwt Verified Successfully", status: 200 })
        })

        // Add Login User
        app.post("/alluser/:id", async (req, res) => {
            try {
                const UserData = req.body.UserData;
                const AlreadyAdded = await LoginUsersCollections.find({ email: req.params.id }).toArray();
                if (AlreadyAdded.length) {
                    return res.status(409).send({ message: "User already Added", status: 409 })
                }
                const result = await LoginUsersCollections.insertOne({ ...UserData })
                if (result.insertedId) {
                    return res.status(201).send({ message: "User Added Successfully", status: 201 })
                }
                return res.status(400).send({ message: "User Added Failded", status: 400 })
            } catch (error) {
                return res.status(500).send({ message: "Internal Error", status: 500, error: error })
            }
        })
        // AllUser Get
        app.get("/alluser/:id", async (req, res) => {
            try {
                const result = await LoginUsersCollections.find({}).toArray();
                if (result) {
                    return res.status(200).send({ message: "Data Retrive Successful", status: 200, data: result });
                }
                return res.status(400).send({ message: "User Added Failed", status: 400, });
            } catch (error) {
                return res.status(500).send({ message: "Internal Error", status: 500, error: error });

            }
        })
        app.delete("/alluser/:id", async (req, res) => {
            try {
                const result = await LoginUsersCollections.deleteOne({ email: req.params.id })
                if (result.deletedCount) {
                    return res.status(200).send({ message: "User Deleted Successfully", status: 200 })
                }
                return res.status(400).send({ message: "User Deleted Failed", status: 400, });
            } catch (error) {
                return res.status(500).send({ message: "Internal Error", status: 500, error: error });
            }
        })

        // Booking Data Get
        app.get("/booking/:id", async (req, res) => {
            const Booking = await BookingCollections.find({}).toArray();
            try {
                if (!Booking) {
                    return res.status(404).send({ message: "No Data Found", status: 404 })
                }
                res.status(200).send({ message: "Data Getting Successfull", data: Booking, status: 200 })
            } catch (error) {
                res.status(500).send({ message: "Server Error", status: 500 })
            }
        })

        // Booking Add or Update
        app.post('/booking/:id', async (req, res) => {
            const BookingData = req.body.UserData;
            const AlreadyAdded = await BookingCollections.find({ id: BookingData.id }).toArray();

            try {
                if (AlreadyAdded.length) {
                    const PreviousQuantity = AlreadyAdded[0].Quantity

                    const result = await BookingCollections.updateOne({ id: BookingData.id },
                        { $set: { Quantity: BookingData.Quantity + PreviousQuantity } });

                    if (!(result.modifiedCount)) {
                        return res.status(400).send({ message: "Failed", status: 400 })
                    }

                    return res.status(200).send({ message: "Data Added to Cart1", status: 200 })
                }
                const result = await BookingCollections.insertOne({ ...BookingData });

                if (!(result.insertedId)) {
                    return res.status(400).send({ message: "Failed", status: 400 })
                }
                return res.status(200).send({ message: "Data Added to Cart2", status: 200 })

            } catch (error) {
                res.status(500).send({ message: "Server Error", status: 500 })

            }

        })

        // Booking Delete
        app.delete("/booking/:id", async (req, res) => {
            try {
                const BookingId = req.body.id
                const result = await BookingCollections.deleteOne({ id: BookingId });
                if (result.deletedCount) {
                    return res.status(200).send({ message: "Deleted Successfully", status: 200 })
                }
                else {
                    return res.status(400).send({ message: "Delete faild", status: 400 })
                }
            } catch (error) {
                return res.status(500).send({ message: "Server Error", status: 500, error: error })
            }
        })
    } finally {

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    console.log("Nature World is Running")
    res.send("Nature World Server is Running");
})