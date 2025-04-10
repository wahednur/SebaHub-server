require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const dbUser = process.env.MDB_USER;
const dbPass = process.env.MDB_PASS;
const app = express();
const jwtSecret = process.env.JWT_SECRET;

//Cors options
const corsOpt = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOpt));
app.use(express.json());
app.use(cookieParser());
// MongoDB Operation start here

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req?.cookies.token;
  // If no token found
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  // If not valid token
  jwt.verify(token, jwtSecret, (error, decoded) => {
    if (error) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${dbUser}:${dbPass}@cluster0.um8n1zy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect(); // Comment for disabled connection
    // Send a ping to confirm a successful connection
    // MongoDB CRUD operation start here
    //Database collections
    const serviceCollection = client.db("sebahub").collection("services");
    const bookingCollection = client.db("sebahub").collection("bookings");
    // MongoDB CRUD operation end here

    // JWT operation start here
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, jwtSecret, { expiresIn: "1hr" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",

          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    //Clear cookies
    app.post("/logout", async (req, res) => {
      res
        .clearCookie("token", { maxAge: 0, httpOnly: true, secure: false })
        .send({ success: true });
    });
    // Create a service
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    // Get all services
    app.get("/services", async (req, res) => {
      const result = await serviceCollection.find().toArray();
      res.send(result);
    });
    // Get single service{
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });
    // Get all services by email
    app.get("/services/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "user.email": email };
      if (req.user.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const result = await serviceCollection.find(query).toArray();
      res.send(result);
    });

    //Update a services
    app.patch("/services/update/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: status,
      };
      const options = { upsert: true };
      const result = await serviceCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Delete a service
    app.delete("/services/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });
    // Aad a booking
    app.post("/bookings", async (req, res) => {
      const newBooking = req.body;
      const result = await bookingCollection.insertOne(newBooking);
      res.send(result);
    });

    // Get all bookings by email of client
    app.get("/bookings/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      const query = { "client.email": email };
      if (req.user.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // Deleted a booking by id who booking
    app.delete("/bookings/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });
    // Get all booking request
    app.get("/bookings-request/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "host.email": email };
      if (req.user.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    //To do booking fetch by id
    app.get("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.findOne(query);
      res.send(result);
    });

    // update a booking status
    app.patch("/update-bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const status = req.body;
      const updateDoc = {
        $set: status,
      };
      const options = { upsert: true };
      const result = await bookingCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });

    // search service by name
    app.get("/search", async (req, res) => {
      let query = {};
      const searchData = req.query.search;
      if (searchData) {
        query = {
          $or: [{ title: { $regex: searchData, $options: "i" } }],
        };
      }
      const result = await serviceCollection.find(query).toArray();
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close(); // Comment for disabled connection
  }
}
run().catch(console.dir);

// MongoDB Operation end here

// Server running test
app.get("/", (req, res) => {
  res.send(`<h1>SebaHub server running on port ${port}</h1>`);
});

// Port Listening
app.listen(port, () =>
  console.log(`SebaHub server is running on port number ${port}`)
);
