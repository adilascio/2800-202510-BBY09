const PORT = process.env.PORT || 8000;
const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const {MongoClient} = require('mongodb');


// HTML and Public folders statically served.
app.use(express.static(path.join(__dirname, 'html')));
app.use(express.static(path.join(__dirname, 'public')));


// Serve on process.env.PORT or port 8000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});