const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');
const start = code.indexOf('export default function App() {');
const end = code.indexOf('return (', start);
fs.writeFileSync('appBody.txt', code.substring(start, end));
