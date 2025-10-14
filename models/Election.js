const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: "General Election",
  },
  status: {
    type: String,
    enum: ["pending", "running", "ended"],
    default: "pending",
  },
  startTime: {
    type: Date,
    default: null,
  },
  endTime: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Election", electionSchema);
