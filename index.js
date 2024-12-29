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
        const BorrowbookCollection = client.db("Ereaders-database").collection("borrowed-books");

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
                const book = await bookCollection.findOne({ _id: new ObjectId(bookId) });

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

        // Add New Book
        app.post('/books', async (req, res) => {
            const { name, authorName, description, category, quantity, rating, image, publicationYear } = req.body;

            if (!name || !authorName || !description || !category || !quantity || !rating || !image || !publicationYear) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            if (typeof quantity !== 'number') {
                return res.status(400).json({ error: 'Invalid quantity' });
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
                if (typeof quantity !== 'number') {
                    return res.status(400).json({ error: 'Invalid quantity' });
                }

                const result = await bookCollection.updateOne(
                    { _id: new ObjectId(bookId) },
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
                const result = await bookCollection.deleteOne({ _id: new ObjectId(bookId) });

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
            const { id } = req.params;
            const { userName, userEmail, returnDate } = req.body;
        
            if (!userName || !userEmail || !returnDate) {
                return res.status(400).json({ error: 'All fields are required' });
            }
        
            try {
                const book = await bookCollection.findOne({ _id: new ObjectId(id) });
        
                if (!book) {
                    return res.status(404).json({ error: 'Book not found' });
                }
        
                if (book.quantity < 1) {
                    return res.status(400).json({ error: 'Invalid book quantity or book out of stock' });
                }
        
                const updateResult = await bookCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $inc: { quantity: -1 } }
                );
        
                if (updateResult.modifiedCount > 0) {
                    await BorrowbookCollection.insertOne({
                        bookId: id,
                        userName,
                        userEmail,
                        returnDate,
                    });
        
                    res.status(200).json({ message: 'Book borrowed successfully' });
                } else {
                    res.status(500).json({ error: 'Failed to borrow the book' });
                }
            } catch (error) {
                console.error("Error borrowing book:", error.message);
                res.status(500).json({ error: 'Failed to borrow book' });
            }
        });
        

        // Return a Book
        app.post('/return-book/:id', async (req, res) => {
            const { id } = req.params;
            const { email } = req.body;

            try {
                const result = await BorrowbookCollection.deleteOne({ bookId: id, userEmail: email });

                if (result.deletedCount > 0) {
                    await bookCollection.updateOne({ _id: new ObjectId(id) }, { $inc: { quantity: 1 } });
                    res.status(200).json({ message: 'Book returned successfully' });
                } else {
                    res.status(404).json({ error: 'Borrowed book not found' });
                }
            } catch (error) {
                console.error("Error returning book:", error.message);
                res.status(500).json({ error: 'Failed to return book' });
            }
        });

    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
    }
}

// Start the server and connect to MongoDB
connectToDatabase();

app.listen(port, () => {
    console.log(`Books are uploading on port: ${port}`);
});
