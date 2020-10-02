const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DBSchema_slot = new Schema({
  name: {
    type: String,
    required: true
  },
  display: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    required: true
  },
  status: {
    type: Number,
    default: 1
  }
});

module.exports = Product = mongoose.model('Product', DBSchema_slot);
