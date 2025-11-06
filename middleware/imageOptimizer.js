const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const imageOptimizer = async (req, res, next) => {
  try {
    if (req.method !== "GET") return next();

    // Only optimize images in /candidatesUpload
    if (!req.path.startsWith("/candidatesUpload/")) return next();

    const imagePath = path.join(__dirname, "..", "public", req.path);
    if (!fs.existsSync(imagePath)) return next();

    const { w, h, format } = req.query;
    const width = w ? parseInt(w, 10) : null;
    const height = h ? parseInt(h, 10) : null;

    // Detect output format
    let outputFormat = format || "webp"; // default to WebP
    const supportedFormats = ["jpeg", "jpg", "png", "webp", "avif"];
    if (!supportedFormats.includes(outputFormat)) outputFormat = "webp";

    // If no resize requested, skip optimization
    if (!width && !height) return next();

    // Cache folder
    const cacheDir = path.join(__dirname, "..", "cache", "optimized");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const cacheFileName = `${path.basename(imagePath, path.extname(imagePath))}_${width || "auto"}x${height || "auto"}.${outputFormat}`;
    const cachedFilePath = path.join(cacheDir, cacheFileName);

    // Serve from cache if available
    if (fs.existsSync(cachedFilePath)) {
      res.type(`image/${outputFormat}`);
      return fs.createReadStream(cachedFilePath).pipe(res);
    }

    // Optimize image aggressively
    let transformer = sharp(imagePath).resize(width, height, {
      fit: "inside",
      withoutEnlargement: true,
      fastShrinkOnLoad: true,
    });

    switch (outputFormat) {
      case "jpeg":
      case "jpg":
        transformer = transformer.jpeg({
          quality: 70,
          progressive: true,
          chromaSubsampling: "4:2:0",
          optimizeScans: true,
          mozjpeg: true,
        });
        break;
      case "png":
        transformer = transformer.png({
          compressionLevel: 9,
          palette: true,
          quality: 80,
        });
        break;
      case "avif":
        transformer = transformer.avif({
          quality: 50,
          speed: 6,
        });
        break;
      case "webp":
      default:
        transformer = transformer.webp({
          quality: 70,
          effort: 6,
          smartSubsample: true,
          lossless: false,
        });
        break;
    }

    // Save to cache and stream response
    const writeStream = fs.createWriteStream(cachedFilePath);
    res.type(`image/${outputFormat}`);
    transformer.clone().pipe(writeStream);
    transformer.pipe(res);
  } catch (err) {
    console.error("Error optimizing image:", err);
    next();
  }
};

module.exports = imageOptimizer;
