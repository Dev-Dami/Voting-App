const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: {
    type: String,
    enum: [
      "Head Boy",
      "Head Girl",
      "Sports Prefect",
      "Libary Prefect",
      "Laboratory Prefect",
      "Time Keeper",
      "Dining-hall Prefect",
      "Labour Prefect",
      "Social Prefect",
      "Health Prefect",
      "Chapel Prefect",
      "Custom",
    ],
    required: true,
    index: true, // Add index for faster queries
  },
  customPosition: {
    type: String,
    default: "",
    required: function () {
      return this.position === "Custom";
    },
  },
  votes: { type: Number, default: 0 },
  image: { type: String, default: "/images/default-candidate.jpg" },
});

module.exports = mongoose.model("Candidate", candidateSchema);
