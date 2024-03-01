require('dotenv').config(); 

const express = require("express");
const collection = require("./config");
const bcrypt = require('bcrypt');
const countryList = require('country-list');
const countries = countryList.getNames();
const axios = require('axios');
const Portfolio = require('./porfolio');
const methodOverride = require('method-override');
const app = express();
const session = require('express-session');
const nodemailer = require('nodemailer'); 
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(session({
    secret: 'kaskyrbayev',
    resave: false,
    saveUninitialized: true,
  }));

app.use(methodOverride('_method'));
const fetchSportsData = async () => {
    const options = {
        method: 'GET',
        url: 'https://odds.p.rapidapi.com/v4/sports',
        params: { all: 'true' },
        headers: {
            'X-RapidAPI-Key': '99b4c00fc7mshc5b664f6e38435fp154337jsn0ce690ac84bd',
            'X-RapidAPI-Host': 'odds.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error('Error fetching sports data:', error);
        return null;
    }
};
const fetchAnimeQuote = async () => {
    try {
        const response = await fetch("https://animechan.xyz/api/random/anime?title=naruto");
        const quote = await response.json();
        return quote;
    } catch (error) {
        console.error('Error fetching anime quote:', error);
        return null;
    }
};
const fetchMovieQuote = async () => {
    try {
      const response = await axios.get('https://andruxnet-random-famous-quotes.p.rapidapi.com/', {
        headers: {
          'X-RapidAPI-Key': 'd7b6a87e5amsh083bd903890dbf3p1d34efjsnd62f39607278',
          'X-RapidAPI-Host': 'andruxnet-random-famous-quotes.p.rapidapi.com',
        },
        params: {
          count: 1,
          category: 'movies',
        },
      });
      return response.data[0];
    } catch (error) {
      console.error('Error fetching movie quote:', error);
      return null;
    }
  };
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, 
        pass: process.env.GMAIL_PASS  
    }
});
  
  const sendEmail = async (to, subject, text) => {
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject,
        text,
      });
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };
  app.get('/', async (req, res) => {
    try {
        const [movieQuote, sportsData, animeQuote] = await Promise.all([
            fetchMovieQuote(),
            fetchSportsData(),
            fetchAnimeQuote()
        ]);
        res.render('home', { movieQuote, sportsData, quote: animeQuote }); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
    }
});

app.post("/assignAdminRole", async (req, res) => {
    const { username } = req.body;

    try {
        const updatedUser = await collection.findOneAndUpdate(
            { name: username },
            { $set: { role: 'admin' } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send('User not found');
        }
        await sendEmail(updatedUser.email, 'Congrats', `Dear ${updatedUser.firstName},\n\nNow, you have admin privileges!\n\nBest regards,\nThe Team`);
        res.redirect('/admin'); 
    } catch (error) {
        console.error('Error assigning admin role:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get("/login", (req, res) => {
    res.render("login", { errorMessage: '' });
});

app.get("/signup", (req, res) => {
    res.render("signup", { countries: countries, errorMessage: '' }); 
});

app.post("/signup", async (req, res) => {
    const { username, password, firstName, lastName, age, country, gender } = req.body;

    try {
        const existingUser = await collection.findOne({ name: username });
        if (existingUser) {
            return res.render("signup", { countries: countries, errorMessage: 'User already exists. Please choose a different username.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const userData = await collection.create({
            name: username,
            email: req.body.email,
            password: hashedPassword,
            firstName,
            lastName,
            age,
            country,
            gender,
            createdAt: new Date()
        });

        console.log(userData);
        await sendEmail(userData.email, 'Welcome to our website', `Dear ${userData.firstName},\n\nWelcome to our website!\n\nBest regards,\nThe Team`);
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering user');
    }
});

app.get("/admin", (req, res) => {

    res.render("admin");
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await collection.findOne({ name: username });
        if (!user) {
            return res.render("login", { errorMessage: 'User not found' });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.render("login", { errorMessage: 'Incorrect password' });
        }        if (user.role === 'admin') {
            return res.render("admin");
        } else {
          
                const [movieQuote, sportsData] = await Promise.all([fetchMovieQuote(), fetchSportsData()]);
                res.render("home", { movieQuote: movieQuote, sportsData: sportsData });
              
        }
    }catch (error) {
        console.error(error);
        res.status(500).send('Error logging in');
    }
});
app.get('/portfolio', async (req, res) => {
    try {
        const portfolios = await Portfolio.find();
        res.render('portfolio', { portfolio: portfolios });
    } catch (error) {
        console.error('Error fetching portfolios:', error);
        res.status(500).send('Error fetching portfolios');
    }
});
app.put('/portfolio/:id', async (req, res) => {
    try {
        const { image, name_en, name_ru, desc_en, desc_ru } = req.body;
        const updatedPortfolio = await Portfolio.findByIdAndUpdate(req.params.id, {
            image,
            name_en,
            name_ru,
            desc_en,
            desc_ru
        }, { new: true });
        res.redirect('/portfolio');
    } catch (error) {
        console.error('Error updating portfolio item:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/portfolio/:id', async (req, res) => {
    try {
        await Portfolio.findByIdAndDelete(req.params.id);
        res.redirect('/portfolio');
    } catch (error) {
        console.error('Error deleting portfolio item:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/portfolio/:id/edit', async (req, res) => {
    try {
        const id = req.params.id;
        const portfolio = await Portfolio.findById(id);
        if (!portfolio) {
            res.status(404).send('Portfolio not found');
        } else {
            res.render('editPortfolio', { portfolio });
        }
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).send('Internal Server Error');
    }
  });
  
  
  app.post('/portfolio', async (req, res) => {
    try {
        const { image, name_en, name_ru, desc_en, desc_ru } = req.body;
        const portfolio = new Portfolio({
            image,
            name_en,
            name_ru,
            desc_en,
            desc_ru,
            timestamp: new Date()
        });
        await portfolio.save();
        res.redirect('/portfolio');
    } catch (error) {
        console.error('Error creating portfolio item:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/items', async (req, res) => {
    try {
        const portfolioData = await Portfolio.find();
        
        res.render('items', { portfolio: portfolioData });
    } catch (error) {
        console.error('Error fetching portfolio data:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
  });
const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});