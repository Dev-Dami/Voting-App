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
      electionName: election?.name || "General Election",
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

    // Title page
    doc.setFontSize(24);
    doc.setTextColor(30, 30, 100);
    doc.setFont('helvetica', 'bold');
    doc.text(exportData.electionName, 105, 40, null, null, 'center');
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${exportData.startTime} - ${exportData.endTime}`, 105, 60, null, null, 'center');
    doc.text(`Location: ${process.env.SCHOOL_NAME || "Yeshua High School"}`, 105, 70, null, null, 'center');
    
    // Add logo if available
    const logoPath = path.join(__dirname, "../public/images/logo.png");
    if (fs.existsSync(logoPath)) {
      // Convert image to base64 to embed in PDF
      const logoData = fs.readFileSync(logoPath);
      const logoBase64 = logoData.toString('base64');
      doc.addImage(logoBase64, 'PNG', 85, 15, 40, 40);
    }

    // Add a page break after title
    doc.addPage();

    // Summary section
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 100);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY REPORT', 20, 20);

    // Add horizontal line
    doc.setDrawColor(100, 100, 100);
    doc.line(20, 25, 190, 25);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Voters: ${exportData.totalVoters}`, 20, 35);
    doc.text(`Total Votes Cast: ${exportData.totalVotes}`, 20, 45);
    doc.text(`Voter Turnout: ${exportData.turnoutPercentage}%`, 20, 55);
    doc.text(`Winner: ${exportData.winner}`, 20, 65);

    // Add a page break after summary
    doc.addPage();

    // Candidate results section
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 100);
    doc.setFont('helvetica', 'bold');
    doc.text('CANDIDATE RESULTS', 20, 20);

    // Add horizontal line
    doc.setDrawColor(100, 100, 100);
    doc.line(20, 25, 190, 25);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    // If no candidates exist, show message
    if (exportData.candidates.length === 0) {
      doc.text("No candidates registered for this election.", 20, 35);
    } else {
      // Group candidates by position
      const candidatesByPosition = {};
      exportData.candidates.forEach(candidate => {
        if (!candidatesByPosition[candidate.position]) {
          candidatesByPosition[candidate.position] = [];
        }
        candidatesByPosition[candidate.position].push(candidate);
      });

      let yPosition = 35;
      for (const position in candidatesByPosition) {
        // Add position title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${position}`, 20, yPosition);
        yPosition += 8;
        
        // Table headers
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPosition, 170, 8, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text('Candidate', 25, yPosition + 5);
        doc.text('Votes', 130, yPosition + 5);
        doc.text('Percentage', 160, yPosition + 5);
        
        yPosition += 10;
        
        // Add candidate data to table
        const positionCandidates = candidatesByPosition[position];
        for (let i = 0; i < positionCandidates.length; i++) {
          const candidate = positionCandidates[i];
          
          // Check if we need a new page
          if (yPosition > 270) {
            doc.addPage();
            
            // Add section header
            doc.setFontSize(20);
            doc.setTextColor(30, 30, 100);
            doc.setFont('helvetica', 'bold');
            doc.text('CANDIDATE RESULTS (continued)', 20, 20);
            
            // Add horizontal line
            doc.setDrawColor(100, 100, 100);
            doc.line(20, 25, 190, 25);
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            yPosition = 35;
          }

          // Draw alternating row colors
          if (i % 2 === 0) {
            doc.setFillColor(250, 250, 250);
          } else {
            doc.setFillColor(255, 255, 255);
          }
          
          // Highlight winner row
          if (totalVotes > 0 && i === 0) { // Winner is first in the sorted list for this position and only highlight if there are votes
            doc.setFillColor(240, 248, 255); // Light blue highlight
          }
          
          doc.rect(20, yPosition - 5, 170, 8, 'F');
          
          // Text
          doc.setFont('helvetica', 'normal');
          doc.text(candidate.name, 25, yPosition);
          doc.text(candidate.votes.toString(), 130, yPosition);
          doc.text(`${candidate.percentage}%`, 160, yPosition);
          
          yPosition += 10;
        }
        
        // Add some space after each position
        yPosition += 10;
      }
    }

    // Charts page
    doc.addPage();

    // Add charts title
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 100);
    doc.setFont('helvetica', 'bold');
    doc.text('VOTING VISUALIZATION', 20, 20);
    
    // Add horizontal line
    doc.setDrawColor(100, 100, 100);
    doc.line(20, 25, 190, 25);

    // Pie chart visualization
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Vote Share by Position', 20, 35);

    // Calculate positions for each pie chart (by position)
    let chartY = 45;
    const uniquePositions = [...new Set(exportData.candidates.map(c => c.position))];
    const colors = [
      [255, 99, 132], [54, 162, 235], [255, 206, 86], [75, 192, 192], 
      [153, 102, 255], [255, 159, 64], [199, 199, 199], [83, 102, 255]
    ];

    if (uniquePositions.length > 0) {
      for (const position of uniquePositions) {
        const positionCandidates = exportData.candidates.filter(c => c.position === position);
        if (positionCandidates.length === 0) continue;

        // Draw position title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(position, 20, chartY);

        // Calculate total votes for this position
        const totalPositionVotes = positionCandidates.reduce((sum, c) => sum + c.votes, 0);
        
        if (totalPositionVotes > 0) { // Only draw if there are votes
          // Draw pie chart for this position
          const centerX = 105;
          const centerY = chartY + 15;
          const radius = 30;
          
          // Draw pie chart sectors
          let cumulativePercentage = 0;
          for (let i = 0; i < positionCandidates.length; i++) {
            const candidate = positionCandidates[i];
            const percentage = totalPositionVotes > 0 ? (candidate.votes / totalPositionVotes) * 100 : 0;
            const startAngle = cumulativePercentage * 2 * Math.PI / 100;
            cumulativePercentage += percentage;
            const endAngle = cumulativePercentage * 2 * Math.PI / 100;
            
            if (i < colors.length) {
              doc.setFillColor(colors[i][0], colors[i][1], colors[i][2]);
            } else {
              // Use a random color if we run out
              doc.setFillColor(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255));
            }
            
            // Simple sector drawing
            doc.triangle(centerX, centerY, 
                         centerX + radius * Math.cos(startAngle), centerY + radius * Math.sin(startAngle),
                         centerX + radius * Math.cos(endAngle), centerY + radius * Math.sin(endAngle), 'F');
            
            // Draw arc for outline
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);
            doc.ellipse(centerX, centerY, radius, radius, 'D', null, startAngle * 180 / Math.PI, endAngle * 180 / Math.PI);
          }
          
          // Draw center circle to make it look like a proper pie
          doc.setFillColor(255, 255, 255);
          doc.circle(centerX, centerY, radius/4, 'F');
          
          // Add legend for this position
          let legendY = chartY + 35;
          for (let i = 0; i < Math.min(positionCandidates.length, 4); i++) {
            const candidate = positionCandidates[i];
            if (i < colors.length) {
              doc.setFillColor(colors[i][0], colors[i][1], colors[i][2]);
            }
            doc.rect(20, legendY, 5, 5, 'F');
            doc.setDrawColor(0, 0, 0);
            doc.rect(20, legendY, 5, 5);
            doc.setFont('helvetica', 'normal');
            doc.text(`${candidate.name}: ${candidate.percentage}%`, 30, legendY + 4);
            legendY += 7;
          }
          
          chartY = legendY + 10;
        } else {
          doc.setFont('helvetica', 'normal');
          doc.text('No votes recorded for this position', 20, chartY + 15);
          chartY += 25;
        }
        
        // Check if we need a new page
        if (chartY > 250) {
          doc.addPage();
          chartY = 20;
        }
      }
    } else {
      // No candidates message
      doc.setFont('helvetica', 'normal');
      doc.text('No candidates registered for this election.', 20, chartY);
    }

    // Add footer with the required format from exportdataformat.md
    const pageWidth = doc.internal.pageSize.width;
    const footerY = doc.internal.pageSize.height - 10;
    
    doc.setFontSize(10);
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
      electionName: election?.name || "General Election",
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

    // Title page
    doc.setFontSize(24);
    doc.setTextColor(30, 30, 100);
    doc.setFont('helvetica', 'bold');
    doc.text(exportData.electionName, 105, 40, null, null, 'center');
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${exportData.startTime} - ${exportData.endTime}`, 105, 60, null, null, 'center');
    doc.text(`Location: ${process.env.SCHOOL_NAME || "Yeshua High School"}`, 105, 70, null, null, 'center');
    
    // Add logo if available
    const logoPath = path.join(__dirname, "../public/images/logo.png");
    if (fs.existsSync(logoPath)) {
      // Convert image to base64 to embed in PDF
      const logoData = fs.readFileSync(logoPath);
      const logoBase64 = logoData.toString('base64');
      doc.addImage(logoBase64, 'PNG', 85, 15, 40, 40);
    }

    // Add a page break after title
    doc.addPage();

    // Summary section
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 100);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY REPORT', 20, 20);

    // Add horizontal line
    doc.setDrawColor(100, 100, 100);
    doc.line(20, 25, 190, 25);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Voters: ${exportData.totalVoters}`, 20, 35);
    doc.text(`Total Votes Cast: ${exportData.totalVotes}`, 20, 45);
    doc.text(`Voter Turnout: ${exportData.turnoutPercentage}%`, 20, 55);
    doc.text(`Winner: ${exportData.winner}`, 20, 65);

    // Add a page break after summary
    doc.addPage();

    // Candidate results section
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 100);
    doc.setFont('helvetica', 'bold');
    doc.text('CANDIDATE RESULTS', 20, 20);

    // Add horizontal line
    doc.setDrawColor(100, 100, 100);
    doc.line(20, 25, 190, 25);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    // If no candidates exist, show message
    if (exportData.candidates.length === 0) {
      doc.text("No candidates registered for this election.", 20, 35);
    } else {
      // Group candidates by position
      const candidatesByPosition = {};
      exportData.candidates.forEach(candidate => {
        if (!candidatesByPosition[candidate.position]) {
          candidatesByPosition[candidate.position] = [];
        }
        candidatesByPosition[candidate.position].push(candidate);
      });

      let yPosition = 35;
      for (const position in candidatesByPosition) {
        // Add position title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${position}`, 20, yPosition);
        yPosition += 8;
        
        // Table headers
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPosition, 170, 8, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text('Candidate', 25, yPosition + 5);
        doc.text('Votes', 130, yPosition + 5);
        doc.text('Percentage', 160, yPosition + 5);
        
        yPosition += 10;
        
        // Add candidate data to table
        const positionCandidates = candidatesByPosition[position];
        for (let i = 0; i < positionCandidates.length; i++) {
          const candidate = positionCandidates[i];
          
          // Check if we need a new page
          if (yPosition > 270) {
            doc.addPage();
            
            // Add section header
            doc.setFontSize(20);
            doc.setTextColor(30, 30, 100);
            doc.setFont('helvetica', 'bold');
            doc.text('CANDIDATE RESULTS (continued)', 20, 20);
            
            // Add horizontal line
            doc.setDrawColor(100, 100, 100);
            doc.line(20, 25, 190, 25);
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            yPosition = 35;
          }

          // Draw alternating row colors
          if (i % 2 === 0) {
            doc.setFillColor(250, 250, 250);
          } else {
            doc.setFillColor(255, 255, 255);
          }
          
          // Highlight winner row
          if (totalVotes > 0 && i === 0) { // Winner is first in the sorted list for this position and only highlight if there are votes
            doc.setFillColor(240, 248, 255); // Light blue highlight
          }
          
          doc.rect(20, yPosition - 5, 170, 8, 'F');
          
          // Text
          doc.setFont('helvetica', 'normal');
          doc.text(candidate.name, 25, yPosition);
          doc.text(candidate.votes.toString(), 130, yPosition);
          doc.text(`${candidate.percentage}%`, 160, yPosition);
          
          yPosition += 10;
        }
        
        // Add some space after each position
        yPosition += 10;
      }
    }

    // Charts page
    doc.addPage();

    // Add charts title
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 100);
    doc.setFont('helvetica', 'bold');
    doc.text('VOTING VISUALIZATION', 20, 20);
    
    // Add horizontal line
    doc.setDrawColor(100, 100, 100);
    doc.line(20, 25, 190, 25);

    // Pie chart visualization
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Vote Share by Position', 20, 35);

    // Calculate positions for each pie chart (by position)
    let chartY = 45;
    const uniquePositions = [...new Set(exportData.candidates.map(c => c.position))];
    const colors = [
      [255, 99, 132], [54, 162, 235], [255, 206, 86], [75, 192, 192], 
      [153, 102, 255], [255, 159, 64], [199, 199, 199], [83, 102, 255]
    ];

    if (uniquePositions.length > 0) {
      for (const position of uniquePositions) {
        const positionCandidates = exportData.candidates.filter(c => c.position === position);
        if (positionCandidates.length === 0) continue;

        // Draw position title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(position, 20, chartY);

        // Calculate total votes for this position
        const totalPositionVotes = positionCandidates.reduce((sum, c) => sum + c.votes, 0);
        
        if (totalPositionVotes > 0) { // Only draw if there are votes
          // Draw pie chart for this position
          const centerX = 105;
          const centerY = chartY + 15;
          const radius = 30;
          
          // Draw pie chart sectors
          let cumulativePercentage = 0;
          for (let i = 0; i < positionCandidates.length; i++) {
            const candidate = positionCandidates[i];
            const percentage = totalPositionVotes > 0 ? (candidate.votes / totalPositionVotes) * 100 : 0;
            const startAngle = cumulativePercentage * 2 * Math.PI / 100;
            cumulativePercentage += percentage;
            const endAngle = cumulativePercentage * 2 * Math.PI / 100;
            
            if (i < colors.length) {
              doc.setFillColor(colors[i][0], colors[i][1], colors[i][2]);
            } else {
              // Use a random color if we run out
              doc.setFillColor(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255));
            }
            
            // Simple sector drawing
            doc.triangle(centerX, centerY, 
                         centerX + radius * Math.cos(startAngle), centerY + radius * Math.sin(startAngle),
                         centerX + radius * Math.cos(endAngle), centerY + radius * Math.sin(endAngle), 'F');
            
            // Draw arc for outline
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);
            doc.ellipse(centerX, centerY, radius, radius, 'D', null, startAngle * 180 / Math.PI, endAngle * 180 / Math.PI);
          }
          
          // Draw center circle to make it look like a proper pie
          doc.setFillColor(255, 255, 255);
          doc.circle(centerX, centerY, radius/4, 'F');
          
          // Add legend for this position
          let legendY = chartY + 35;
          for (let i = 0; i < Math.min(positionCandidates.length, 4); i++) {
            const candidate = positionCandidates[i];
            if (i < colors.length) {
              doc.setFillColor(colors[i][0], colors[i][1], colors[i][2]);
            }
            doc.rect(20, legendY, 5, 5, 'F');
            doc.setDrawColor(0, 0, 0);
            doc.rect(20, legendY, 5, 5);
            doc.setFont('helvetica', 'normal');
            doc.text(`${candidate.name}: ${candidate.percentage}%`, 30, legendY + 4);
            legendY += 7;
          }
          
          chartY = legendY + 10;
        } else {
          doc.setFont('helvetica', 'normal');
          doc.text('No votes recorded for this position', 20, chartY + 15);
          chartY += 25;
        }
        
        // Check if we need a new page
        if (chartY > 250) {
          doc.addPage();
          chartY = 20;
        }
      }
    } else {
      // No candidates message
      doc.setFont('helvetica', 'normal');
      doc.text('No candidates registered for this election.', 20, chartY);
    }

    // Add footer with the required format from exportdataformat.md
    const pageWidth = doc.internal.pageSize.width;
    const footerY = doc.internal.pageSize.height - 10;
    
    doc.setFontSize(10);
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