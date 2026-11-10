const axios = require('axios');

/**
 * สร้าง License Key ผ่าน KeyAuth Seller API
 * @param {number} expiry อายุการใช้งาน (วัน)
 * @param {number} level สิทธิ์ของ Key
 * @returns {Promise<{ success: boolean, key?: string, message?: string }>}
 */
async function generateLicenseKey(expiry = 30, level = 1) {
  const sellerKey = process.env.KEYAUTH_SELLER_KEY;

  if (!sellerKey) {
    return { success: false, message: 'KeyAuth seller key not configured' };
  }

  try {
    const mask = process.env.KEYAUTH_KEY_MASK || 'DONT-XXXXXX-XXXXXX';
    const response = await axios.get('https://keyauth.win/api/seller/', {
      params: {
        sellerkey: sellerKey,
        type: 'add',
        format: 'json',
        expiry: expiry,
        mask: mask,
        level: level,
        amount: 1
      },
      timeout: 10000
    });

    if (response.data && response.data.success) {
      const generatedKey = response.data.key || (Array.isArray(response.data.keys) ? response.data.keys[0] : null);
      return { success: true, key: generatedKey };
    }

    return {
      success: false,
      message: response.data?.message || 'Failed to generate key from KeyAuth'
    };
  } catch (error) {
    console.error('[KeyAuth API Error]:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
}

module.exports = { generateLicenseKey };