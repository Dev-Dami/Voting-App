const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");
const Student = require("../models/Student");
const Candidate = require("../models/Candidate");
const VoteLog = require("../models/voteLogs");
const Election = require("../models/Election");

/**
 * Function to export election results as a PDF (for download)
 */
const exportElectionResultsPDF = async (req, res) => {
  try {
    // Get all necessary data
    const students = await Student.find();
    const candidates = await Candidate.find().sort({ votes: -1 });
    const voteLogs = await VoteLog.find();
    const election = await Election.findOne();

    // Calculate summary data - handle case where there are no votes
    const totalVoters = students.length;
    const totalVotes = voteLogs.length;
    const turnoutPercentage = totalVoters > 0 
      ? Math.round((totalVotes / totalVoters) * 100 * 100) / 100 
      : 0;

    // Find the winner - handle case where there are no votes
    const winner = candidates.length > 0 && totalVotes > 0 ? candidates[0] : null;

    // Prepare data for PDF
    const exportData = {
      electionName: election?.name || "Yeshua High School Election",
      electionStatus: election?.status || "Ended",
      startTime: election?.startTime ? new Date(election.startTime).toLocaleDateString() : "N/A",
      endTime: election?.endTime ? new Date(election.endTime).toLocaleDateString() : "N/A",
      totalVoters,
      totalVotes,
      turnoutPercentage,
      winner: winner ? winner.name : "No winner",
      candidates: candidates.map(candidate => {
        // Calculate percentage for each candidate - handle case where there are no votes
        const percentage = totalVotes > 0 
          ? Math.round((candidate.votes / totalVotes) * 100 * 100) / 100 
          : 0;
        
        return {
          name: candidate.name,
          image: candidate.image,
          votes: candidate.votes,
          percentage: percentage,
          position: candidate.position
        };
      })
    };

    // Create PDF
    const doc = new jsPDF('p', 'mm', 'a4');

    // Simple Header with school name, election title, and logo
    // Add logo if available
    const logoPath = path.join(__dirname, "../public/images/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.addImage(logoPath, 'PNG', 20, 15, 30, 30);
    }

    // School Name
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text("Yeshua High School", 105, 20, null, null, 'center');
    
    // Election title
    doc.setFontSize(18);
    doc.text(exportData.electionName, 105, 32, null, null, 'center');
    
    // Date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${exportData.startTime} - ${exportData.endTime}`, 105, 42, null, null, 'center');
    
    // Add horizontal line after header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(20, 50, 190, 50);

    // Summary section
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('ELECTION SUMMARY', 20, 60);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Voters: ${exportData.totalVoters}`, 20, 70);
    doc.text(`Total Votes Cast: ${exportData.totalVotes}`, 20, 80);
    doc.text(`Voter Turnout: ${exportData.turnoutPercentage}%`, 20, 90);
    doc.text(`Winner: ${exportData.winner}`, 20, 100);

    // Add some spacing before candidates section
    let yPosition = 115;

    // Group candidates by position (as they should be in a school election)
    const candidatesByPosition = {};
    exportData.candidates.forEach(candidate => {
      if (!candidatesByPosition[candidate.position]) {
        candidatesByPosition[candidate.position] = [];
      }
      candidatesByPosition[candidate.position].push(candidate);
    });

    // Add section for each position with proper spacing
    for (const position in candidatesByPosition) {
      // Add position title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${position.toUpperCase()}`, 20, yPosition);
      yPosition += 8;

      // Add candidate grid for this position
      const positionCandidates = candidatesByPosition[position];
      for (let i = 0; i < positionCandidates.length; i++) {
        const candidate = positionCandidates[i];
        
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20; // Start at top of new page
        }

        // Add candidate image if available
        if (candidate.image && candidate.image.startsWith('/')) {
          try {
            const imagePath = path.join(__dirname, "..", candidate.image);
            if (fs.existsSync(imagePath)) {
              // Add image to the left of candidate name
              doc.addImage(imagePath, 'JPEG', 20, yPosition - 5, 10, 10);
            }
          } catch (e) {
            console.log("Could not add candidate image:", e);
          }
        }

        // Add candidate name, votes, and percentage
        doc.setFont('helvetica', 'normal');
        doc.text(`${candidate.name}`, 35, yPosition); // Name to the right of image
        doc.text(`Votes: ${candidate.votes}`, 130, yPosition); // Votes on the right side
        doc.text(`${candidate.percentage}%`, 170, yPosition); // Percentage at far right
        
        yPosition += 12; // More spacing between candidates
      }
      
      // Add extra spacing between different positions
      yPosition += 10;
    }

    // Add footer with the required format
    const pageWidth = doc.internal.pageSize.width;
    const footerY = doc.internal.pageSize.height - 10;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, footerY);
    doc.text('Yeshua Voting Board', pageWidth/2, footerY, null, null, 'center');
    doc.text('(made by Yeshua voting board)', pageWidth - 20, footerY, null, null, 'right');

    // Send PDF as response
    const fileName = `election-results-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    
    doc.save(fileName, { returnPromise: true });
  } catch (err) {
    console.error("Error exporting PDF:", err);
    res.status(500).json({ message: "Error exporting PDF" });
  }
};

/**
 * Function to generate PDF data for viewing (not attachment)
 */
const generatePDFData = async () => {
  try {
    // Get all necessary data
    const students = await Student.find();
    const candidates = await Candidate.find().sort({ votes: -1 });
    const voteLogs = await VoteLog.find();
    const election = await Election.findOne();

    // Calculate summary data - handle case where there are no votes
    const totalVoters = students.length;
    const totalVotes = voteLogs.length;
    const turnoutPercentage = totalVoters > 0 
      ? Math.round((totalVotes / totalVoters) * 100 * 100) / 100 
      : 0;

    // Find the winner - handle case where there are no votes
    const winner = candidates.length > 0 && totalVotes > 0 ? candidates[0] : null;

    // Prepare data for PDF
    const exportData = {
      electionName: election?.name || "Yeshua High School Election",
      electionStatus: election?.status || "Ended",
      startTime: election?.startTime ? new Date(election.startTime).toLocaleDateString() : "N/A",
      endTime: election?.endTime ? new Date(election.endTime).toLocaleDateString() : "N/A",
      totalVoters,
      totalVotes,
      turnoutPercentage,
      winner: winner ? winner.name : "No winner",
      candidates: candidates.map(candidate => {
        // Calculate percentage for each candidate - handle case where there are no votes
        const percentage = totalVotes > 0 
          ? Math.round((candidate.votes / totalVotes) * 100 * 100) / 100 
          : 0;
        
        return {
          name: candidate.name,
          image: candidate.image,
          votes: candidate.votes,
          percentage: percentage,
          position: candidate.position
        };
      })
    };

    // Create PDF
    const doc = new jsPDF('p', 'mm', 'a4');

    // Simple Header with school name, election title, and logo
    // Add logo if available
    const logoPath = path.join(__dirname, "../public/images/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.addImage(logoPath, 'PNG', 20, 15, 30, 30);
    }

    // School Name
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text("Yeshua High School", 105, 20, null, null, 'center');
    
    // Election title
    doc.setFontSize(18);
    doc.text(exportData.electionName, 105, 32, null, null, 'center');
    
    // Date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${exportData.startTime} - ${exportData.endTime}`, 105, 42, null, null, 'center');
    
    // Add horizontal line after header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(20, 50, 190, 50);

    // Summary section
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('ELECTION SUMMARY', 20, 60);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Voters: ${exportData.totalVoters}`, 20, 70);
    doc.text(`Total Votes Cast: ${exportData.totalVotes}`, 20, 80);
    doc.text(`Voter Turnout: ${exportData.turnoutPercentage}%`, 20, 90);
    doc.text(`Winner: ${exportData.winner}`, 20, 100);

    // Add some spacing before candidates section
    let yPosition = 115;

    // Group candidates by position (as they should be in a school election)
    const candidatesByPosition = {};
    exportData.candidates.forEach(candidate => {
      if (!candidatesByPosition[candidate.position]) {
        candidatesByPosition[candidate.position] = [];
      }
      candidatesByPosition[candidate.position].push(candidate);
    });

    // Add section for each position with proper spacing
    for (const position in candidatesByPosition) {
      // Add position title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${position.toUpperCase()}`, 20, yPosition);
      yPosition += 8;

      // Add candidate grid for this position
      const positionCandidates = candidatesByPosition[position];
      for (let i = 0; i < positionCandidates.length; i++) {
        const candidate = positionCandidates[i];
        
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20; // Start at top of new page
        }

        // Add candidate image if available
        if (candidate.image && candidate.image.startsWith('/')) {
          try {
            const imagePath = path.join(__dirname, "..", candidate.image);
            if (fs.existsSync(imagePath)) {
              // Add image to the left of candidate name
              doc.addImage(imagePath, 'JPEG', 20, yPosition - 5, 10, 10);
            }
          } catch (e) {
            console.log("Could not add candidate image:", e);
          }
        }

        // Add candidate name, votes, and percentage
        doc.setFont('helvetica', 'normal');
        doc.text(`${candidate.name}`, 35, yPosition); // Name to the right of image
        doc.text(`Votes: ${candidate.votes}`, 130, yPosition); // Votes on the right side
        doc.text(`${candidate.percentage}%`, 170, yPosition); // Percentage at far right
        
        yPosition += 12; // More spacing between candidates
      }
      
      // Add extra spacing between different positions
      yPosition += 10;
    }

    // Add footer with the required format
    const pageWidth = doc.internal.pageSize.width;
    const footerY = doc.internal.pageSize.height - 10;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, footerY);
    doc.text('Yeshua Voting Board', pageWidth/2, footerY, null, null, 'center');
    doc.text('(made by Yeshua voting board)', pageWidth - 20, footerY, null, null, 'right');

    // Return PDF data as data URI string
    return doc.output('datauristring');
  } catch (err) {
    console.error("Error generating PDF data:", err);
    throw err;
  }
};

module.exports = {
  exportElectionResultsPDF,
  generatePDFData
};