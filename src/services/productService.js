const { readJSON, writeJSON } = require('../utils/database');

const DB_FILE = 'products.json';

/** ดึงข้อมูลหมวดหมู่ทั้งหมด (พร้อมสินค้าข้างใน) */
function getCategories() {
  return readJSON(DB_FILE).categories || [];
}

/** หาหมวดหมู่จาก id */
function getCategoryById(categoryId) {
  return getCategories().find((c) => c.id === categoryId) || null;
}

/** หาสินค้าจาก productId (ค้นทุกหมวดหมู่) */
function getProductById(productId) {
  for (const category of getCategories()) {
    const product = category.products.find((p) => p.id === productId);
    if (product) return { category, product };
  }
  return null;
}

/**
 * สรุปสถิติร้านค้า ใช้แสดงในหน้า Shop Embed
 * @returns {{ totalCategories: number, totalProducts: number, totalStock: number }}
 */
function getShopStats() {
  const categories = getCategories();
  let totalProducts = 0;
  let totalStock = 0;

  for (const category of categories) {
    totalProducts += category.products.length;
    for (const product of category.products) {
      totalStock += product.stock.length;
    }
  }

  return {
    totalCategories: categories.length,
    totalProducts,
    totalStock,
  };
}

/**
 * ตัดสต็อก 1 ชิ้นออกจากสินค้า แล้วคืนค่าไอเทมที่ถูกตัดออกมา (เช่น key/บัญชี)
 * คืนค่า null ถ้าสินค้าหมดสต็อก
 * @param {string} productId
 */
async function popStock(productId) {
  const data = readJSON(DB_FILE);

  for (const category of data.categories) {
    const product = category.products.find((p) => p.id === productId);
    if (!product) continue;

    if (!product.stock || product.stock.length === 0) return null;

    // ตัดไอเทมแรกสุดออกจาก stock array (FIFO)
    const item = product.stock.shift();
    await writeJSON(DB_FILE, data);
    return item;
  }

  return null;
}

/** เช็คว่าสินค้ายังมีสต็อกเหลือหรือไม่ */
function isInStock(productId) {
  const found = getProductById(productId);
  return found ? found.product.stock.length > 0 : false;
}

module.exports = {
  getCategories,
  getCategoryById,
  getProductById,
  getShopStats,
  popStock,
  isInStock,
};
