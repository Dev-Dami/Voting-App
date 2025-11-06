const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const imageOptimizer = async (req, res, next) => {
  try {
    if (req.method !== "GET") return next();
    if (!req.path.startsWith("/candidatesUpload/")) return next();

    const imagePath = path.join(__dirname, "..", "public", req.path);
    if (!fs.existsSync(imagePath)) return next();

    const { w, h, format } = req.query;
    const width = w ? parseInt(w, 10) : null;
    const height = h ? parseInt(h, 10) : null;

    let outputFormat = format || "webp";
    const supportedFormats = ["jpeg", "jpg", "png", "webp", "avif"];
    if (!supportedFormats.includes(outputFormat)) outputFormat = "webp";

    if (!width && !height) return next();

    const cacheDir = path.join(__dirname, "..", "cache", "optimized");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const cacheFileName = `${path.basename(imagePath, path.extname(imagePath))}_${width || "auto"}x${height || "auto"}.${outputFormat}`;
    const cachedFilePath = path.join(cacheDir, cacheFileName);

    if (fs.existsSync(cachedFilePath)) {
      res.type(`image/${outputFormat}`);
      return fs.createReadStream(cachedFilePath).pipe(res);
    }

    let transformer = sharp(imagePath).resize(width, height, {
      fit: "inside",
      withoutEnlargement: true,
      fastShrinkOnLoad: true,
    });

    switch (outputFormat) {
      case "jpeg":
      case "jpg":
        transformer = transformer.jpeg({
          quality: 55,
          progressive: true,
          chromaSubsampling: "4:2:0",
          optimizeScans: true,
          mozjpeg: true,
          trellisQuantisation: true,
          overshootDeringing: true,
          optimizeCoding: true,
        });
        break;
      case "png":
        transformer = transformer.png({
          compressionLevel: 9,
          palette: true,
          quality: 70,
          effort: 10,
        });
        break;
      case "avif":
        transformer = transformer.avif({
          quality: 40,
          speed: 7,
          chromaSubsampling: "4:2:0",
        });
        break;
      case "webp":
      default:
        transformer = transformer.webp({
          quality: 60,
          effort: 7,
          smartSubsample: true,
          lossless: false,
          nearLossless: false,
        });
        break;
    }

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
