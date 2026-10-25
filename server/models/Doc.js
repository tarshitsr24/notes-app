// server/models/Doc.js
const mongoose = require("mongoose");

const docSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    desc: {
      type: String,
      default: "",
    },
    tagColor: {
      type: String,
      default: "emerald",
    },
    position: {
      x: {
        type: Number,
        default: 40,
      },
      y: {
        type: Number,
        default: 96,
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Doc", docSchema);
