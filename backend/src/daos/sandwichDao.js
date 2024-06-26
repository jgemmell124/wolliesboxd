import sandwichModel from '../models/sandwichModel.js';

export const getSandwichById = (sandwichId) => {
  return sandwichModel.findById(sandwichId);
};

export const createSandwich = (sandwich) => {
  return sandwichModel.create(sandwich);
};

export const updateSandwich = (sandwichId, sandwich) => {
  return sandwichModel.updateOne({ _id: sandwichId }, { $set: sandwich });
};

export const deleteSandwich = (sandwichId) => {
  return sandwichModel.deleteOne({ _id: sandwichId });
};

export const getAllSandwiches = () => {
  return sandwichModel.find({});
};
