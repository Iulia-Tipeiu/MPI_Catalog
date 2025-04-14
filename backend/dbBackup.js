import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const backupDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const getFormattedDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
};

const backupFilename = `${process.env.PGDATABASE}_backup_${getFormattedDate()}.sql`;
const backupFilePath = path.join(backupDir, backupFilename);

const pgBinPath = 'C:\\Program Files\\PostgreSQL\\15\\bin';
const pgDumpExe = path.join(pgBinPath, 'pg_dump.exe');

const pgDumpCommand = `"${pgDumpExe}" -U ${process.env.PGUSER} -h ${process.env.PGHOST} -p ${process.env.PGPORT} -d ${process.env.PGDATABASE} -f "${backupFilePath}"`;

console.log(`Starting backup of database: ${process.env.PGDATABASE}`);
console.log(`Backup file: ${backupFilePath}`);
console.log(`Command: ${pgDumpCommand}`);

exec(pgDumpCommand, { env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD } }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Backup failed: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`pg_dump warnings: ${stderr}`);
  }
  
  console.log(`Backup completed successfully!`);
  
  const deleteOldBackups = () => {
    const maxAgeInDays = 30;
    const now = new Date();
    
    fs.readdir(backupDir, (err, files) => {
      if (err) {
        console.error(`Error reading backup directory: ${err.message}`);
        return;
      }
      
      files.forEach(file => {
        const filePath = path.join(backupDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error(`Error getting file stats: ${err.message}`);
            return;
          }
          
          const fileAge = (now - stats.mtime) / (1000 * 60 * 60 * 24);
          
          if (fileAge > maxAgeInDays) {
            fs.unlink(filePath, err => {
              if (err) {
                console.error(`Error deleting old backup ${file}: ${err.message}`);
                return;
              }
              console.log(`Deleted old backup: ${file}`);
            });
          }
        });
      });
    });
  };
  
  deleteOldBackups();
});