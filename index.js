require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mongoose Schema and Model
const BookSchema = new mongoose.Schema({
    name: String,
    authorName: String,
    summary: String,
    category: String,
    publicationYear: Number,
    quantity: Number,
    rating: Number,
    image: String
});

const BookModel = mongoose.model('Book', BookSchema);

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.BOOK_USER}:${process.env.BOOK_PASS}@cluster0.5t4p0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB via Mongoose');

        const bookCollection = client.db('Ereaders-database').collection('books-data');

        app.get('/jobs', async (req, res) => {
            try {
                const cursor = bookCollection.find();
                const result = await cursor.toArray();
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Failed to fetch books' });
            }
        });

        app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: id };
            const result = await bookCollection.findOne(query);
            res.send(result);
        });

        app.patch('/jobs/:id', async (req, res) => {
            const { id } = req.params;
            const { userName, userEmail, returnDate } = req.body;

            try {
                const book = await BookModel.findOneAndUpdate(
                    { _id: id },
                    { $set: { userName, userEmail, returnDate } },
                    { new: true }
                );

                if (book) {
                    if (book.quantity > 0) {
                        book.quantity -= 1;
                        await book.save();
                    }
                    res.status(200).json(book);
                } else {
                    res.status(404).json({ error: 'Book not found' });
                }
            } catch (error) {
                console.error("Error borrowing book:", error.message);
                res.status(500).json({ error: 'Server error' });
            }
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err.message);
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Book is falling from the sky');
});

app.listen(port, () => {
    console.log(`Books are uploading : ${port}`);
});
