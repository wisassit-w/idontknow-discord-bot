const { readJSON, writeJSON } = require('../utils/database');

const DB_FILE = 'users.json';

/**
 * ดึงข้อมูลผู้ใช้ ถ้ายังไม่มีในระบบจะสร้างใหม่ให้อัตโนมัติ (balance เริ่มต้น = 0)
 * @param {string} userId Discord user ID
 */
function getUser(userId) {
  const users = readJSON(DB_FILE) || {};
  if (!users[userId]) {
    users[userId] = {
      user_id: userId,
      balance: 0,
      history: [],
    };
  }
  return users[userId];
}

/** ดึงยอดเงินคงเหลือของผู้ใช้ */
function getBalance(userId) {
  return getUser(userId).balance;
}

/**
 * บันทึกรายการ (topup / purchase / refund) ลงประวัติผู้ใช้ พร้อมปรับยอดเงิน
 * @param {string} userId
 * @param {number} amount จำนวนเงิน (บวก = เติมเงิน, ลบ = หัก/ซื้อของ)
 * @param {object} meta ข้อมูลเพิ่มเติม เช่น { type: 'topup', method: 'truemoney' }
 */
async function addTransaction(userId, amount, meta = {}) {
  const users = readJSON(DB_FILE) || {};

  if (!users[userId]) {
    users[userId] = { user_id: userId, balance: 0, history: [] };
  }

  users[userId].balance = Number((users[userId].balance + Number(amount)).toFixed(2));
  users[userId].history.push({
    ...meta,
    amount: Number(amount),
    timestamp: new Date().toISOString(),
  });

  await writeJSON(DB_FILE, users);
  return users[userId];
}

/**
 * ฟังก์ชันเติมเงิน/เพิ่มพ้อยท์
 */
async function addBalance(userId, amount) {
  return await addTransaction(userId, Number(amount), { type: 'topup', method: 'manual_or_slip' });
}

/**
 * ฟังก์ชันหักเงินเมื่อซื้อสินค้า
 */
async function deductBalance(userId, amount) {
  return await addTransaction(userId, -Math.abs(Number(amount)), { type: 'purchase' });
}

/**
 * ตรวจสอบว่ายอดเงินพอสำหรับซื้อสินค้าราคานี้หรือไม่
 */
function hasEnoughBalance(userId, price) {
  return getBalance(userId) >= price;
}

module.exports = { 
  getUser, 
  getBalance, 
  addTransaction, 
  addBalance, 
  deductBalance, 
  hasEnoughBalance 
};