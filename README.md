# IDONTKNOW SHOP — Discord Auto Shop + Top-up Bot

Discord Bot ร้านค้าขายของอัตโนมัติ 24 ชม. พร้อมระบบเติมเงิน (TrueMoney Wallet + สแกนสลิปธนาคาร)
เขียนด้วย Node.js + Discord.js v14

## 📁 โครงสร้างโปรเจกต์

```
discord-shop-bot/
├── src/
│   ├── commands/
│   │   └── setup-shop.js          # /setup-shop โพสต์แผงร้านค้า (admin only)
│   ├── events/
│   │   ├── ready.js               # เหตุการณ์ตอนบอทออนไลน์
│   │   └── interactionCreate.js   # จุดกลางแยก interaction ไปยัง handler
│   ├── handlers/
│   │   ├── commandHandler.js      # รัน slash command + จับ error
│   │   ├── buttonHandler.js       # ปุ่ม [เติมเงิน] [เช็คเงิน]
│   │   ├── selectMenuHandler.js   # dropdown หมวดหมู่/สินค้า/ช่องทางเติมเงิน
│   │   └── modalHandler.js        # รับลิงก์ซอง TrueMoney จาก Modal
│   ├── components/
│   │   └── shopPanel.js           # สร้าง Embed + SelectMenu + Buttons ทั้งหมด
│   ├── services/
│   │   ├── userService.js         # อ่าน/เขียนเครดิตผู้ใช้ (users.json)
│   │   ├── productService.js      # อ่าน/เขียนสต็อกสินค้า (products.json)
│   │   ├── truemoneyService.js    # แยก hash ซอง + ยิง API รับซองอั่งเปา
│   │   └── slipokService.js       # ส่งรูปสลิปไปตรวจกับ SlipOK API
│   ├── utils/
│   │   ├── database.js            # helper อ่าน/เขียน JSON (กัน race condition)
│   │   ├── embeds.js              # ธีมสี Dark Minimal + embed สำเร็จรูป
│   │   └── logger.js              # log ลง console + ส่ง log เข้าห้อง Discord
│   ├── database/
│   │   ├── users.json             # { user_id, balance, history[] }
│   │   └── products.json          # { categories: [{ id, products: [{ stock[] }] }] }
│   ├── index.js                   # entry point: สร้าง client, โหลด command/event
│   └── deploy-commands.js         # สคริปต์ลงทะเบียน slash command กับ Discord
├── .env.example
└── package.json
```

## 🚀 วิธีติดตั้ง

```bash
npm install
cp .env.example .env      # แล้วกรอกค่าจริงในไฟล์ .env
npm run deploy            # ลงทะเบียน slash command /setup-shop
npm start                 # หรือ npm run dev (ใช้ nodemon)
```

จากนั้นไปที่ห้องที่ต้องการ พิมพ์ `/setup-shop` เพื่อโพสต์แผงร้านค้า

## 🔧 จุดที่ต้องปรับก่อนใช้งานจริง

1. **`src/services/truemoneyService.js`**
   Endpoint และรูปแบบ response ของ TrueMoney อาจเปลี่ยนแปลงได้ตลอดเวลา
   ต้องทดสอบกับซองจริงและปรับ path `SUCCESS` / field `amount_baht` ให้ตรงกับ API ปัจจุบัน

2. **`src/services/slipokService.js`**
   ต้องสมัครใช้งาน [SlipOK](https://slipok.com) เพื่อรับ `SLIPOK_API_KEY` และ `SLIPOK_BRANCH_ID`
   (หรือจะเปลี่ยนไปใช้บริการตรวจสลิปเจ้าอื่นก็ปรับไฟล์นี้ไฟล์เดียว)

3. **Race condition ตอนซื้อของพร้อมกัน**
   `utils/database.js` มี write-lock แบบง่ายในระดับไฟล์ ป้องกันการเขียนทับกันได้ในระดับหนึ่ง
   แต่ถ้าร้านมีคนซื้อพร้อมกันจำนวนมาก แนะนำให้ย้ายไปใช้ฐานข้อมูลจริง เช่น SQLite หรือ MongoDB

4. **สิทธิ์ Intents**
   ต้องไปเปิด `MESSAGE CONTENT INTENT` ใน [Discord Developer Portal](https://discord.com/developers/applications)
   ของบอท ไม่งั้นระบบตรวจจับรูปสลิปที่แนบมาในแชทจะไม่ทำงาน

## 🔄 Flow การทำงานคร่าว ๆ

**ซื้อของ:** เลือกหมวดหมู่ → เลือกสินค้า → เช็คยอดเงิน → หักเครดิต + ตัดสต็อก → ส่งของทาง DM

**เติมเงิน (TrueMoney):** กด 💰 → เลือก TrueMoney → กรอกลิงก์ซองใน Modal → ระบบยิง API รับซอง → เติมเครดิต

**เติมเงิน (โอนธนาคาร):** กด 💰 → เลือกโอนธนาคาร → แนบรูปสลิปในแชทภายใน 3 นาที → ส่งไปตรวจกับ SlipOK → เติมเครดิต
