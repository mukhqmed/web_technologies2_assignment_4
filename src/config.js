const mongoose = require('mongoose');

const connect = mongoose.connect("mongodb+srv://mukha:1324@cluster0.cjvkzgm.mongodb.net/web2?retryWrites=true&w=majority");

connect.then(() => {
    console.log("Database Connected Successfully");
}).catch(() => {
    console.log("Database cannot be Connected");
});

const Loginschema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true 
    },
    email: { type: String, required: true },

    password: {
        type: String,
        required: true
    },
    firstName: String,
    lastName: String,
    age: Number,
    country: String,
    gender: String,
    role: {
        type: String,
        default: 'regular user' 
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const collection = mongoose.model("users", Loginschema);

module.exports = collection;
