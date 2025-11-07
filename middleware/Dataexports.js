const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");
const Student = require("../models/Student");
const Candidate = require("../models/Candidate");
const VoteLog = require("../models/voteLogs");
const Election = require("../models/Election");



/**
 * Function to get election data for display (for HTML preview)
 */
const getElectionData = async () => {
  try {
    // Load data in parallel with optimized queries
    const [students, candidates, voteLogs, election] = await Promise.all([
      Student.countDocuments(), // Only get count instead of all documents
      Candidate.find().sort({ votes: -1 }).select('name image votes position').lean(),
      VoteLog.countDocuments(), // Only get count instead of all documents
      Election.findOne()
    ]);

    // Calculate summary data - handle case where there are no votes
    const totalVoters = students; // Now it's the count
    const totalVotes = voteLogs; // Now it's the count
    const turnoutPercentage = totalVoters > 0 
      ? Math.round((totalVotes / totalVoters) * 100 * 100) / 100 
      : 0;

    // Find the winner - handle case where there are no votes
    const winner = candidates.length > 0 && totalVotes > 0 ? candidates[0] : null;

    // Group candidates by position to calculate percentages correctly
    const candidatesByPosition = {};
    candidates.forEach(candidate => {
      if (!candidatesByPosition[candidate.position]) {
        candidatesByPosition[candidate.position] = [];
      }
      candidatesByPosition[candidate.position].push(candidate);
    });

    // Calculate total votes per position for percentage calculation
    const positionTotalVotes = {};
    for (const position in candidatesByPosition) {
      positionTotalVotes[position] = candidatesByPosition[position].reduce((sum, candidate) => sum + candidate.votes, 0);
    }

    // Prepare data for display
    const displayData = {
      electionName: election?.name || "Yeshua High School Election",
      electionStatus: election?.status || "Ended",
      startTime: election?.startTime ? new Date(election.startTime).toLocaleDateString() : "N/A",
      endTime: election?.endTime ? new Date(election.endTime).toLocaleDateString() : "N/A",
      totalVoters,
      totalVotes,
      turnoutPercentage,
      candidates: candidates.map(candidate => {
        // Calculate percentage for each candidate based on votes for their position - handle case where there are no votes for this position
        const positionTotal = positionTotalVotes[candidate.position] || 0;
        const percentage = positionTotal > 0 
          ? Math.round((candidate.votes / positionTotal) * 100 * 100) / 100 
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

    // Find winners for each position
    const candidatesByPositionDisplay = {};
    candidates.forEach(candidate => {
      if (!candidatesByPositionDisplay[candidate.position]) {
        candidatesByPositionDisplay[candidate.position] = [];
      }
      candidatesByPositionDisplay[candidate.position].push(candidate);
    });

    // Determine winner for each position (candidate with most votes in that position)
    const positionWinners = {};
    for (const position in candidatesByPositionDisplay) {
      const positionCandidates = candidatesByPositionDisplay[position];
      // Sort by votes descending and take the first one
      positionCandidates.sort((a, b) => b.votes - a.votes);
      if (positionCandidates.length > 0 && positionCandidates[0].votes > 0) {
        positionWinners[position] = positionCandidates[0]; // The one with most votes
      } else {
        // Set placeholder for positions with no votes yet
        positionWinners[position] = {
          name: "No votes yet",
          votes: 0,
          percentage: 0
        };
      }
    }

    displayData.positionWinners = positionWinners;

    return displayData;
  } catch (err) {
    console.error("Error getting election data:", err);
    throw err;
  }
};

/**
 * Function to generate PDF data for viewing (not attachment)
 * This now returns the PDF as data URI string
 */
const generatePDFData = async () => {
  try {
    // Load data in parallel with optimized queries
    const [students, candidates, voteLogs, election] = await Promise.all([
      Student.countDocuments(), // Only get count instead of all documents
      Candidate.find().sort({ votes: -1 }).select('name image votes position').lean(),
      VoteLog.countDocuments(), // Only get count instead of all documents
      Election.findOne()
    ]);

    // Calculate summary data - handle case where there are no votes
    const totalVoters = students; // Now it's the count
    const totalVotes = voteLogs; // Now it's the count
    const turnoutPercentage = totalVoters > 0 
      ? Math.round((totalVotes / totalVoters) * 100 * 100) / 100 
      : 0;

    // Group candidates by position to calculate percentages correctly for PDF
    const candidatesByPositionPDF = {};
    candidates.forEach(candidate => {
      if (!candidatesByPositionPDF[candidate.position]) {
        candidatesByPositionPDF[candidate.position] = [];
      }
      candidatesByPositionPDF[candidate.position].push(candidate);
    });

    // Calculate total votes per position for percentage calculation in PDF
    const positionTotalVotesPDF = {};
    for (const position in candidatesByPositionPDF) {
      positionTotalVotesPDF[position] = candidatesByPositionPDF[position].reduce((sum, candidate) => sum + candidate.votes, 0);
    }

    // Prepare data for PDF
    const exportData = {
      electionName: election?.name || "Yeshua High School Election",
      electionStatus: election?.status || "Ended",
      startTime: election?.startTime ? new Date(election.startTime).toLocaleDateString() : "N/A",
      endTime: election?.endTime ? new Date(election.endTime).toLocaleDateString() : "N/A",
      totalVoters,
      totalVotes,
      turnoutPercentage,
      candidates: candidates.map(candidate => {
        // Calculate percentage for each candidate based on votes for their position - handle case where there are no votes for this position
        const positionTotal = positionTotalVotesPDF[candidate.position] || 0;
        const percentage = positionTotal > 0 
          ? Math.round((candidate.votes / positionTotal) * 100 * 100) / 100 
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

    // Find winners for each position - use different variable name to avoid conflict
    const candidatesByPositionWinners = {};
    candidates.forEach(candidate => {
      if (!candidatesByPositionWinners[candidate.position]) {
        candidatesByPositionWinners[candidate.position] = [];
      }
      candidatesByPositionWinners[candidate.position].push(candidate);
    });

    // Determine winner for each position (candidate with most votes in that position)
    const positionWinners = {};
    for (const position in candidatesByPositionWinners) {
      const positionCandidates = candidatesByPositionWinners[position];
      // Sort by votes descending and take the first one
      positionCandidates.sort((a, b) => b.votes - a.votes);
      if (positionCandidates.length > 0 && positionCandidates[0].votes > 0) {
        positionWinners[position] = positionCandidates[0]; // The one with most votes
      } else {
        // Set placeholder for positions with no votes yet
        positionWinners[position] = {
          name: "No votes yet",
          votes: 0,
          percentage: 0
        };
      }
    }

    exportData.positionWinners = positionWinners;

    // Create PDF
    const doc = new jsPDF('p', 'mm', 'a4');

    // Reset to normal settings for content (watermark will be added at the end to each page)
    doc.setTextColor(0, 0, 0); // Black for normal text
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    
    // Simple Header with school name, election title, and logo
    // Add logo if available
    try {
      const logoPath = path.join(__dirname, "../public/images/logo.png");
      if (fs.existsSync(logoPath)) {
        doc.addImage(logoPath, 'PNG', 20, 15, 30, 30);
      }
    } catch (e) {
      // Skip logo if there's an error loading it
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
    doc.text(`Total Voted: ${exportData.totalVotes}`, 20, 80);
    doc.text(`Voter Turnout: ${exportData.turnoutPercentage}%`, 20, 90);
    
    // Add winners for each position instead of single winner
    let summaryY = 90;
    doc.text('Position Winners:', 20, summaryY);
    summaryY += 10;
    
    // Show top winner for each position
    const positions = Object.keys(exportData.positionWinners);
    for (let i = 0; i < Math.min(positions.length, 4); i++) { // Limit to first 4 positions to fit
      const position = positions[i];
      const winner = exportData.positionWinners[position];
      doc.text(`${position}: ${winner.name}`, 25, summaryY);
      summaryY += 8;
    }
    
    if (positions.length > 4) {
      doc.text(`... and ${positions.length - 4} more positions`, 25, summaryY);
      summaryY += 8;
    }

    // Add some spacing before candidates section
    let yPosition = summaryY + 25;

    // Group candidates by position (as they should be in a school election)
    const candidatesByPositionForDisplay = {};
    exportData.candidates.forEach(candidate => {
      if (!candidatesByPositionForDisplay[candidate.position]) {
        candidatesByPositionForDisplay[candidate.position] = [];
      }
      candidatesByPositionForDisplay[candidate.position].push(candidate);
    });

    // Add section for each position with proper spacing
    for (const position in candidatesByPositionForDisplay) {
      // Add position title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${position.toUpperCase()}`, 20, yPosition);
      yPosition += 8;

      // Add candidate grid for this position
      const positionCandidates = candidatesByPositionForDisplay[position];
      for (let i = 0; i < positionCandidates.length; i++) {
        const candidate = positionCandidates[i];
        
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          
          // Add watermark to the new page
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;
          
          // Save current settings
          const currentTextColor = doc.getTextColor();
          const currentFontSize = doc.getFontSize();
          const currentFont = doc.getFont();
          
          // Draw watermark on new page
          doc.setFontSize(80);
          doc.setTextColor(220, 220, 220); // Light gray
          doc.text("Yeshua Election Board", pageWidth/2, pageHeight/2, {
              align: "center",
              angle: 45
          });
          
          // Restore original settings
          doc.setTextColor(currentTextColor);
          doc.setFontSize(currentFontSize);
          doc.setFont(currentFont.fontName, currentFont.fontStyle);
          
          yPosition = 20; // Start at top of new page
        }

        // Add candidate image if available (add only the first 100x100px to save memory)
        if (candidate.image && candidate.image.startsWith('/')) {
          try {
            const imagePath = path.join(__dirname, "..", candidate.image);
            if (fs.existsSync(imagePath)) {
              // Determine image format based on file extension
              const ext = path.extname(imagePath).toLowerCase();
              let format = 'JPEG'; // default
              if (ext === '.png') format = 'PNG';
              else if (ext === '.jpeg' || ext === '.jpg') format = 'JPEG';
              else if (ext === '.gif') format = 'GIF';
              
              // Add image to the left of candidate name
              doc.addImage(imagePath, format, 20, yPosition - 5, 10, 10);
            }
          } catch (e) {
            // Skip image if there's an error - don't break the PDF
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

    // Add watermark to all pages at the very end after all content
    const totalPages = doc.internal.getNumberOfPages();
    const originalPage = doc.internal.getCurrentPageInfo().pageNumber;
    
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Set watermark style
        doc.setTextColor(220, 220, 220); // Light gray
        doc.setFontSize(80);
        
        // Draw the watermark text diagonally across the page
        const centerX = pageWidth / 2;
        const centerY = doc.internal.pageSize.height / 2;
        
        doc.text("Yeshua Election Board", centerX, centerY, {
            align: "center",
            angle: 45
        });
    }
    
    // Return to the original page
    doc.setPage(originalPage);

    // Return PDF data as data URI string
    return doc.output('datauristring');
  } catch (err) {
    console.error("Error generating PDF data for view:", err);
    throw err;
  }
};

module.exports = {
  generatePDFData,
  getElectionData
};