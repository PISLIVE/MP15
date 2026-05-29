const { mdToPdf } = require('md-to-pdf');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  console.log("Starting PDF generation...");
  
  // Path to the markdown file
  // Please ensure the Markdown file is in the same directory, or update the path below
  const mdFilePath = path.join(__dirname, 'Digital_Footprint_Analyzer_Report.md');
  const pdfFilePath = path.join(__dirname, 'Digital_Footprint_Analyzer_Report.pdf');

  if (!fs.existsSync(mdFilePath)) {
    console.error(`Error: Could not find ${mdFilePath}`);
    console.log("Please copy the Markdown file into this directory and try again.");
    process.exit(1);
  }

  try {
    const pdf = await mdToPdf(
      { path: mdFilePath }, 
      {
        dest: pdfFilePath,
        pdf_options: { 
          format: 'A4', 
          margin: '20mm',
          printBackground: true
        }
      }
    );

    if (pdf) {
      console.log(`✅ Success! Your highly detailed PDF report is ready at:`);
      console.log(`   ${pdfFilePath}`);
    }
  } catch (error) {
    console.error("❌ Failed to generate PDF:", error);
    console.log("\nMake sure you have installed md-to-pdf by running:");
    console.log("npm install md-to-pdf");
  }
}

generatePDF();
