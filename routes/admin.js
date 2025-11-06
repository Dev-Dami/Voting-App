const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Student = require("../models/Student");
const Candidate = require("../models/Candidate");
const VoteLog = require("../models/voteLogs");
const Election = require("../models/Election");
const Issue = require("../models/Issue");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/candidatesUpload");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage: storage });

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).render("accessdenied");
  }
};

// admin home page
router.get("/", verifyToken, isAdmin, async (req, res) => {
  res.redirect("/admin/dashboard");
});

// admin login page
router.get("/login", (req, res) => {
  res.render("adminSecret", { errorMessage: null });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/admin/login");
});

// admin login
router.post("/login", async (req, res) => {
  const { secret } = req.body;
  try {
    if (secret !== process.env.JWT_SECRET) {
      return res.render("adminSecret", { errorMessage: "invalid secret" });
    }
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });
    res.cookie("token", token);
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error logging in admin:", err);
    res.render("adminSecret", { errorMessage: "error logging in" });
  }
});

// admin dashboard
router.get("/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ votes: -1 });
    const voteLogs = await VoteLog.find()
      .populate("studentId", "studentId role")
      .populate("candidateId", "name");
    const students = await Student.find().sort({ studentId: 1 });
    let election = await Election.findOne();
    if (!election) {
      election = new Election();
      await election.save();
    }
    const positions = await Candidate.distinct("position");

    res.render("adminDashboard", {
      candidates,
      voteLogs,
      students,
      election,
      positions,
    });
  } catch (err) {
    console.error("Error loading admin dashboard:", err);
    res.status(500).json({ message: "Error loading dashboard" });
  }
});

// manage students
router.post("/students/add", verifyToken, isAdmin, async (req, res) => {
  try {
    const { studentId, password, role } = req.body;
    const existing = await Student.findOne({ studentId });
    if (existing)
      return res.status(400).json({ message: "student already exists" });

    const student = new Student({ studentId, password, role });
    await student.save();
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error adding student:", err);
    res.status(500).json({ message: "Error adding student" });
  }
});

router.post("/students/delete/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ message: "Error deleting student" });
  }
});

router.post(
  "/students/update-password/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { password, confirmPassword } = req.body;

      // Validate passwords match
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      // Validate password length
      if (password.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters long" });
      }

      const student = await Student.findById(req.params.id);
      if (!student) {
        return res.status(404).send("Student not found");
      }

      student.password = password;
      await student.save();

      // Redirect with success message (if needed)
      res.redirect("/admin/dashboard");
    } catch (err) {
      console.error("Error updating password:", err);
      res.status(500).json({ message: "Error updating password" });
    }
  },
);

// manage candidates
router.post(
  "/candidates/add",
  verifyToken,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, position, customPosition } = req.body;
      const image = req.file
        ? `/candidatesUpload/${req.file.filename}`
        : undefined;

      const candidate = new Candidate({
        name,
        position,
        customPosition: position === "Custom" ? customPosition : "",
        image,
      });

      await candidate.save();
      res.redirect("/admin/dashboard");
    } catch (err) {
      console.error("Error adding candidate:", err);
      res.status(500).json({ message: "Error adding candidate" });
    }
  },
);

router.post(
  "/candidates/delete/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const candidate = await Candidate.findById(req.params.id);
      if (!candidate) {
        return res.status(404).send("Candidate not found");
      }
      if (
        candidate.image &&
        candidate.image !== "/images/default-candidate.jpg"
      ) {
        const imagePath = path.join(__dirname, "..", "public", candidate.image);
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Error deleting candidate image:", err);
        });
      }
      await Candidate.findByIdAndDelete(req.params.id);
      res.redirect("/admin/dashboard");
    } catch (err) {
      console.error("Error deleting candidate:", err);
      res.status(500).send("error deleting candidate");
    }
  },
);

// Election routes
router.post("/election/start", verifyToken, isAdmin, async (req, res) => {
  try {
    const { endTime } = req.body;
    if (!endTime) {
      return res
        .status(400)
        .send("End time is required to start the election.");
    }
    const now = new Date();
    const electionEndTime = new Date(endTime);
    if (electionEndTime <= now) {
      return res.status(400).send("End time must be in the future.");
    }
    await Election.updateOne(
      {},
      { status: "running", startTime: now, endTime: electionEndTime },
    );
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error starting election:", err);
    res.status(500).send("Error starting election");
  }
});

router.post("/election/end", verifyToken, isAdmin, async (req, res) => {
  try {
    await Election.updateOne({}, { status: "ended" });
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error ending election:", err);
    res.status(500).json({ message: "Error ending election" });
  }
});

