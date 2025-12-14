# 🚀 دليل الإعداد السريع - Quick Setup Guide

## 📋 المتطلبات

1. حساب Supabase (مجاني) - [supabase.com](https://supabase.com)
2. Node.js v16 أو أحدث

## ⚡ الإعداد السريع (5 دقائق)

### 1️⃣ إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com) وأنشئ حساب
2. اضغط "New Project"
3. سمِّ مشروعك واختر كلمة مرور
4. انتظر حتى يتم إنشاء المشروع (دقيقة تقريباً)

### 2️⃣ تشغيل كود SQL

1. في Supabase Dashboard، اذهب إلى **SQL Editor**
2. اضغط **New Query**
3. انسخ والصق محتوى `supabase_schema.sql` كاملاً
4. اضغط **Run** ✓
5. انسخ والصق محتوى `supabase_public_access.sql`
6. اضغط **Run** ✓

### 3️⃣ الحصول على مفاتيح API

1. اذهب إلى **Settings** → **API**
2. انسخ:
   - **Project URL**: مثل `https://abc123.supabase.co`
   - **anon public key**: المفتاح العام

### 4️⃣ تحديث الخادم

افتح ملف `server-supabase.js` وحدّث هذه الأسطر:

```javascript
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';  // ← ضع URL الخاص بك
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';  // ← ضع المفتاح العام
```

**أو** استخدم متغيرات البيئة:

```bash
# Windows PowerShell
$env:SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
$env:SUPABASE_ANON_KEY="YOUR-ANON-KEY"

# Linux/Mac
export SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
export SUPABASE_ANON_KEY="YOUR-ANON-KEY"
```

### 5️⃣ تثبيت المكتبات وتشغيل الخادم

```bash
# تثبيت المكتبات
npm install

# تشغيل الخادم مع Supabase
npm run start:supabase
```

### 6️⃣ اختبار التطبيق

افتح المتصفح على: `http://localhost:3001`

---

## 🔍 التحقق من الاتصال

بعد تشغيل الخادم، افتح:
```
http://localhost:3001/api/health
```

يجب أن ترى:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

---

## ⚠️ استكشاف الأخطاء

### "Could not connect to Supabase"
- تحقق من صحة SUPABASE_URL و SUPABASE_ANON_KEY
- تأكد من عدم وجود مسافات إضافية

### "permission denied for table"
- تأكد من تنفيذ `supabase_public_access.sql`

### "function does not exist"
- تأكد من تنفيذ `supabase_schema.sql` أولاً

### "invalid input value for enum"
- تحقق من القيم (مثلاً: 'Q1' وليس 'q1')

---

## 📁 هيكل الملفات

```
promotion-system/
├── database/
│   ├── supabase_schema.sql      ← المخطط الرئيسي
│   ├── supabase_public_access.sql ← للوصول العام
│   ├── README.md                 ← توثيق مفصل
│   └── SETUP_GUIDE.md           ← هذا الملف
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── server.js                     ← الخادم الأصلي (in-memory)
├── server-supabase.js           ← الخادم مع Supabase
└── package.json
```

---

## 🎯 الخطوات التالية

بعد إتمام الإعداد:

1. ✅ أنشئ ملف شخصي جديد عبر Wizard
2. ✅ أضف بعض الإنجازات
3. ✅ جرب Simulator
4. ✅ تحقق من Supabase Dashboard لرؤية البيانات

---

## 💡 نصائح

- استخدم **Supabase Dashboard** → **Table Editor** لرؤية بياناتك مباشرة
- جميع النقاط تُحسب تلقائياً عند إضافة إنجاز
- يمكنك استخدام **SQL Editor** لاستعلامات مخصصة


