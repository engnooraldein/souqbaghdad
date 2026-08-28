const fs = require('fs');
const path = require('path');

function getTimestampFolderName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');

  return `${year}-${month}-${day} ${strHours}-${minutes} ${ampm}`;
}

function copyFolderSync(from, to, excludeDirs = ['node_modules', '.git', '.vscode']) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }

  const entries = fs.readdirSync(from, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      if (excludeDirs.includes(entry.name)) {
        continue;
      }
      count += copyFolderSync(srcPath, destPath, excludeDirs);
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }

  return count;
}

function createFullBackup() {
  const rootBackupsDir = path.join('C:', 'Users', 'hp', 'Documents', 'GitHub', 'نسخة احتياطيه');
  const timestampFolder = getTimestampFolderName();
  const targetDir = path.join(rootBackupsDir, timestampFolder);
  const sourceDir = path.join('C:', 'Users', 'hp', 'Documents', 'GitHub', 'souqbaghdad');

  console.log(`🚀 بدء عملية النسخ الاحتياطي...`);
  console.log(`📁 المصدر: ${sourceDir}`);
  console.log(`🎯 الوجهة: ${targetDir}`);

  if (!fs.existsSync(rootBackupsDir)) {
    fs.mkdirSync(rootBackupsDir, { recursive: true });
  }

  const copiedFiles = copyFolderSync(sourceDir, targetDir);

  const metadata = {
    backup_date: new Date().toISOString(),
    folder_name: timestampFolder,
    total_files_copied: copiedFiles,
    source: sourceDir,
    destination: targetDir
  };

  fs.writeFileSync(path.join(targetDir, 'backup_info.json'), JSON.stringify(metadata, null, 2), 'utf8');

  console.log(`✅ تم إنشاء النسخة الاحتياطية بنجاح!`);
  console.log(`📊 عدد الملفات المنسوخة: ${copiedFiles}`);
  console.log(`📍 المسار: ${targetDir}`);
  return targetDir;
}

if (require.main === module) {
  createFullBackup();
}

module.exports = { createFullBackup, getTimestampFolderName };
