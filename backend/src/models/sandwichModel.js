import mongoose from 'mongoose';

const sandwichSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    ingredients: {
      type: Array,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
  },
  {
    collection: 'sandwiches',
    timestamps: {
      createdAt: 'created',
      updatedAt: 'lastEdited',
    },
    versionKey: false
  }
);

export default mongoose.model('Sandwich', sandwichSchema);
