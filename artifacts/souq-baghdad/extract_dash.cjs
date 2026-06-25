const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const start = content.indexOf('function OwnerDashboard');
const end = content.indexOf('function TransportView');
if (start > -1 && end > -1) {
  fs.writeFileSync('owner_dash.tsx', content.substring(start, end));
} else {
  console.log("Could not extract OwnerDashboard");
}
