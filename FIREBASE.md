# Firebase Report

تاريخ التقرير: 2026-05-04

هذا الملف هو دليل ربط مشروع SCSC مع Firebase و Vercel، وما أحتاجه منك حتى أقدر أربطه على مشروعك الحقيقي.

## ماذا تم تجهيزه في المشروع

- ملف إعدادات Firebase: `firebase.json`
- ملف إعداد Vercel: `vercel.json`
- قواعد Firestore: `firestore.rules`
- فهارس Firestore: `firestore.indexes.json`
- قواعد Storage: `storage.rules`
- Cloud Functions للإنتاج:
  - إرسال رسائل التواصل.
  - إصدار QR عضوية ديناميكي.
  - التحقق من QR لمرة واحدة.
  - تعيين أدوار المستخدمين.
  - إضافة/تعديل/حذف الفعاليات.
  - إضافة/تعديل/حذف المنتجات.
  - تحديث حالة الطلب.
  - تحديث دور وحالة عضوية المستخدم.
  - قبول/رفض المقالات.
- Seed Script لإدخال بيانات أولية:
  - `scripts/seed-firestore.mjs`
  - الأمر: `npm run firebase:seed`
- قالب متغيرات البيئة:
  - `.env.example`

## حالة الربط الحالية

- تم ربط `.firebaserc` على مشروع `cosmetics-association`.
- تم نشر Firestore Rules.
- تم نشر Storage Rules.
- تم نشر Firestore Indexes.
- تم نشر Cloud Functions على `us-central1` وكلها أصبحت `ACTIVE`.
- تم تشغيل Seed وإضافة بيانات أولية وحسابات:
  - `admin@example.com`
  - `moderator@example.com`
  - `user@example.com`

كلمة مرور حسابات Seed:

```text
admin123
```

## المتطلبات التي أحتاجها منك

القيم التالية يجب وضعها في `.env.local` محلياً وفي Vercel Environment Variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FUNCTIONS_REGION=us-central1
NEXT_PUBLIC_INSTAGRAM_URL=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
MEMBERSHIP_QR_SECRET=
```

ملاحظات مهمة:

- لا ترسل المفاتيح في GitHub.
- `FIREBASE_PRIVATE_KEY` يجب أن يكون كسطر واحد وفيه `\n` بدل الأسطر الحقيقية.
- `MEMBERSHIP_QR_SECRET` لازم يكون عشوائي وطويل.
- `NEXT_PUBLIC_INSTAGRAM_URL` اختياري. إذا وضعته سيظهر رابط إنستغرام في صفحة التواصل والفوتر.
- SMTP اختياري حالياً. إذا لم تضبطه، نموذج التواصل يمكنه حفظ الرسائل في Firestore عند نشر Functions، ولن يرسل بريد فعلي.
- مفتاح Service Account الذي تم إرساله سابقاً يجب تدويره/حذفه وإنشاء مفتاح جديد قبل الإنتاج.

توليد Secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## خطوات إنشاء Firebase

1. افتح Firebase Console.
2. أنشئ Project جديد.
3. فعّل Authentication.
4. من Sign-in method فعّل Email/Password.
5. فعّل Firestore Database.
6. فعّل Storage.
7. فعّل Cloud Functions.
8. من Project Settings أضف Web App وانسخ قيم `NEXT_PUBLIC_FIREBASE_*`.
9. من Service Accounts أنشئ Private Key وانسخ:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

## الربط المحلي

1. أنشئ `.env.local` من `.env.example`.
2. عبئ قيم Firebase.
3. سجل دخول Firebase CLI:

```powershell
npx firebase login
```

4. اربط المشروع:

```powershell
npx firebase use --add
```

5. انشر القواعد والفهارس:

```powershell
npm run firebase:deploy:rules
```

6. ابن Cloud Functions:

```powershell
npm run functions:build
```

7. انشر Cloud Functions:

```powershell
npx firebase deploy --only functions
```

8. أدخل بيانات أولية:

```powershell
npm run firebase:seed
```

## ربط Vercel

1. ارفع المشروع إلى GitHub.
2. افتح Vercel واختر New Project.
3. اختر المستودع.
4. Build Settings:

```text
Install Command: npm install
Build Command: npm run build
Output Directory: .next
Node.js Version: 22
```

تمت إضافة `vercel.json` بهذه الإعدادات حتى يتعرف Vercel عليها تلقائياً.

5. أضف Environment Variables في Vercel بنفس قيم `.env.local` من:

```text
Project Settings -> Environment Variables
```

ضع القيم السرية مثل `FIREBASE_PRIVATE_KEY` و `FIREBASE_CLIENT_EMAIL` و `MEMBERSHIP_QR_SECRET` كـ Sensitive/Encrypted variables، وفعّلها على الأقل لـ Production و Preview.

بالنسبة إلى `FIREBASE_PRIVATE_KEY` في Vercel:

- اسم المتغير: `FIREBASE_PRIVATE_KEY`
- القيمة: المفتاح من `-----BEGIN PRIVATE KEY-----` إلى `-----END PRIVATE KEY-----`.
- لا تضع علامات اقتباس حول القيمة داخل Vercel.
- يمكن لصق المفتاح بأسطر فعلية أو كسطر واحد يحتوي `\n`؛ الكود الحالي يدعم الطريقتين.
- بديل أكثر أمانًا ضد أخطاء النسخ: ضع JSON كامل service account كـ `FIREBASE_SERVICE_ACCOUNT_BASE64` بعد تحويله إلى Base64.

الأمر المحلي للتأكد من صيغة Admin SDK:

```powershell
npm run firebase:admin:check
```

والأمر المحلي لفحص Firestore/Auth production:

```powershell
npm run firebase:prod:check
```

6. بعد أول Deploy، خذ دومين Vercel وأضفه إلى Firebase:
```text
Authentication -> Settings -> Authorized domains
```

أضف:

- دومين Vercel.
- الدومين النهائي للجمعية.

## اختبار بعد الربط

اختبر التالي بالترتيب:

1. تسجيل الدخول بحساب `admin@example.com`.
2. فتح `/dashboard`.
3. إضافة فعالية من لوحة التحكم.
4. إضافة منتج من لوحة التحكم.
5. تسجيل مستخدم جديد من `/auth/signup`.
6. تسجيل فعالية من صفحة event.
7. إضافة منتج للسلة وعمل Checkout.
8. فتح `/profile`.
9. فتح `/profile/membership-card`.
10. فحص QR من `/verify?pass=...`.
11. إعادة استخدام نفس QR والتأكد أنه يرفضه.
12. وضع رابط إنستغرام في `NEXT_PUBLIC_INSTAGRAM_URL` والتأكد من ظهوره في `/contact` والفوتر.

## ملاحظات أمنية

- لا يمكن منع Screenshot من المتصفح بشكل مضمون.
- الحماية المطبقة هي QR قصير العمر، One-time-use، وإبطال الجلسات القديمة.
- فعّل Firebase App Check قبل الإنتاج.
- راجع صلاحيات أول Admin بعد Seed.
- لا تستخدم `development-membership-secret` في الإنتاج.

## ملاحظة عن الحزم

تمت إضافة حزمة:

```text
dotenv
```

لاستخدامها مع سكربت Seed وقراءة متغيرات البيئة.
