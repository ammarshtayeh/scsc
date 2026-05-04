# تقرير مشروع SCSC Website

تاريخ التقرير: 2026-05-04

هذا التقرير يوضح حالة المشروع الحالية، ما تم تنفيذه من المتطلبات، ما بقي قبل الإطلاق الحقيقي، وخطوات ربط المشروع مع Firebase و Vercel.

## ملخص سريع

المشروع مبني بـ Next.js 14 ويدعم العمل بطريقتين:

- وضع تجريبي محلي يعتمد على Mock Data عند عدم وجود إعدادات Firebase.
- وضع إنتاجي يستخدم Firebase Authentication و Firestore و Storage و Cloud Functions عند إضافة متغيرات البيئة ونشر القواعد والـ Functions.

الملفات الأساسية الجاهزة للربط:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`
- `functions/src/index.ts`
- `lib/firebase/firebase.ts`
- `lib/firebase/admin.ts`
- `.env.example`
- `FIREBASE.md`
- `scripts/seed-firestore.mjs`
- `vercel.json`

## حالة الربط الحالية

- Firebase Web App مربوط في `.env.local`.
- `.firebaserc` مربوط على `cosmetics-association`.
- Firestore Rules منشورة.
- Storage Rules منشورة.
- Firestore Indexes منشورة.
- Cloud Functions منشورة على Node.js 22 وكلها بحالة `ACTIVE`.
- Seed Data تم إدخاله إلى Firestore.
- حسابات Auth الأولية تم إنشاؤها:
  - `admin@example.com`
  - `moderator@example.com`
  - `user@example.com`

## الصفحات والميزات المنفذة

### الصفحات العامة

- `/` الصفحة الرئيسية: Hero، سلايدر صور، مزايا العضوية، الأخبار/ورش العمل، ومعاينة الفعاليات.
- `/about` من نحن: نبذة الجمعية، أعضاء المجلس حسب السنة، وأعضاء الفريق.
- `/education` المقالات والأبحاث مع فلترة حسب التصنيف.
- `/education/[slug]` صفحة تفاصيل المقال.
- `/events` قائمة الفعاليات.
- `/events/[id]` تفاصيل الفعالية.
- `/contact` نموذج التواصل.
- `/verify?pass=...` صفحة التحقق من QR العضوية.

### المصادقة والصلاحيات

- `/auth/login` تسجيل الدخول.
- `/auth/signup` إنشاء حساب مستخدم.
- Middleware يحمي:
  - `/store`
  - `/profile`
  - `/dashboard`
- الأدوار المدعومة في الكود:
  - Admin
  - Moderator
  - User

### المتجر

- `/store` قائمة المنتجات.
- `/store/[slug]` تفاصيل المنتج.
- فلترة حسب الشركة/التصنيف/السعر/الاسم.
- سلة شراء محلية.
- Checkout مع فكرة الدفع عند الاستلام.
- سجل الطلبات يظهر في صفحة المستخدم.
- أسعار/خصومات العضوية مدعومة في البيانات.

### الملف الشخصي ونظام العضوية QR

- `/profile` لوحة المستخدم الشخصية:
  - الاسم
  - البريد
  - حالة العضوية
  - رقم العضوية
  - تاريخ انتهاء العضوية
  - الطلبات
  - الفعاليات المسجل بها
  - المقالات المحفوظة
  - تعديل بيانات المستخدم
- `/profile/membership-card` بطاقة العضوية الرقمية.
- QR ديناميكي يحتوي على:
  - Member ID
  - Full Name
  - Membership Expiry Date
  - Encrypted Temporary Access Token
- خصائص الأمان المطبقة:
  - QR قصير العمر، الافتراضي 45 ثانية.
  - QR يتجدد تلقائياً عند انتهاء المدة.
  - QR يصبح غير صالح بعد أول Scan ناجح.
  - يتم إبطال الجلسة القديمة عند إصدار QR جديد.
  - يتم تسجيل محاولات الاستخدام المكرر.
  - السيرفر يتحقق من التوكن قبل القبول.

ملاحظة مهمة: منع Screenshot بنسبة 100% من داخل المتصفح غير مضمون تقنياً، لذلك الحماية الصحيحة هنا هي جعل أي Screenshot قديم غير صالح عبر QR قصير العمر و One-time-use.

### لوحة التحكم

- `/dashboard` تعرض:
  - عدد المستخدمين.
  - عدد الفعاليات.
  - عدد الطلبات.
  - عدد الشركات.
  - إضافة وحذف الفعاليات من Firebase.
  - إضافة وحذف المنتجات من Firebase.
  - تعديل دور المستخدم وحالة العضوية.
  - تعديل حالة الطلب.
  - قبول/رفض المقالات.

ملاحظة: لوحة التحكم أصبحت مرتبطة بـ Cloud Functions للإدارة الإنتاجية. تعديل كل حقل لكل سجل موجود عبر نماذج مبسطة، ويمكن توسيعها لاحقاً لتجربة تحرير أكثر تفصيلاً.

### Firebase Functions

الموجود حالياً في `functions/src/index.ts`:

- `sendContactEmail`
  - يحفظ رسائل التواصل في Firestore.
  - يرسل بريد عند ضبط SMTP.
- `issueMembershipQrPass`
  - يصدر QR عضوية آمن ومشفّر.
- `verifyMembership`
  - يتحقق من QR ويمنع التكرار والرموز القديمة والمنتهية.
- `setUserRole`
  - يغير صلاحيات المستخدم عبر Custom Claims.
- `upsertEvent`
  - يضيف أو يحدث فعالية.
- `deleteEvent`
  - يحذف فعالية.
- `upsertProduct`
  - يضيف أو يحدث منتج.
- `deleteProduct`
  - يحذف منتج.
- `updateUserAdmin`
  - يحدث دور المستخدم وحالة العضوية.
- `updateOrderStatus`
  - يحدث حالة الطلب.
- `moderateArticle`
  - يقبل أو يرفض المقالات.

## ما بقي ولم يكتمل بعد

### بيانات الإنتاج

- إنشاء مشروع Firebase حقيقي.
- إنشاء Collections فعلية في Firestore أو تشغيل Seed Script الجاهز:
  - `users`
  - `events`
  - `articles`
  - `products`
  - `orders`
  - `boardMembers`
  - `contacts`
- تشغيل `npm run firebase:seed` لإدخال بيانات أولية.
- رفع صور حقيقية إلى Firebase Storage أو CDN.

### لوحة التحكم

- تحسين تجربة التحرير المتقدم لتكون Modal أو صفحات تفاصيل بدلاً من النماذج السريعة الحالية.
- إضافة حذف/تعطيل مستخدم من لوحة التحكم إذا كانت سياسة الجمعية تسمح بذلك.
- إضافة إدارة تعليقات وصور منفصلة عند إضافة نظام تعليقات/صور مستقل.
- إضافة صفحة تفاصيل الطلب الكاملة.

### المصادقة والأمان

- ضبط أول Admin حقيقي في Firebase Custom Claims.
- تطبيق Account lock أو Rate Limiting حقيقي لمحاولات الدخول الفاشلة. يوجد منطق/توجه عام، لكن يلزم ربط إنتاجي كامل.
- مراجعة قواعد Firestore بعد تحديد كل حقول البيانات النهائية.
- إضافة App Check لحماية Firestore/Functions من الاستخدام غير المصرح.
- جعل `MEMBERSHIP_QR_SECRET` سر إنتاج قوي في Firebase Functions.
- معالجة تحذيرات `npm audit` بترقية مدروسة لـ Next/Firebase بدون كسر المشروع.

### التواصل والبريد

- SMTP أصبح اختيارياً وليس مطلوباً الآن.
- يمكن استخدام `NEXT_PUBLIC_INSTAGRAM_URL` كرابط تواصل أساسي في صفحة التواصل والفوتر.
- عند نشر Functions بدون SMTP سيتم حفظ الرسائل في Firestore، لكن لن يتم إرسال بريد فعلي.
- لاحقاً يمكن إضافة قوالب بريد وSMTP إذا احتاجت الجمعية ذلك.

### الفعاليات

- حفظ تسجيل الفعاليات في Firestore بشكل إنتاجي كامل.
- منع التسجيل المكرر عبر Transaction.
- تعطيل التسجيل عند امتلاء الفعالية.
- صفحة أو جدول لإدارة المسجلين.

### المتجر والطلبات

- حفظ السلة أو الطلبات في Firestore بشكل نهائي عند ضبط Firebase.
- إدارة حالة الطلب من لوحة التحكم.
- صفحة تفاصيل الطلب للمستخدم والإدارة.
- إشعارات تأكيد الطلب.
- سياسة خصومات الأعضاء من قاعدة بيانات وليس Mock فقط.

### الجودة قبل التسليم

- اختبارات للـ QR Functions.
- اختبارات لتسجيل الفعاليات والطلبات.
- اختبار صلاحيات Firestore Rules.
- اختبار Responsive نهائي على Mobile/Tablet/Desktop.
- مراجعة SEO و Metadata لكل الصفحات.

## خطوات ربط Firebase

### 1. إنشاء مشروع Firebase

1. افتح Firebase Console.
2. أنشئ مشروع جديد باسم مناسب، مثال: `scsc-association`.
3. فعّل الخدمات التالية:
   - Authentication
   - Firestore Database
   - Storage
   - Functions

### 2. تفعيل Authentication

1. من Firebase Console افتح Authentication.
2. فعّل Email/Password.
3. أنشئ مستخدم Admin أولي من Console أو من صفحة Signup.
4. بعد نشر Functions، أعط المستخدم دور Admin باستخدام `setUserRole` أو عبر سكربت Admin SDK.

الأدوار يجب أن تكون Custom Claims:

```json
{
  "role": "admin"
}
```

أو:

```json
{
  "role": "moderator"
}
```

المستخدم العادي يكون:

```json
{
  "role": "user"
}
```

### 3. إضافة تطبيق Web في Firebase

1. من Project Settings اختر Add app ثم Web.
2. انسخ Firebase config.
3. أنشئ ملف `.env.local` من `.env.example`.
4. عبئ القيم التالية:

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
```

