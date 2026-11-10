const fs = require('fs');
const path = require('path');

const keyFilePath = path.join(__dirname, '../../data/keys_niran.json');

function getAvailableKey(userId) {
  if (!fs.existsSync(keyFilePath)) {
    console.error(`[KeyService] ไม่พบไฟล์ที่: ${keyFilePath}`);
    return null;
  }

  const data = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
  const availableItem = data.keys.find((k) => !k.used);

  if (!availableItem) return null;

  // มาร์กว่าใช้แล้ว บันทึกไอดีและเวลา
  availableItem.used = true;
  availableItem.usedBy = userId;
  availableItem.usedAt = new Date().toISOString();

  fs.writeFileSync(keyFilePath, JSON.stringify(data, null, 2));
  return availableItem.key;
}

module.exports = { getAvailableKey };