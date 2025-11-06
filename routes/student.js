const mongoose = require("mongoose");
const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const Student = require("../models/Student");
const Candidate = require("../models/Candidate");
const VoteLog = require("../models/voteLogs");
const Election = require("../models/Election");
const Issue = require("../models/Issue");
const { verifyToken } = require("../middleware/auth");

const isStudent = (req, res, next) => {
  if (req.user && req.user.role === "student") {
    next();
  } else {
    res.status(403).send("Access denied. Student privileges required.");
  }
};

module.exports = (io) => {
  const router = express.Router();

  // rate limiting
  const voteLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: "Too many vote attempts, please try again later.",
  });

  // Student login page
  router.get("/login", (req, res) => {
    res.render("login", {
      schoolLogo: process.env.SCHOOL_LOGO || "/images/logo.png",
      schoolName: process.env.SCHOOL_NAME || "Yeshua High School",
      errorMessage: null,
    });
  });

  router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
  });

  // student login
  router.post("/login", async (req, res) => {
    const { studentId, password } = req.body;
    try {
      const student = await Student.findOne({ studentId });
      if (!student || !(await student.comparePassword(password))) {
        return res.render("login", {
          schoolLogo: process.env.SCHOOL_LOGO || "/images/logo.png",
          schoolName: process.env.SCHOOL_NAME || "Yeshua High School",
          errorMessage: "Invalid credentials",
        });
      }

      const token = jwt.sign(
        { id: student._id, role: student.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );
      res.cookie("token", token);

      if (student.hasVoted) {
        return res.redirect("/slip");
      } else {
        return res.redirect("/vote");
      }
    } catch (err) {
      console.error("Error logging in student:", err);
      res.render("login", {
        schoolLogo: process.env.SCHOOL_LOGO || "/images/logo.png",
        schoolName: process.env.SCHOOL_NAME || "Yeshua High School",
        errorMessage: "Error logging in",
      });
    }
  });

  // vote page
  router.get("/vote", verifyToken, isStudent, async (req, res) => {
    try {
      const election = await Election.findOne();
      if (!election || election.status !== "running") {
        return res.render("electionNotRunning");
      }

      const student = await Student.findById(req.user.id);
      if (!student) {
        return res.status(404).send("Student not found");
      }
      
      if (student.isSuspended) {
        return res.render("suspended", { student });
      }
      
      if (student.hasVoted) return res.redirect("/slip");

      // fetch all candidates
      const allCandidates = await Candidate.find();

      // group candidates by position
      const groupedCandidates = {};
      allCandidates.forEach((candidate) => {
        if (!groupedCandidates[candidate.position]) {
          groupedCandidates[candidate.position] = [];
        }
        groupedCandidates[candidate.position].push(candidate);
      });

      res.render("vote", { groupedCandidates, user: student });
    } catch (err) {
      console.error("Error loading vote page:", err);
      res.status(500).json({ message: "Error loading vote page" });
    }
  });

  // handle vote
  router.post("/vote", verifyToken, isStudent, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const election = await Election.findOne().session(session);
      if (!election || election.status !== "running") {
        await session.abortTransaction();
        session.endSession();
        return res.render("electionNotRunning");
      }

      const student = await Student.findById(req.user.id).session(session);
      if (!student) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).send("Student not found");
      }

      if (student.isSuspended) {
        await session.abortTransaction();
        session.endSession();
        return res.render("suspended", { student });
      }

      if (student.hasVoted) {
        await session.abortTransaction();
        session.endSession();
        return res.redirect("/slip");
      }

      const allCandidates = await Candidate.find().session(session);
      const positions = [...new Set(allCandidates.map((c) => c.position))];

      const selectedCandidates = {};
      for (const pos of positions) {
        const key = pos.replace(/\s+/g, "_").toLowerCase();
        if (!req.body[key]) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).send(`Please select a candidate for ${pos}`);
        }
        selectedCandidates[pos] = req.body[key];
      }

      const candidateIds = Object.values(selectedCandidates);
      const candidates = await Candidate.find({
        _id: { $in: candidateIds },
      }).session(session);
      if (candidates.length !== candidateIds.length) {
        throw new Error("Invalid candidate selected");
      }

      const voteLogs = [];
      const newVotedPositions = [];

      for (const [pos, candId] of Object.entries(selectedCandidates)) {
        await Candidate.updateOne(
          { _id: candId },
          { $inc: { votes: 1 } },
        ).session(session);
        voteLogs.push({
          studentId: student._id,
          candidateId: candId,
          position: pos,
        });
        newVotedPositions.push({
          position: pos,
          candidateId: candId,
        });
      }

      const insertedVoteLogs = await VoteLog.insertMany(voteLogs, { session });

      student.votedPositions.push(...newVotedPositions);
      if (student.votedPositions.length >= positions.length) {
        student.hasVoted = true;
      }
      await student.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Emit Socket.IO events after the transaction is successful
      const populatedVoteLogs = await VoteLog.find({
        _id: { $in: insertedVoteLogs.map((log) => log._id) },
      })
        .populate("studentId", "studentId")
        .populate("candidateId", "name");
      io.emit("newVoteLog", populatedVoteLogs);

      for (const candId of candidateIds) {
        const updatedCandidate = await Candidate.findById(candId);
        if (updatedCandidate) {
          io.emit("voteUpdate", {
            candidateId: updatedCandidate._id,
            votes: updatedCandidate.votes,
          });
        }
      }

      res.redirect("/slip");
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Vote submission error:", err);
      res.status(500).send("Error submitting vote");
    }
  });

  // Vote slip page
  router.get("/slip", verifyToken, async (req, res) => {
    try {
      const student = await Student.findById(req.user.id);
      if (!student) return res.status(404).send("Student not found");

      // Populate candidates
      await student.populate("votedPositions.candidateId", "name image");

      const votedCandidates = student.votedPositions
        .filter((v) => v.candidateId)
        .map((v) => ({
          position: v.position,
          name: v.candidateId.name,
        }));

      res.render("slip", { votedCandidates });
    } catch (err) {
      console.error("Error loading vote slip:", err);
      res.status(500).json({ message: "Error loading vote slip" });
    }
  });

  // Submit issue route
  router.post("/submit-issue", async (req, res) => {
    try {
      const { name, className, problem } = req.body;

      if (!name || !className || !problem) {
        return res.status(400).send("All fields are required");
      }

      const issue = new Issue({
        name,
        className,
        problem,
      });

      await issue.save();

      // Redirect back to login page with success message
      res.render("login", {
        schoolLogo: process.env.SCHOOL_LOGO || "/images/logo.png",
        schoolName: process.env.SCHOOL_NAME || "Yeshua High School",
        errorMessage:
          "Issue submitted successfully. Admin will review it shortly.",
      });
    } catch (err) {
      console.error("Error submitting issue:", err);
      res.render("login", {
        schoolLogo: process.env.SCHOOL_LOGO || "/images/logo.png",
        schoolName: process.env.SCHOOL_NAME || "Yeshua High School",
        errorMessage: "Error submitting issue. Please try again.",
      });
    }
  });

  return router;
};
