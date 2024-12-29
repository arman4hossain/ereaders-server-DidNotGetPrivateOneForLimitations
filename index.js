require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.BOOK_USER}:${process.env.BOOK_PASS}@cluster0.5t4p0.mongodb.net/?retryWrites=true&w=majority`;

async function connectToDatabase() {
    const client = new MongoClient(uri, { useUnifiedTopology: true });

    try {
        await client.connect();
        console.log("MongoClient: Successfully connected to MongoDB");

        const bookCollection = client.db("Ereaders-database").collection("books-data");

        // Routes

        // Default Route
        app.get('/', (req, res) => {
            res.send('Book is falling from the sky!');
        });

        // Fetch All Books
        app.get('/books', async (req, res) => {
            try {
                const books = await bookCollection.find().toArray();
                res.status(200).json(books);
            } catch (error) {
                console.error("Error fetching books:", error.message);
                res.status(500).json({ error: 'Failed to fetch books' });
            }
        });

        // Fetch a Single Book by bookId
        app.get('/books/:bookId', async (req, res) => {
            const { bookId } = req.params;
        
            try {
                const book = await bookCollection.findOne({ _id: bookId });
        
                if (book) {
                    res.status(200).json(book);
                } else {
                    res.status(404).json({ error: 'Book not found' });
                }
            } catch (error) {
                console.error("Error fetching book:", error.message);
                res.status(500).json({ error: 'Failed to fetch book' });
            }
        });

        app.post('/books', async (req, res) => {
            const { name, authorName, description, category, quantity, rating, image, publicationYear } = req.body;
        
            // Check for missing fields
            if (!name || !authorName || !description || !category || !quantity || !rating || !image || !publicationYear) {
                return res.status(400).json({ error: 'All fields are required' });
            }
        
            const newBook = { name, authorName, description, category, quantity, rating, image, publicationYear };
        
            try {
                const result = await bookCollection.insertOne(newBook);
                res.status(201).json({ message: 'Book added successfully', bookId: result.insertedId });
            } catch (error) {
                console.error("Error adding book:", error.message);
                res.status(500).json({ error: 'Failed to add book' });
            }
        });
        
        

        // Update a Book's Quantity
        app.patch('/books/:bookId', async (req, res) => {
            const { bookId } = req.params;
            const { quantity } = req.body;

            try {
                if (!quantity || typeof quantity !== 'number') {
                    return res.status(400).json({ error: 'Invalid or missing quantity' });
                }

                const result = await bookCollection.updateOne(
                    { bookId },
                    { $set: { quantity } }
                );

                if (result.matchedCount > 0) {
                    res.status(200).json({ message: 'Book updated successfully' });
                } else {
                    res.status(404).json({ error: 'Book not found' });
                }
            } catch (error) {
                console.error("Error updating book:", error.message);
                res.status(500).json({ error: 'Failed to update book' });
            }
        });

        // Delete a Book
        app.delete('/books/:bookId', async (req, res) => {
            const { bookId } = req.params;

            try {
                const result = await bookCollection.deleteOne({ bookId });

                if (result.deletedCount > 0) {
                    res.status(200).json({ message: 'Book deleted successfully' });
                } else {
                    res.status(404).json({ error: 'Book not found' });
                }
            } catch (error) {
                console.error("Error deleting book:", error.message);
                res.status(500).json({ error: 'Failed to delete book' });
            }
        });

        app.post('/borrow/:id', async (req, res) => {
            const { id } = req.params; // 'id' is treated as a plain string
            const { userName, userEmail, returnDate } = req.body;
        
            // Validate input fields
            if (!userName || !userEmail || !returnDate) {
                return res.status(400).json({ error: 'All fields are required' });
            }
        
            try {
                // Find the book using the plain string `id`
                const book = await bookCollection.findOne({ _id: id });
        
                if (!book) {
                    return res.status(404).json({ error: 'Book not found' });
                }
        
                if (book.quantity <= 0) {
                    return res.status(400).json({ error: 'Book out of stock' });
                }
        
                // Update the book quantity
                const result = await bookCollection.updateOne(
                    { _id: id },
                    { $inc: { quantity: -1 } }
                );
        
                if (result.modifiedCount > 0) {
                    res.status(200).json({ message: 'Book borrowed successfully' });
                } else {
                    res.status(400).json({ error: 'Failed to update book quantity' });
                }
            } catch (error) {
                console.error("Error borrowing book:", error.message);
                res.status(500).json({ error: 'Failed to borrow book' });
            }
        });
        

    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
    }
}

// Start the server and connect to MongoDB
connectToDatabase();

app.listen(port, () => {
    console.log(`Books are uploading: ${port}`);
});