### 4. إعداد Firebase Admin داخل Next.js

1. من Firebase Console افتح Project Settings.
2. افتح Service Accounts.
3. أنشئ Private Key.
4. أضف القيم في `.env.local`:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

مهم: في Vercel يجب وضع المفتاح الخاص كسطر واحد مع `\n` بدل الأسطر الحقيقية.

### 5. ربط Firebase CLI

ثبت Firebase Tools إن لم تكن مثبتة:

```powershell
npm install
```

ثم سجل الدخول:

```powershell
npx firebase login
```

اربط المشروع:

```powershell
npx firebase use --add
```

اختر Project ID الحقيقي واجعل alias مثلاً `default`.

### 6. نشر قواعد Firestore و Storage

```powershell
npm run firebase:deploy:rules
```

هذا ينشر:

- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`

### 7. إعداد متغيرات Cloud Functions

الكود الحالي في `functions/src/index.ts` يقرأ القيم من `process.env` مباشرة. لذلك قبل نشر Functions أنشئ ملف بيئة داخل مجلد `functions`، مثل `functions/.env`, ولا ترفعه إلى Git.

القيم المطلوبة:

```env
MEMBERSHIP_QR_SECRET=
```

لبيئة الإنتاج، اجعل `MEMBERSHIP_QR_SECRET` قيمة طويلة وعشوائية. مثال توليد قيمة محلية:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 8. بناء ونشر Cloud Functions

```powershell
npm run functions:build
npx firebase deploy --only functions
```

بعد النشر جرّب:

- Contact form.
- إصدار QR من `/profile/membership-card`.
- فتح `/verify?pass=...`.
- إعادة استخدام نفس QR والتأكد أنه يرفضه.

### 9. اختبار محلي مع Firebase Emulators

```powershell
npm run firebase:emulators
```

واجهة Emulators تعمل عادة على:

```text
http://localhost:4000
```

## خطوات النشر على Vercel

### 1. رفع المشروع إلى GitHub

ارفع المشروع إلى Repository على GitHub أو GitLab أو Bitbucket.

### 2. إنشاء مشروع في Vercel

1. افتح Vercel Dashboard.
2. اختر New Project.
3. اربط Repository.
4. Framework يجب أن يتعرف تلقائياً على Next.js.

### 3. إعداد Build Settings

القيم المناسبة:

```text
Install Command: npm install
Build Command: npm run build
Output Directory: .next
Node.js Version: 20 أو 22
```

### 4. إضافة Environment Variables في Vercel

أضف نفس قيم `.env.local` داخل:

Project Settings -> Environment Variables

القيم المطلوبة:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FUNCTIONS_REGION=us-central1
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

لا ترفع `.env.local` إلى Git.

### 5. إضافة Domain

بعد أول Deploy:

1. افتح Project Settings.
2. Domains.
3. أضف دومين الجمعية.
4. اتبع DNS Records التي يعطيها Vercel.

### 6. ربط Firebase Auth مع دومين Vercel

من Firebase Console:

Authentication -> Settings -> Authorized domains

أضف:

- دومين Vercel المؤقت.
- دومين الجمعية النهائي.

مثال:

```text
scsc-association.vercel.app
example.org
```

## أوامر التشغيل المحلية

تثبيت الحزم:

```powershell
npm install
```

الحزمة الجديدة التي تمت إضافتها:

```text
dotenv
```

سبب الإضافة: تشغيل سكربت Seed وقراءة متغيرات البيئة بسهولة.

تشغيل محلي:

```powershell
npm run run:local
```

فحص TypeScript:

```powershell
npm run typecheck:local
```

بناء الإنتاج محلياً:

```powershell
npm run build:local
```

## حسابات Mock التجريبية

عند عدم ضبط Firebase، يمكن تجربة الموقع بالحسابات التالية.

كلمة المرور لكل الحسابات:

```text
admin123
```

- Admin: `admin@example.com`
- Moderator: `moderator@example.com`
- User: `user@example.com`
- User إضافي: `aseel@example.com`
- User إضافي: `lamar@example.com`

## توصية العمل القادمة

أفضل ترتيب قبل التسليم النهائي:

1. إنشاء Firebase Project وربط `.env.local`.
2. نشر Rules و Functions.
3. إنشاء أول Admin Custom Claim.
4. إدخال Seed Data حقيقية في Firestore.
5. تحويل لوحة التحكم من Preview إلى CRUD كامل.
6. اختبار QR والتسجيل والطلبات على Firebase الحقيقي.
7. نشر Vercel وإضافة الدومين إلى Firebase Authorized Domains.
