const fs = require('fs');
const path = require('path');

/**
 * Utility กลางสำหรับอ่าน/เขียนไฟล์ JSON ที่ใช้เป็น "ฐานข้อมูลจำลอง"
 * หมายเหตุ: เหมาะกับโปรเจกต์เล็ก/กลาง ถ้า traffic เยอะควรย้ายไปใช้ SQLite/MongoDB จริง
 */

// เก็บ lock แบบง่าย ๆ ต่อไฟล์ ป้องกันการเขียนทับกันตอนมีคำสั่งซื้อพร้อมกันหลายคน
const writeLocks = new Map();

function getFilePath(fileName) {
  return path.join(__dirname, '..', 'database', fileName);
}

/**
 * อ่านไฟล์ JSON แล้วแปลงเป็น Object
 * @param {string} fileName เช่น 'users.json'
 */
function readJSON(fileName) {
  const filePath = getFilePath(fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '{}', 'utf-8');
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error(`[Database] อ่านไฟล์ ${fileName} ไม่สำเร็จ:`, err);
    return {};
  }
}

/**
 * เขียน Object ลงไฟล์ JSON (เขียนทับทั้งไฟล์)
 * ใช้ queue แบบง่ายเพื่อกันการเขียนพร้อมกันจนไฟล์เสีย
 * @param {string} fileName เช่น 'users.json'
 * @param {object} data
 */
async function writeJSON(fileName, data) {
  const filePath = getFilePath(fileName);

  // รอคิวก่อนหน้าของไฟล์เดียวกันให้เขียนเสร็จก่อน
  const prevLock = writeLocks.get(fileName) || Promise.resolve();

  const currentLock = prevLock.then(
    () =>
      new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8', (err) => {
          if (err) return reject(err);
          resolve();
        });
      })
  );

  writeLocks.set(fileName, currentLock);
  return currentLock;
}

module.exports = { readJSON, writeJSON };
