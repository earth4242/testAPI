const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DBSchema_status = new Schema({
  product_id: {
    type: Number
  },
  user_id: {
    type: Number
  },
  status: {
    type: Number,
    default: 1
  }
});

module.exports = Product_owner = mongoose.model('Product_owner', DBSchema_status);
