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
  const puppeteer = require('puppeteer');
  
  try {
    // Get the election data to render the same HTML as the view-pdf page
    const [students, candidates, voteLogs, election] = await Promise.all([
      Student.countDocuments(),
      Candidate.find().sort({ votes: -1 }).select('name image votes position').lean(),
      VoteLog.countDocuments(),
      Election.findOne()
    ]);

    // Calculate summary data
    const totalVoters = students;
    const totalVotes = voteLogs;
    const turnoutPercentage = totalVoters > 0 
      ? Math.round((totalVotes / totalVoters) * 100 * 100) / 100 
      : 0;

    // Prepare data to match what's used in the getElectionData function
    const electionData = {
      electionName: election?.name || "Yeshua High School Election",
      electionStatus: election?.status || "Ended",
      startTime: election?.startTime ? new Date(election.startTime).toLocaleDateString() : "N/A",
      endTime: election?.endTime ? new Date(election.endTime).toLocaleDateString() : "N/A",
      totalVoters,
      totalVotes,
      turnoutPercentage,
      candidates: candidates.map(candidate => {
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

    // Find winners for each position
    const candidatesByPosition = {};
    candidates.forEach(candidate => {
      if (!candidatesByPosition[candidate.position]) {
        candidatesByPosition[candidate.position] = [];
      }
      candidatesByPosition[candidate.position].push(candidate);
    });

    const positionWinners = {};
    for (const position in candidatesByPosition) {
      const positionCandidates = candidatesByPosition[position];
      positionCandidates.sort((a, b) => b.votes - a.votes);
      if (positionCandidates.length > 0 && positionCandidates[0].votes > 0) {
        positionWinners[position] = positionCandidates[0];
      } else {
        positionWinners[position] = {
          name: "No votes yet",
          votes: 0,
          percentage: 0
        };
      }
    }

    electionData.positionWinners = positionWinners;

    // Generate the same HTML as in the view-pdf route
    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PDF Preview - Election Results</title>
        <style>
            body {
                font-family: 'Inter', sans-serif;
                background-color: #f3f4f6;
                margin: 0;
                padding: 20px;
            }
            .pdf-container {
                background-color: white;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                overflow: hidden;
                margin: 0 auto;
                max-width: 900px;
            }
            .header {
                background: linear-gradient(135deg, #b91c1c, #dc2626);
                color: white;
                padding: 20px;
                text-align: center;
            }
            .controls {
                background-color: #f8fafc;
                padding: 15px;
                border-bottom: 1px solid #e5e7eb;
            }
            .preview-content {
                padding: 30px;
            }
            .summary-card {
                background-color: #f9fafb;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .candidate-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }
            .candidate-card {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 15px;
                display: flex;
                align-items: center;
                gap: 15px;
            }
            .candidate-image {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                object-fit: cover;
            }
            .candidate-info {
                flex: 1;
            }
            .position-header {
                background-color: #f3f4f6;
                padding: 10px 15px;
                margin: 20px 0 10px 0;
                border-left: 4px solid #dc2626;
                font-weight: bold;
                font-size: 1.1em;
            }
            .action-buttons {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }
            .btn {
                padding: 10px 20px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                border: none;
                text-decoration: none;
                display: inline-block;
            }
            .btn-download {
                background-color: #1d4ed8;
                color: white;
            }
            .btn-download:hover {
                background-color: #1e40af;
            }
            .btn-back {
                background-color: #6b7280;
                color: white;
            }
            .btn-back:hover {
                background-color: #4b5563;
            }
        </style>
    </head>
    <body class="bg-gray-100">
        <div class="pdf-container">
            <div class="header">
                <h1 class="text-2xl font-bold">Yeshua High School</h1>
                <h2 class="text-xl mt-2">${electionData.electionName}</h2>
                <p class="text-red-100 mt-1">Date: ${electionData.startTime} - ${electionData.endTime}</p>
            </div>
            
            <div class="controls">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 class="text-lg font-semibold text-gray-800">Election Results Report</h2>
                        <p class="text-sm text-gray-600">Generated on ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <div class="action-buttons mt-3 md:mt-0" style="display: none;">
                        <button class="btn btn-download" style="display: none;">
                            Download PDF
                        </button>
                        <button class="btn btn-back" style="display: none;">
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="preview-content">
                <div class="summary-card">
                    <h3 class="text-lg font-bold mb-3">ELECTION SUMMARY</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">Total Voters</p>
                            <p class="text-xl font-bold">${electionData.totalVoters}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Voted</p>
                            <p class="text-xl font-bold">${electionData.totalVotes}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Turnout</p>
                            <p class="text-xl font-bold">${electionData.turnoutPercentage}%</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Positions</p>
                            <p class="text-xl font-bold">${Object.keys(electionData.positionWinners || {}).length}</p>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <h4 class="font-semibold mb-2">Position Winners:</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                        ${Object.keys(electionData.positionWinners).map(position => {
                          const winner = electionData.positionWinners[position];
                          return `
                            <div class="flex justify-between border-b pb-1">
                                <span class="font-medium">${position}:</span>
                                <span>${winner.name}</span>
                            </div>
                          `;
                        }).join('')}
                        </div>
                    </div>
                </div>
                
                <h3 class="text-xl font-bold mb-4 mt-6">CANDIDATE RESULTS</h3>
                
                ${
                  (() => {
                    // Group candidates by position
                    const candidatesByPositionHtml = {};
                    electionData.candidates.forEach(candidate => {
                      if (!candidatesByPositionHtml[candidate.position]) {
                        candidatesByPositionHtml[candidate.position] = [];
                      }
                      candidatesByPositionHtml[candidate.position].push(candidate);
                    });
                    
                    return Object.keys(candidatesByPositionHtml).map(position => `
                        <div class="position-header">
                            ${position.toUpperCase()}
                        </div>
                        
                        <div class="candidate-grid">
                        ${candidatesByPositionHtml[position].map(candidate => `
                            <div class="candidate-card">
                                ${candidate.image ? 
                                    `<img src="http://localhost:3000${candidate.image}" alt="${candidate.name}" class="candidate-image" onerror="this.onerror=null; this.src='http://localhost:3000/images/default-candidate.jpg';">`
                                  : 
                                    `<div style="width: 50px; height: 50px; border-radius: 50%; background-color: #e5e7eb;"></div>`
                                }
                                <div class="candidate-info">
                                    <div class="font-semibold">${candidate.name}</div>
                                    <div class="text-sm text-gray-600">Votes: ${candidate.votes}</div>
                                    <div class="text-sm text-gray-600">Percentage: ${candidate.percentage}%</div>
                                </div>
                            </div>
                        `).join('')}
                        </div>
                    `).join('')
                })()
                }
            </div>
        </div>
    </body>
    </html>`;

    // Launch puppeteer to convert HTML to PDF
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    
    // Set the content of the page to the generated HTML
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: true
    });
    
    await browser.close();

    // Send the PDF as a download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=election-results-${Date.now()}.pdf`);
    res.send(pdf);
  } catch (err) {
    console.error("Error exporting PDF:", err);
    res.status(500).json({ message: "Error exporting PDF" });
  }
};

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

    // Find winners for each position
    const candidatesByPosition = {};
    candidates.forEach(candidate => {
      if (!candidatesByPosition[candidate.position]) {
        candidatesByPosition[candidate.position] = [];
      }
      candidatesByPosition[candidate.position].push(candidate);
    });

    // Determine winner for each position (candidate with most votes in that position)
    const positionWinners = {};
    for (const position in candidatesByPosition) {
      const positionCandidates = candidatesByPosition[position];
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

    // Find winners for each position
    const candidatesByPosition = {};
    candidates.forEach(candidate => {
      if (!candidatesByPosition[candidate.position]) {
        candidatesByPosition[candidate.position] = [];
      }
      candidatesByPosition[candidate.position].push(candidate);
    });

    // Determine winner for each position (candidate with most votes in that position)
    const positionWinners = {};
    for (const position in candidatesByPosition) {
      const positionCandidates = candidatesByPosition[position];
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

    // Return PDF data as data URI string
    return doc.output('datauristring');
  } catch (err) {
    console.error("Error generating PDF data for view:", err);
    throw err;
  }
};

module.exports = {
  exportElectionResultsPDF,
  generatePDFData,
  getElectionData
};