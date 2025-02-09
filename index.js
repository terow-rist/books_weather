require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Book Schema & Model
const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true }
});

const Book = mongoose.model('Book', bookSchema);

// Get books with optional genre filtering
app.get('/books', async (req, res) => {
    try {
        const { genre } = req.query;  // Get genre from query parameter
        const query = genre ? { genre } : {}; // Filter by genre if provided

        const books = await Book.find(query);
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Post a new book
app.post('/books', async (req, res) => {
    try {
        const { title, author, year, genre } = req.body;

        if (!title || !author) {
            return res.status(400).json({ message: "Title and author are required" });
        }

        if (year <= 0) {
            return res.status(400).json({ message: "Year must be greater than zero" });
        }

        const newBook = new Book({ title, author, year, genre });
        await newBook.save();
        res.status(201).json(newBook);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a book
app.put('/books/:id', async (req, res) => {
    try {
        const { title, author, year, genre } = req.body;

        if (year <= 0) {
            return res.status(400).json({ message: "Year must be greater than zero" });
        }

        const updatedBook = await Book.findByIdAndUpdate(req.params.id, { title, author, year, genre }, { new: true });

        if (!updatedBook) {
            return res.status(404).json({ message: "Book not found" });
        }

        res.json(updatedBook);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a book
app.delete('/books/:id', async (req, res) => {
    try {
        const deletedBook = await Book.findByIdAndDelete(req.params.id);
        if (!deletedBook) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.json({ message: "Book deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//PART 2 - Weather API with City Parameter
app.get('/weather', async (req, res) => {
    try {
        const { city } = req.query;  // Allow city as query parameter
        if (!city) {
            return res.status(400).json({ message: "City is required" });
        }

        const apiKey = process.env.WEATHER_API_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        const response = await axios.get(url);
        const weatherData = response.data;

        const result = {
            city: weatherData.name,
            temperature: `${weatherData.main.temp}°C`,
            condition: weatherData.weather[0].description
        };

        res.json(result);
    } catch (error) {
        console.error("Error fetching weather data", error);
        res.status(500).json({ message: "Error fetching weather data" });
    }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
