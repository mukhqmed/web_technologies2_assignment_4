const mongoose = require('mongoose');
const portfolioSchema = new mongoose.Schema({
  image: { type: String, required: true },
  name_en: { type: String, required: true },
  name_ru: { type: String, required: true },
  desc_en: { type: String, required: true },
  desc_ru: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;
