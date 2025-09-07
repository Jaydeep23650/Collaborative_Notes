const mongoose = require('mongoose');

// Note Model matching exact specification: { title: String, content: String, updatedAt: Date }
const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    default: '',
    maxlength: 100000
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // Using custom updatedAt field as per specification
});

// Update the updatedAt field before saving
noteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Note', noteSchema);

