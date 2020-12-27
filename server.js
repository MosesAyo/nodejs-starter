const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");

const app = express();

// Import route files from routes folder
const users = require('./routes/api/users');

//Body Parser middleware
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(cors());

// Database configurations file
const database = require('./config/keys'); 

// connect to mongodb
mongoose.Promise = global.Promise;
mongoose.connect(database.mongoURI, {
    useNewUrlParser:true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));


app.get('/', (req, res) => {
    res.send("Home route working");
});

// Passport middleware
app.use(passport.initialize());

// Passport Config
require('./config/passport')(passport);

// Use Routes
app.use('/api/users', users);

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});