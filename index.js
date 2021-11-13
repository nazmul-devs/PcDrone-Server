const express = require("express");
const cors = require("cors");
const app = express();
const admin = require("firebase-admin");
const ObjectId = require("mongodb").ObjectId;
const { MongoClient } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

// jwt

const serviceAccount = require("./pcdrone-adminsdk.json");

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

// mongoDb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f4mgp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

// token varify
async function varifyToken(req, res, next) {
	if (req.headers?.authorization?.startsWith("Bearer ")) {
		const token = req.headers.authorization.split(" ")[1];

		try {
			const decodetUser = await admin.auth().verifyIdToken(token);
			req.decodetEmail = decodetUser.email;
		} catch {}
	}
	next();
}

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

		// delete service by id
		app.delete("/services", async (req, res) => {
			const id = req.body.id;
			const query = { _id: ObjectId(id) };
			const result = await servicesCollection.deleteOne(query);
			res.json(result);
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

		// update order status
		app.put("/orders/:id", async (req, res) => {
			const id = req.params.id;
			const status = req.body.status;
			const filter = { _id: ObjectId(id) };
			const option = { upsert: true };
			const updatedDoc = {
				$set: {
					status: status,
				},
			};
			const result = await ordersCollection.updateOne(
				filter,
				updatedDoc,
				option
			);
			res.json(result);
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
		});

		// get review
		app.get("/reviews", async (req, res) => {
			const result = await reviewsCollection.find({}).toArray();
			res.send(result);
		});

		// Make admin
		app.put("/users/admin", varifyToken, async (req, res) => {
			const email = req.body.email;
			const requister = req.decodetEmail;
			if (requister) {
				const requisterAccount = await usersCollection.findOne({
					email: requister,
				});
				if (requisterAccount.role === "admin") {
					const filter = { email: email };
					const updateDoc = { $set: { role: "admin" } };
					const result = await usersCollection.updateOne(
						filter,
						updateDoc
					);
					res.json(result);
				} else {
					res.status(403).json({ message: "you do not have access" });
				}
			}
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