router.post("/election/reset", verifyToken, isAdmin, async (req, res) => {
  try {
    await Candidate.updateMany({}, { votes: 0 });
    await Student.updateMany({}, { hasVoted: false, votedPositions: [] });
    await VoteLog.deleteMany({});
    await Election.updateOne(
      {},
      { status: "pending", startTime: null, endTime: null },
    );
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error resetting election:", err);
    res.status(500).json({ message: "Error resetting election" });
  }
});

// reset users

// detailed votes for a candidate
router.get("/candidate/:id/votes", verifyToken, isAdmin, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).send("Candidate not found");

    const votes = await VoteLog.find({ candidateId: req.params.id }).populate(
      "studentId",
      "studentId",
    );

    res.render("candidateVotes", { candidate, votes });
  } catch (err) {
    console.error("Error getting candidate votes:", err);
    res.status(500).json({ message: "Error getting votes" });
  }
});

router.get(
  "/position/:position/chart",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { position } = req.params;
      const candidates = await Candidate.find({ position });

      const totalVotes = candidates.reduce((acc, c) => acc + c.votes, 0);
      const hasVotes = totalVotes > 0;

      const chartData = {
        labels: candidates.map((c) => c.name),
        datasets: [
          {
            label: "Votes",
            data: candidates.map((c) => c.votes),
            backgroundColor: [
              "rgba(255, 99, 132, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 206, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
              "rgba(153, 102, 255, 0.2)",
              "rgba(255, 159, 64, 0.2)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      };

      res.render("positionChart", { position, chartData, hasVotes });
    } catch (err) {
      console.error("Error getting chart data:", err);
      res.status(500).json({ message: "Error getting chart data" });
    }
  },
);

// admin voters page - view all students and issues
router.get("/voters", verifyToken, isAdmin, async (req, res) => {
  try {
    const students = await Student.find().sort({ studentId: 1 });
    const issues = await Issue.find().sort({ createdAt: -1 });

    res.render("adminVoters", {
      students,
      issues,
    });
  } catch (err) {
    console.error("Error loading voters page:", err);
    res.status(500).json({ message: "Error loading voters page" });
  }
});

/* reset users
router.get("/reset", verifyToken, isAdmin, async (req, res) => {
  try {
    await Student.deleteMany({});
    await Issue.deleteMany({});
    await VoteLog.deleteMany({});
    await Candidate.deleteMany({});
    await User.deleteMany({});

    res.redirect("/admin/voters");
  } catch (err) {
    console.error("Error resetting users:", err);
    res.status(500).json({ message: "Error resetting users" });
  }
  }); */

// Update issue status
router.post("/issues/:id/status", verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "in-progress", "resolved"];

    if (!validStatuses.includes(status)) {
      return res.status(400).send("Invalid status");
    }

    await Issue.findByIdAndUpdate(req.params.id, { status });
    res.redirect("/admin/voters");
  } catch (err) {
    console.error("Error updating issue status:", err);
    res.status(500).json({ message: "Error updating issue status" });
  }
});

// Reset votes for a single student
router.post(
  "/student/:id/reset-votes",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const studentId = req.params.id;
      const student = await Student.findById(studentId);

      if (!student || !student.hasVoted) {
        return res.redirect("/admin/voters");
      }

      // Find all vote logs for the student
      const studentVotes = await VoteLog.find({ studentId: student._id });

      // Decrement vote counts for candidates
      for (const vote of studentVotes) {
        await Candidate.findByIdAndUpdate(vote.candidateId, {
          $inc: { votes: -1 },
        });
      }

      // Delete the student's vote logs
      await VoteLog.deleteMany({ studentId: student._id });

      // Reset the student's voting status
      student.hasVoted = false;
      student.votedPositions = [];
      await student.save();

      res.redirect("/admin/voters");
    } catch (err) {
      console.error("Error resetting student votes:", err);
      res.status(500).json({ message: "Error resetting student votes" });
    }
  },
);

// Test charts page
router.get("/test-charts", verifyToken, isAdmin, async (req, res) => {
  try {
    const candidates = await Candidate.find();
    const voteLogs = await VoteLog.find().populate("studentId", "studentId");

    const votesByCandidate = voteLogs.reduce((acc, voteLog) => {
      if (!acc[voteLog.candidateId]) {
        acc[voteLog.candidateId] = [];
      }
      acc[voteLog.candidateId].push(voteLog.studentId.studentId);
      return acc;
    }, {});

    const plainCandidates = candidates.map((c) => c.toObject());

    plainCandidates.forEach((candidate) => {
      candidate.votes = votesByCandidate[candidate._id] || [];
    });

    const positions = plainCandidates.reduce((acc, candidate) => {
      if (!acc[candidate.position]) {
        acc[candidate.position] = [];
      }
      acc[candidate.position].push(candidate);
      return acc;
    }, {});

    res.render("testCharts", { positions });
  } catch (err) {
    console.error("Error loading test charts:", err);
    res.status(500).json({ message: "Error loading test charts" });
  }
});

module.exports = router;
