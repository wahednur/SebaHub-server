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

//Cors options
const corsOpt = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credential: true,
  optionSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOpt));
app.use(express.json());

// MongoDB Operation start here

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
    // MongoDB CRUD operation end here

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
    app.get("/services/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "user.email": email };
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
      const result = await serviceCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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
