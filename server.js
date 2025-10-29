const express = require('express');
const path = require('path');

const app = express();
const port = 3000; // You can change this port if needed

// Set EJS as the view engine
app.set('view engine', 'ejs');
// Tell Express where to find the EJS files (in the 'views' folder)
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, client-side JS, images) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Route for the main page
app.get('/', (req, res) => {
    // Render the index.ejs file from the 'views' folder
    res.render('index', { title: 'AquaTrack' }); // Pass data to EJS if needed
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});