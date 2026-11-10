const fs = require('fs');
const path = require('path');

// ชี้ตรงไปยัง src/database/affiliates.json ตามโครงสร้างโฟลเดอร์จริง
const filePath = path.join(__dirname, '../database/affiliates.json');

// ฟังก์ชันโหลดข้อมูลจาก JSON
function loadData() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (error) {
    console.error('Error loading affiliate data:', error);
    return {};
  }
}

// ฟังก์ชันเซฟข้อมูลลง JSON
function saveData(data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving affiliate data:', error);
  }
}

// สุ่มโค้ด เช่น IDK-A8F
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'IDK-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ดึงข้อมูลผู้ใช้ หรือสร้างใหม่ถ้ายังไม่มี
function getUserAffiliate(userId) {
  const data = loadData();

  if (!data[userId]) {
    // เช็คไม่ให้โค้ดสุ่มซ้ำกับคนอื่น
    let code = generateCode();
    const existingCodes = Object.values(data).map(u => u.code);
    while (existingCodes.includes(code)) {
      code = generateCode();
    }

    data[userId] = {
      userId,
      code: code,
      cashbackBalance: 0,      // ยอดเงินคืนสะสม (บาท)
      referralCount: 0,        // จำนวนเพื่อนที่ใช้โค้ดซื้อสำเร็จ
      usedReferralCode: null,   // เคยใช้โค้ดของใครไปแล้วหรือยัง
      hasClaimedFreeRole: false // เคลมรีเชดฟรีตอนครบ 5 คนหรือยัง
    };
    saveData(data);
  }

  return data[userId];
}

// ค้นหาเจ้าของโค้ดจากรหัสที่กรอกเข้ามา (ลบช่องว่างทิ้งทั้งหมด ป้องกันก๊อปปี้ติดวรรค)
function findUserByCode(code) {
  if (!code) return null;
  const data = loadData();
  const cleanCode = code.trim().replace(/\s+/g, '').toUpperCase();

  const foundId = Object.keys(data).find(id => {
    return data[id].code && data[id].code.replace(/\s+/g, '').toUpperCase() === cleanCode;
  });

  return foundId ? data[foundId] : null;
}

// อัปเดตข้อมูลเมื่อมีการสั่งซื้อสำเร็จด้วยโค้ดแนะนำ
function processReferralReward(buyerId, referrerId, cashbackAmount = 5) {
  const data = loadData();

  if (data[referrerId]) {
    data[referrerId].cashbackBalance += cashbackAmount;
    data[referrerId].referralCount += 1;
  }

  if (data[buyerId]) {
    data[buyerId].usedReferralCode = data[referrerId] ? data[referrerId].code : 'USED';
  }

  saveData(data);
  return data[referrerId];
}

module.exports = {
  getUserAffiliate,
  findUserByCode,
  processReferralReward,
  loadData,
  saveData
};