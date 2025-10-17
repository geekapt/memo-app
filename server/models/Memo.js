const mongoose = require('mongoose');

const memoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A memo must have a title'],
    trim: true,
    maxlength: [100, 'Title must be less than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'A memo must have content'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A memo must belong to a user']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update the updatedAt field before saving
memoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
memoSchema.index({ user: 1, isPinned: -1, updatedAt: -1 });

const Memo = mongoose.model('Memo', memoSchema);
module.exports = Memo;
