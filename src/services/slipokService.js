const axios = require('axios');
const FormData = require('form-data');

/**
 * Service สำหรับตรวจสอบสลิปโอนเงินผ่านบุคคลที่สาม (ตัวอย่างใช้ SlipOK: https://slipok.com)
 * แนวคิด: ผู้ใช้แนบรูปสลิปมาในแชท -> เราดาวน์โหลดรูป -> ส่งต่อให้ SlipOK ตรวจสอบ
 * -> เช็คว่าโอนมาที่บัญชีร้านจริง + ยังไม่เคยถูกใช้ตรวจมาก่อน (กันสลิปซ้ำ)
 */

const SLIPOK_ENDPOINT_BASE = 'https://api.slipok.com/api/line/apikey';

/**
 * ตรวจสอบสลิปจาก URL รูปภาพที่แนบมาใน Discord
 * @param {string} imageUrl URL ของรูปสลิปที่แนบมากับข้อความ Discord
 * @returns {Promise<{ success: boolean, amount?: number, message: string, transRef?: string }>}
 */
async function verifySlipFromUrl(imageUrl) {
  const branchId = process.env.SLIPOK_BRANCH_ID;
  const apiKey = process.env.SLIPOK_API_KEY;

  try {
    // 1. ดาวน์โหลดรูปสลิปจาก Discord CDN มาเป็น buffer
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);

    // 2. ห่อเป็น FormData เพื่อส่งให้ SlipOK
    const form = new FormData();
    form.append('files', imageBuffer, { filename: 'slip.jpg' });

    const response = await axios.post(`${SLIPOK_ENDPOINT_BASE}/${branchId}`, form, {
      headers: {
        ...form.getHeaders(),
        'x-authorization': apiKey,
      },
      timeout: 15000,
    });

    const data = response.data;

    if (!data.success) {
      return { success: false, message: data.message || 'ตรวจสอบสลิปไม่สำเร็จ' };
    }

    const expectedAccount = process.env.BANK_ACCOUNT_NUMBER;
    const receivingAccount = data.data?.receivingBank?.account;

    // 3. ตรวจสอบว่าโอนเข้าบัญชีร้านจริงหรือไม่ (ป้องกันสลิปโอนไปที่อื่นแล้วเอามาหลอกใช้)
    if (expectedAccount && receivingAccount && !receivingAccount.includes(expectedAccount.slice(-4))) {
      return { success: false, message: 'สลิปนี้ไม่ได้โอนเข้าบัญชีร้าน กรุณาตรวจสอบอีกครั้ง' };
    }

    return {
      success: true,
      amount: Number(data.data.amount),
      transRef: data.data.transRef,
      message: 'ตรวจสอบสลิปสำเร็จ',
    };
  } catch (err) {
    // SlipOK มักตอบ error code กลับมาเวลาสลิปซ้ำ/ปลอม/หมดอายุ
    const apiMessage = err.response?.data?.message;
    return {
      success: false,
      message: apiMessage || `เกิดข้อผิดพลาดในการตรวจสอบสลิป: ${err.message}`,
    };
  }
}

module.exports = { verifySlipFromUrl };
