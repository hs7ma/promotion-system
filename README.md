# 🎓 PromoTrack - نظام تتبع ترقيات أعضاء هيئة التدريس

<div dir="rtl">

## 📋 نظرة عامة

**PromoTrack** هو نظام شامل ومتكامل لتتبع وإدارة ترقيات أعضاء هيئة التدريس في المؤسسات الأكاديمية. يوفر النظام واجهة سهلة الاستخدام لتسجيل الإنجازات الأكاديمية وحساب النقاط المطلوبة للترقية تلقائياً.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)

</div>

---

## ✨ الميزات الرئيسية

- 🎯 **معالج إعداد سهل** - واجهة خطوة بخطوة لإعداد الملف الشخصي
- 📊 **لوحة تحكم شاملة** - عرض تفصيلي للإنجازات والنقاط
- 🧮 **حساب تلقائي للنقاط** - حساب فوري عند إضافة أي إنجاز
- 🎲 **محاكي النقاط** - توقع الأهلية قبل إضافة الإنجازات
- 📈 **تتبع التقدم** - شريط تقدم مرئي نحو الترقية
- 💾 **قاعدة بيانات قوية** - Supabase PostgreSQL مع أمان متقدم
- 🔒 **أمان البيانات** - Row Level Security (RLS)
- 📱 **تصميم متجاوب** - يعمل على جميع الأجهزة

---

## 🚀 البدء السريع

### المتطلبات

- Node.js v16 أو أحدث
- npm أو yarn
- حساب Supabase (مجاني)

### التثبيت

```bash
# 1. استنساخ المشروع
git clone <repository-url>
cd promotion-system

# 2. تثبيت المكتبات
npm install

# 3. إعداد Supabase (اختياري)
# - أنشئ مشروع على supabase.com
# - نفذ database/supabase_schema.sql
# - نفذ database/supabase_public_access.sql

# 4. إنشاء ملف .env
echo "SUPABASE_URL=https://YOUR-PROJECT.supabase.co" > .env
echo "SUPABASE_ANON_KEY=your-anon-key-here" >> .env
echo "PORT=3001" >> .env

# 5. تشغيل الخادم
npm run start:supabase
```

افتح المتصفح على: `http://localhost:3001`

---

## 📁 هيكل المشروع

```
promotion-system/
├── database/              # ملفات قاعدة البيانات
│   ├── supabase_schema.sql
│   ├── supabase_public_access.sql
│   ├── README.md
│   └── SETUP_GUIDE.md
├── public/               # الواجهة الأمامية
│   ├── css/
│   ├── js/
│   └── index.html
├── server.js             # الخادم (In-Memory)
├── server-supabase.js    # الخادم (Supabase)
├── package.json
├── README.md
└── PROJECT_REPORT.md     # تقرير شامل
```

---

## 🛠️ التقنيات المستخدمة

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Glassmorphism Design
- Google Fonts

### Backend
- Node.js + Express.js
- Supabase (PostgreSQL)
- RESTful API

---

## 📊 نظام النقاط

| الفئة | التفاصيل | النقاط |
|------|---------|--------|
| **الأبحاث** | Q1, Q2, Q3, Q4, Local | 15, 12, 10, 5, 3 |
| **براءات الاختراع** | Granted, Pending | 20, 10 |
| **الإشراف** | Ph.D., Master's, Graduation | 15, 10, 5 |
| **المؤتمرات** | International/Local Presenter/Attendee | 2-8 |
| **التدريب** | Certified, Uncertified | 5, 2 |
| **التدريس** | Course Development, Lectures, Assessment | 8, 3, 2 |

---

## 🎓 متطلبات الترقية

| المنصب الحالي | النقاط الدنيا | المنصب التالي |
|---------------|--------------|---------------|
| Teaching Assistant | 46 | Lecturer |
| Lecturer | 50 | Assistant Professor |
| Assistant Professor | 60 | Associate Professor |

---

## 📡 API Documentation

### Endpoints الرئيسية

```javascript
// الحصول على بيانات عضو هيئة التدريس
GET /api/faculty

// إكمال المعالج
POST /api/faculty/wizard

// إضافة إنجاز
POST /api/faculty/achievements/:type

// حذف إنجاز
DELETE /api/faculty/achievements/:type/:id

// فحص الأهلية
GET /api/faculty/eligibility

// تقديم طلب ترقية
POST /api/faculty/apply

// محاكاة النقاط
POST /api/faculty/simulate
```

---

## 🔧 الأوامر المتاحة

```bash
# تشغيل مع Supabase
npm run start:supabase

# تشغيل بدون Supabase (In-Memory)
npm start

# وضع التطوير
npm run dev:supabase
```

---

## 📚 التوثيق

- **[PROJECT_REPORT.md](./PROJECT_REPORT.md)** - تقرير شامل عن المشروع
- **[database/README.md](./database/README.md)** - توثيق قاعدة البيانات
- **[database/SETUP_GUIDE.md](./database/SETUP_GUIDE.md)** - دليل الإعداد السريع

---

## 🔐 الأمان

- Row Level Security (RLS) على جميع الجداول
- سياسات وصول محددة لكل مستخدم
- تشفير البيانات في Supabase

---

## 🐛 استكشاف الأخطاء

### المشكلة: "Invalid supabaseUrl"
**الحل**: تأكد من صحة `SUPABASE_URL` في ملف `.env`

### المشكلة: "permission denied"
**الحل**: تأكد من تنفيذ `supabase_public_access.sql`

### المشكلة: الخادم لا يعمل
**الحل**: تأكد من تثبيت المكتبات بـ `npm install`

---

## 📈 الإحصائيات

- **~3,500+** سطر من الكود
- **10** جداول في قاعدة البيانات
- **12** دالة مخزنة
- **12** محفز تلقائي
- **10** API endpoints

---

## 🗺️ خارطة الطريق

- [ ] نظام مصادقة متكامل
- [ ] دعم متعدد اللغات
- [ ] تقارير PDF
- [ ] إشعارات البريد الإلكتروني
- [ ] تطبيق موبايل

---

## 📄 الترخيص

هذا المشروع مرخص تحت **MIT License**.

---

## 👥 المساهمون

- فريق PromoTrack

---

## 📞 الدعم

للمساعدة والدعم:
- راجع [التوثيق الكامل](./PROJECT_REPORT.md)
- تحقق من [دليل الإعداد](./database/SETUP_GUIDE.md)

---

<div align="center">

**صُنع بـ ❤️ لخدمة المجتمع الأكاديمي**

[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com)
[![Express](https://img.shields.io/badge/Express-API-red)](https://expressjs.com)
[![Node.js](https://img.shields.io/badge/Node.js-Runtime-brightgreen)](https://nodejs.org)

</div>

