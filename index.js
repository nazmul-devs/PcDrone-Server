const express = require("express");
const cors = require("cors");
const app = express();
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
