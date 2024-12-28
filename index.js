require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


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

        await client.connect();

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
            const id = req.params.id ; 
            const query = {_id: id}
            const result = await bookCollection.findOne(query) ; 
            res.send(result) ; 
        })
        
        app.patch('/jobs/:id', async (req, res) => {
            console.log("Request received:", req.body); // Debugging
            const id = req.params.id;
            const { userName, userEmail, returnDate } = req.body;
        
            try {
                const book = await bookCollection.findOne({ _id: new ObjectId(id) });
                console.log("Book found:", book); // Debugging
        
                if (!book) {
                    return res.status(404).send({ error: 'Book not found' });
                }
        
                if (book.quantity === 0) {
                    return res.status(400).send({ error: 'Book is out of stock' });
                }
        
                const updatedQuantity = book.quantity - 1;
                await bookCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { quantity: updatedQuantity } }
                );
        
                res.send({ success: true, message: 'Book borrowed successfully' });
            } catch (err) {
                console.error("Error in PATCH route:", err.message);
                res.status(500).send({ error: 'Failed to borrow the book' });
            }
        });
        



        // Send a ping to confirm a successful connection
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
    console.log(`Books are uploading : ${port}`); // Corrected template literal
});
