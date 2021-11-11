const express = require("express");
const cors = require("cors");
const app = express();
const ObjectId = require("mongodb").ObjectId;
const { MongoClient } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

// mongoDb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f4mgp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

async function run() {
	try {
		await client.connect();
		const database = client.db("PcDrone");
		const servicesCollection = database.collection("services");
		const usersCollection = database.collection("users");
		const ordersCollection = database.collection("orders");
		const reviewsCollection = database.collection("reviews");

		// Add service
		app.post("/services", async (req, res) => {
			const service = req.body;
			const result = await servicesCollection.insertOne(service);
			res.json(result);
		});

		// Get services
		app.get("/services", async (req, res) => {
			const result = await servicesCollection.find({}).toArray();
			res.send(result);
		});

		// save register user to database .
		app.post("/users", async (req, res) => {
			const user = req.body;
			const result = await usersCollection.insertOne(user);
			res.json(result);
		});
		// login with
		app.put("/users", async (req, res) => {
			const user = req.body;
			const filter = { email: user.email };
			const options = { upsert: true };
			const updateDoc = { $set: user };
			const result = await usersCollection.updateOne(
				filter,
				updateDoc,
				options
			);
			res.json(result);
		});

		// post oders
		app.post("/orders", async (req, res) => {
			const order = req.body;
			const result = await ordersCollection.insertOne(order);
			res.json(result);
		});
		// get all orders
		app.get("/orders", async (req, res) => {
			const result = await ordersCollection.find({}).toArray();
			res.send(result);
		});
		// get order by email
		app.get("/myorders", async (req, res) => {
			const email = req.query.email;
			const query = { email: email };
			const result = await ordersCollection.find(query).toArray();
			res.send(result);
		});
		// delete order by id
		app.delete("/orders", async (req, res) => {
			const id = req.body.id;
			const query = { _id: ObjectId(id) };
			const result = await ordersCollection.deleteOne(query);
			res.json(result);
		});

		// review post
		app.post("/reviews", async (req, res) => {
			const review = req.body;
			const result = await reviewsCollection.insertOne(review);
			res.json(result);
			console.log(result);
		});

		// get review
		app.get("/reviews", async (req, res) => {
			const result = await reviewsCollection.find({}).toArray();
			res.send(result);
		});

		// Make admin
		app.put("/users/admin", async (req, res) => {
			const email = req.body.email;
			const filter = { email: email };
			const updateDoc = { $set: { role: "admin" } };
			const result = await usersCollection.updateOne(filter, updateDoc);
			res.json(result);
			console.log(result);
		});
		// verify admin
		app.get("/users/:email", async (req, res) => {
			const email = req.params.email;
			const query = { email: email };
			const user = await usersCollection.findOne(query);
			let isAdmin = false;
			if (user?.role === "admin") {
				isAdmin = true;
			}
			res.json({ admin: isAdmin });
		});
	} finally {
		// await client.close();
	}
}
run().catch(console.dir);

// get app
app.get("/", (req, res) => {
	res.send("One care server is running");
});

// lisening app
app.listen(port, () => {
	console.log("server running with ", port);
});
