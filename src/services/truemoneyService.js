const axios = require('axios');

const TRUEMONEY_REDEEM_ENDPOINT = 'https://gift.truemoney.com/campaign/vouchers';

function extractVoucherHash(input) {
  if (!input) return null;

  const urlMatch = input.match(/[?&]v=([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  const hashMatch = input.match(/^[a-zA-Z0-9]{10,35}$/);
  if (hashMatch) return hashMatch[0];

  return null;
}

async function redeemVoucher(voucherHash) {
  const phone = process.env.TRUEMONEY_PHONE?.replace(/[^0-9]/g, '');

  if (!phone) {
    return { success: false, message: 'ยังไม่ได้ตั้งค่าเบอร์ TRUEMONEY_PHONE ในระบบ' };
  }

  try {
    const response = await axios.post(
      `${TRUEMONEY_REDEEM_ENDPOINT}/${voucherHash}/redeem`,
      {
        mobile: phone,
        voucher_hash: voucherHash
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'okhttp/4.9.0'
        },
        timeout: 10000
      }
    );

    const data = response.data;

    if (data?.status?.code === 'SUCCESS') {
      const amount = Number(data?.data?.my_ticket?.amount_baht);
      return { 
        success: true, 
        amount, 
        message: 'รับซองสำเร็จ',
        ownerName: data?.data?.owner_profile?.full_name || 'ไม่ระบุ'
      };
    }

    return {
      success: false,
      message: data?.status?.message || 'ซองไม่ถูกต้อง หรือมีคนกดรับไปแล้ว'
    };
  } catch (err) {
    const apiMsg = err.response?.data?.status?.message;
    return {
      success: false,
      message: apiMsg || `เชื่อมต่อ TrueMoney ไม่สำเร็จ: ${err.message}`
    };
  }
}

module.exports = { extractVoucherHash, redeemVoucher };