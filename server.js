const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const helmet = require("helmet"); // For security headers
const rateLimit = require("express-rate-limit"); // For rate limiting
const { verifyToken } = require("./middleware/auth");
const imageOptimizer = require("./middleware/imageOptimizer");
require("dotenv").config();
const os = require("os");

const app = express();
const http = require("http");
const { Server } = require("socket.io");

const httpServer = http.createServer(app);
const io = new Server(httpServer);
const connectDB = require("./config/db");

app.locals.io = io;

const networkInterfaces = os.networkInterfaces();
const lanIP = Object.values(networkInterfaces)
  .flat()
  .find((iface) => iface.family === "IPv4" && !iface.internal)?.address;

//middleware
app.use(
  helmet({
    hsts: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "'sha256-mWhaVcY/qM4ntQl6lLTc9ovjFrRgTcPLx5a+IpU+/aE='",
          "'sha256-V1qNcmiveH8c9lH5ZGbl9z9eJoli+IBRRF0UZoAZRP4='",
        ],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// view ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

connectDB();
//static files
app.use(imageOptimizer);
app.use("/", express.static(path.join(__dirname, "public")));
app.use(
  "/chart.js",
  express.static(path.join(__dirname, "node_modules/chart.js/dist")),
);

// Serve candidate images with authorization
app.get("/candidatesUpload/:filename", verifyToken, (req, res) => {
  const filePath = path.join(
    __dirname,
    "public/candidatesUpload",
    req.params.filename,
  );

  if (
    req.headers.referer &&
    !req.headers.referer.startsWith(req.protocol + "://" + req.get("host"))
  ) {
    return res.status(403).send("Access Denied");
  }
  res.sendFile(filePath);
});

const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student")(io);

// routes place holding
app.get("/", (req, res) => {
  res.render("homePage");
});

// Mount routes
app.use("/admin", adminRoutes);
app.use("/", studentRoutes);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running locally: http://localhost:${PORT}`);
  if (lanIP) console.log(`Server accessible on LAN: http://${lanIP}:${PORT}`);
});
