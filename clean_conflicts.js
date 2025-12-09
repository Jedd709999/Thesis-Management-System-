const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Thesis Management System', 'frontend', 'src', 'pages', 'thesis-management', 'ThesisManagementPage.tsx');

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Remove merge conflict markers
  let cleanedData = data.replace(/<<<<<<< HEAD/g, '');
  cleanedData = cleanedData.replace(/=======/g, '');
  cleanedData = cleanedData.replace(/>>>>>>> 13a4e22ac92d7824c227a4dff1ae74d9d5e9cb09/g, '');

  // Write the cleaned data back to the file
  fs.writeFile(filePath, cleanedData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('Successfully cleaned merge conflicts from', filePath);
  });
});