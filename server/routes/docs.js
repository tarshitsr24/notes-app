// server/routes/docs.js
const express = require("express");
const Doc = require("../models/Doc");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/docs - Retrieve all documents for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const docs = await Doc.find({ userId }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch documents", error: err.message });
  }
});

// POST /api/docs - Create a new document note
router.post("/", auth, async (req, res) => {
  try {
    const { desc, tagColor, position } = req.body;
    const userId = req.user.id || req.user._id;

    const newDoc = new Doc({
      userId,
      desc: desc !== undefined ? desc : "",
      tagColor: tagColor || "emerald",
      position: position || { x: 40, y: 96 },
    });

    const savedDoc = await newDoc.save();
    res.status(201).json(savedDoc);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create document", error: err.message });
  }
});

// PUT /api/docs/:id - Update an existing document (text or position)
router.put("/:id", auth, async (req, res) => {
  try {
    const { desc, tagColor, position } = req.body;
    const userId = req.user.id || req.user._id;
    const updateFields = {};

    if (desc !== undefined) updateFields.desc = desc;
    if (tagColor !== undefined) updateFields.tagColor = tagColor;
    if (position !== undefined) updateFields.position = position;

    const updatedDoc = await Doc.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: updateFields },
      { returnDocument: "after", runValidators: true },
    );

    if (!updatedDoc) {
      return res
        .status(404)
        .json({ message: "Document not found or unauthorized" });
    }

    res.json(updatedDoc);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update document", error: err.message });
  }
});

// DELETE /api/docs/:id - Delete a document
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const deletedDoc = await Doc.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!deletedDoc) {
      return res
        .status(404)
        .json({ message: "Document not found or unauthorized" });
    }

    res.json({ message: "Document deleted successfully", id: req.params.id });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete document", error: err.message });
  }
});

module.exports = router;
