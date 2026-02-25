const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  capacity:    { type: Number, required: true, default: 30 },
  credits:     { type: Number, required: true, default: 3 },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
