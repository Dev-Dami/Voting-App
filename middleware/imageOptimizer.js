const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const imageOptimizer = async (req, res, next) => {
  try {
    // Only apply to GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Check if the request is for an image in candidatesUpload
    if (!req.path.startsWith("/candidatesUpload/")) {
      return next();
    }

    const imagePath = path.join(__dirname, "..", "public", req.path);

    // Check if the file exists
    if (!fs.existsSync(imagePath)) {
      return next();
    }

    // Get image dimensions from query string (e.g., ?w=200&h=200)
    const { w, h } = req.query;
    const width = w ? parseInt(w, 10) : null;
    const height = h ? parseInt(h, 10) : null;

    // If no dimensions are specified, serve the original image
    if (!width && !height) {
      return next();
    }

    // Set the content type
    res.type("image/jpeg");

    // Resize and optimize the image
    sharp(imagePath)
      .resize(width, height)
      .jpeg({ quality: 80, progressive: true })
      .pipe(res);
  } catch (err) {
    console.error("Error optimizing image:", err);
    next();
  }
};

module.exports = imageOptimizer;
