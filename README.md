# SCSC Website

المشروع الرسمي لجمعية `Cosmetics & Skin Care Association` في جامعة النجاح الوطنية.

## ما تم تجهيزه

- Next.js 14 مع App Router و TypeScript
- Tailwind CSS + Framer Motion
- Firebase Web SDK + Firebase Admin
- Firebase Functions + Firestore Rules + Storage Rules + Indexes
- صفحات عامة:
  - الرئيسية
  - من نحن
  - التعليم
  - تفاصيل المقال
  - الفعاليات
  - تفاصيل الفعالية
  - التواصل
- صفحات محمية:
  - تسجيل الدخول
  - إنشاء الحساب
  - المتجر
  - تفاصيل المنتج
  - الملف الشخصي
  - التحقق من العضوية QR
  - لوحة التحكم
- منطق مبدئي لـ:
  - Cart
  - Checkout COD
  - Event registration
  - Dynamic membership QR
  - Role-based route protection
  - Account lockout after failed login attempts

## متطلبات التشغيل

- يفضّل Node.js `20` أو `22`
- الجهاز الحالي يستخدم Node 24، لذلك أضفنا Node 22 محلي داخل المشروع

## أوامر التشغيل

### تجهيز البيئة المحلية بسرعة

```powershell
npm run setup:local
```

### تشغيل الواجهة باستخدام Node المحلي داخل المشروع

```powershell
npm run run:local
```

### بناء المشروع

```powershell
npm run build:local
```

### فحص TypeScript

```powershell
npm run typecheck
```

### تشغيل Firebase Emulators

```powershell
npm run firebase:emulators
```

### بناء الـ Functions

```powershell
npm run functions:build
```

## إعداد البيئة

1. انسخ ملف البيئة:

```powershell
Copy-Item .env.example .env.local
```

2. عبّئ القيم التالية:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_PROJECT_ID`
- `APP_URL`
- `MEMBERSHIP_QR_SECRET`
- `CONTACT_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

3. أنشئ ملف `.firebaserc` من المثال:

```powershell
Copy-Item .firebaserc.example .firebaserc
```

ثم ضع `project id` الحقيقي.

## Firebase

- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`
- `functions/src/index.ts`
- `firebase.json`

## ملاحظات مهمة

- المشروع يستخدم Mock data fallback عندما تكون إعدادات Firebase غير موجودة، حتى تقدر تشوف الواجهة مباشرة.
- عند توصيل Firebase الحقيقي سيتحول التطبيق تلقائيًا لاستخدام البيانات الفعلية.
- اعتماديات `functions` تم تثبيتها داخل `functions/`.
- صفحة `Profile` تحتوي الآن على Personal Dashboard كامل مع:
  - Full Name
  - Membership Status
  - Membership Expiry
  - Order History
  - Registered Events
  - Saved Articles
  - Dynamic one-time QR pass
- نظام الـ QR الآن:
  - يولد جلسة QR مؤقتة قصيرة العمر
  - ينتهي تلقائيًا بعد ثوانٍ
  - يُلغى بعد أول scan ناجح
  - يكشف محاولات الاستخدام المكرر
  - يرفض أي QR قديم أو screenshot منتهي/مستبدل
