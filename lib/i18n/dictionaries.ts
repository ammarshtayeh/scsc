import type { AppLocale } from "@/lib/i18n/config";

export const dictionaries = {
  en: {
    localeName: "English",
    languageToggle: {
      label: "Language",
      english: "English",
      arabic: "Arabic",
      switchToEnglish: "Switch to English",
      switchToArabic: "Switch to Arabic"
    },
    site: {
      title: "SCSC-NNU",
      university: "An-Najah National University",
      description:
        "The official platform of the Society of Cosmetics and Skin Care at An-Najah National University."
    },
    nav: {
      home: "Home",
      about: "About",
      education: "Education",
      events: "Events",
      contact: "Contact",
      jobs: "Jobs",
      store: "Store",
      login: "Login",
      signup: "Become a Member",
      logout: "Logout",
      profile: "Profile",
      dashboard: "Dashboard",
      installApp: "Install App",
      installGuideEyebrow: "PWA",
      installGuideTitle: "Install the app on your device",
      installGuideIosTitle: "iPhone and iPad",
      installGuideAndroidTitle: "Android phones",
      installGuideDesktopTitle: "Desktop browsers",
      installGuideIosSteps:
        "Tap Share in Safari, then choose Add to Home Screen, rename if you want, and tap Add.",
      installGuideAndroidSteps:
        "Open the browser menu, choose Install App or Add to Home screen, then confirm the install.",
      installGuideDesktopSteps:
        "Open the browser menu or the install icon in the address bar, then choose Install App.",
      installGuideTip:
        "If the install prompt does not appear, refresh once and try again from the same browser.",
      closeInstallGuide: "Close",
      installAppIosHint: "On iPhone or iPad, open Share and choose Add to Home Screen.",
      installAppAndroidHint:
        "On Android, open the browser menu and choose Install App or Add to Home screen.",
      installAppUnavailableHint:
        "If your browser supports app install, use the browser menu and choose Install App or Add to Home Screen.",
      toggleNavigation: "Toggle navigation"
    },
    common: {
      readMore: "Read More",
      browseArticles: "Browse Articles",
      viewEvent: "View Event",
      eventDetails: "Event Details",
      seeAllEvents: "See All Events",
      all: "All",
      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
      noData: "No data available",
      notProvided: "Not provided",
      saveChanges: "Save Changes",
      refresh: "Refresh",
      toggleTheme: "Toggle theme"
    },
    home: {
      badge: "SCSC-NNU | Student society",
      title: "Society of Cosmetics and Skin Care - An-Najah National University",
      description:
        "A local student society for Cosmetics and Skin Care students, built to strengthen scientific knowledge, practical skills, teamwork, and professional readiness.",
      visionLabel: "Vision",
      visionText:
        "To be a leading student platform in promoting scientific and practical knowledge in cosmetics and skincare, and a source of inspiration for students to achieve academic and professional excellence.",
      missionLabel: "Mission",
      missionText:
        "To empower students through a supportive learning environment and scientific and training activities that develop their skills, prepare them for the professional field, and encourage innovation and continuous learning.",
      joinCta: "Become a Member",
      featuredEventCta: "Explore Featured Event",
      viewEventsCta: "View Events",
      featuredEventLabel: "Featured Event",
      latestNewsLabel: "Latest News",
      latestNewsTitle: "Educational updates, tips, and association insights",
      upcomingEventsLabel: "Activities",
      upcomingEventsTitle: "Scientific, training, and student events from SCSC-NNU",
      slides: [
        {
          title: "Scientific and practical learning",
          caption:
            "Workshops, training sessions, and activities that connect cosmetic knowledge with real practice."
        },
        {
          title: "Student community",
          caption:
            "A collaborative space for students to learn, represent their major, and grow together."
        },
        {
          title: "Professional readiness",
          caption:
            "Connections, initiatives, and learning paths that prepare students for the cosmetics and skincare field."
        }
      ],
      newsEmptyTitle: "No updates available",
      newsEmptyDescription: "Check back soon for new educational content."
    },
    membershipPromo: {
      eyebrow: "Membership",
      title: "Join SCSC-NNU and take part in a focused student community.",
      description:
        "Membership opens at the beginning of each academic year through the society's official platforms. Accepted members receive one-year membership and access to activities, committees, and learning opportunities.",
      benefits: [
        {
          title: "Scientific Growth",
          description:
            "Strengthen your knowledge in cosmetics and skincare through specialized scientific activities."
        },
        {
          title: "Practical Training",
          description:
            "Join workshops, courses, and applied sessions that help build real skills."
        },
        {
          title: "Professional Links",
          description:
            "Connect with committees, initiatives, and relevant professional opportunities."
        }
      ],
      whyTitle: "Membership rules",
      whyDescription:
        "First-degree membership is for Cosmetics and Skin Care students at An-Najah National University. Students from other majors may be accepted as second-degree members according to need.",
      whyExtra:
        "Members commit to the society's regulations, renew membership annually after the new administrative structure is approved, and follow any membership fee decisions issued by the administration and treasurer reports.",
      joinCta: "Become a Member",
      learnMore: "Learn More"
    },
    about: {
      eyebrow: "About the Association",
      title: "A local student society for cosmetics, skincare, and professional growth.",
      description:
        "The Society of Cosmetics and Skin Care - An-Najah National University is a student society that brings together students of the Cosmetics and Skin Care major and represents them inside the university.",
      overviewTitle: "Official identity",
      overviewTextOne:
        "Official name: Society of Cosmetics and Skin Care - An-Najah National University. Official abbreviation: SCSC-NNU.",
      overviewTextTwo:
        "Official languages: Arabic and English. Nature: a local student society for Cosmetics and Skin Care students at An-Najah National University.",
      imageAlt: "Association members collaborating",
      principlesTitle: "General principles",
      principles: [
        "Promote human values, cooperation, and teamwork among students.",
        "Develop scientific and practical knowledge in cosmetics and skincare.",
        "Represent major students inside the university and support their academic and professional level."
      ],
      goalsTitle: "Goals and objectives",
      goals: [
        "Build an interested and integrated student community in the field.",
        "Provide a supportive learning environment for student skill development.",
        "Organize workshops, training courses, and specialized scientific events.",
        "Strengthen students' practical and applied experience.",
        "Spread scientific awareness in skincare and cosmetics.",
        "Connect students with the labor market and specialized bodies.",
        "Encourage scientific research and continuous learning."
      ],
      membershipTitle: "Membership",
      membershipText:
        "Membership opens at the beginning of each academic year or after forming the administrative structure, and registration is announced for a limited period through the society's official platforms. Accepted members receive membership for one year from the joining date.",
      membershipConditions: [
        "First-degree membership is for Cosmetics and Skin Care students at An-Najah National University.",
        "Students from other university majors may be accepted as second-degree members according to need.",
        "Members must follow society regulations and instructions.",
        "Membership is renewed annually after approval and handover of the new administrative structure.",
        "Membership fees, if any, are set or amended based on administration decisions and treasurer reports."
      ],
      structureTitle: "Organizational structure",
      foundingBody:
        "The founding body includes the student members who established the society inside the university.",
      structureLeadershipTitle: "Society leadership",
      structureCommitteesTitle: "Working committees",
      structure: [
        "Founding Body President",
        "Vice President",
        "Treasurer",
        "Media Committee",
        "Public Relations Committee",
        "Activities Committee",
        "Initiatives and Projects Committee",
        "Members Affairs Committee",
        "Scientific Research and Training Committee"
      ],
      boardEyebrow: "Board by Year",
      boardTitle: "Leadership archive",
      boardEmptyTitle: "No data available",
      boardEmptyDescription: "Board members will appear here when records are added."
    },
    education: {
      eyebrow: "Education",
      title: "Professional knowledge made practical.",
      description:
        "Explore association articles across skin care, makeup, hair care, and broader beauty topics with a clean reading experience and thoughtful categorization.",
      emptyTitle: "No updates available",
      emptyDescription: "No articles were found for this category yet.",
      authorPrefix: "By",
      references: "References",
      noReferences: "No references were provided."
    },
    events: {
      eyebrow: "Events",
      title: "Activities, workshops, and student experiences.",
      description:
        "Explore the society's scientific, training, and awareness activities with clear details and smooth registration pages.",
      emptyTitle: "No events scheduled",
      emptyDescription: "Check back soon for future sessions and workshops.",
      eventDetailEyebrow: "Event Detail",
      attendanceNotesTitle: "Attendance Notes",
      attendanceNotesBody:
        "Registration is limited to logged-in members and uses a Firestore transaction to avoid duplicate entries and to disable access when capacity is reached.",
      registeredSuffix: "registered"
    },
    eventRegistration: {
      eyebrow: "Registration",
      title: "Reserve your seat",
      seatsRemaining: "seats remaining",
      full: "This event is currently full.",
      fullButton: "Event Full",
      loginToRegister: "Login to Register",
      registerNow: "Register Now",
      alreadyRegistered: "Already Registered",
      cancelRegistration: "Cancel Registration",
      reserved: "Your seat is already reserved for this event.",
      duplicateNote:
        "Duplicate registrations are prevented through a Firestore transaction per member.",
      success: "Registration confirmed.",
      cancelSuccess: "Registration cancelled.",
      genericError: "Something went wrong while registering."
    },
    contact: {
      eyebrow: "Contact",
      title: "Reach the association team.",
      description:
        "Use the contact form for collaborations, questions, workshop requests, or general support. The form is designed for clear validation and email delivery through Firebase Cloud Functions.",
      cardTitle: "Let's talk",
      cardText:
        "We welcome questions from members, guests, faculty, and brand partners interested in education, events, or student collaboration.",
      emailLabel: "Email",
      instagramLabel: "Instagram",
      locationLabel: "Location",
      locationValue: "New Campus, Nablus",
      officeHoursLabel: "Office hours",
      officeHoursValue: "Sunday to Thursday, 9:00 AM to 4:00 PM",
      formName: "Name",
      formEmail: "Email",
      formMessage: "Message",
      namePlaceholder: "Your name",
      emailPlaceholder: "you@example.com",
      messagePlaceholder: "How can we help?",
      send: "Send Message",
      fillAllFields: "Please fill in all fields.",
      invalidEmail: "Please enter a valid email address.",
      success: "Your message was sent successfully.",
      genericError: "Unable to send your message right now."
    },
    jobs: {
      eyebrow: "Careers",
      title: "Open roles for students and members.",
      description:
        "Browse opportunities posted by partner companies and the association. Apply with your CV and supporting details.",
      detailEyebrow: "Job detail",
      emptyTitle: "No open jobs yet",
      emptyDescription: "New openings from companies and the association will appear here.",
      viewJob: "View & apply",
      postedAt: "Posted",
      noDescription: "No description provided.",
      aboutRole: "About the role",
      requirements: "Requirements",
      applyTitle: "Apply for this role",
      applyHint: "Upload your CV in any common format and add optional details for the employer.",
      fullName: "Full name",
      email: "Email",
      phone: "Phone",
      coverLetter: "Cover letter",
      additionalInfo: "Additional information",
      cvLabel: "CV / resume",
      cvFormats: "PDF, Word, text, OpenDocument, or image — max 10 MB.",
      submitApplication: "Submit application",
      loginToApply: "Sign in to upload your CV and apply.",
      alreadyApplied: "You already applied to this job.",
      jobClosed: "This job is no longer accepting applications.",
      cvRequired: "Please attach your CV.",
      cvTooLarge: "CV must be 10 MB or smaller.",
      profileRequired: "Name and email are required.",
      applySuccess: "Application submitted successfully.",
      applyError: "Unable to submit application."
    },
    auth: {
      loginEyebrow: "Authentication",
      loginTitle: "Access your member account.",
      loginDescription:
        "Login with your email and password to reach your profile, protected store, event registrations, and administrative tools based on your role.",
      signupEyebrow: "Membership",
      signupTitle: "Join the association.",
      signupDescription:
        "Create your member account to unlock event registration, profile tools, QR verification, order history, and member pricing.",
      loginCardTitle: "Login",
      loginCardText:
        "Sign in with your association account. Admin and moderator access is controlled by Firebase roles.",
      emailLabel: "Email",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      signupPasswordPlaceholder: "At least 8 characters with a number",
      signIn: "Sign In",
      continueWithGoogle: "Continue with Google",
      orEmail: "or email",
      forgotPassword: "Forgot password?",
      enterEmailFirst: "Enter your email first to reset your password.",
      resetNeedsFirebase: "Password reset email requires Firebase configuration.",
      resetSent: "Password reset email sent.",
      resetError: "Unable to send reset email.",
      lockoutPrefix: "Too many failed attempts. Try again after",
      invalidCredentials: "Invalid credentials.",
      welcomeBack: "Welcome back.",
      signupCardTitle: "Create your account",
      signupCardText:
        "Register as a member to access the store, event registration, profile tools, and membership benefits.",
      fullName: "Full Name",
      fullNamePlaceholder: "Your full name",
      passwordShort: "Password must be at least 8 characters and include a number.",
      createAccount: "Create Account",
      createSuccess: "Membership account created.",
      emailAlreadyExists: "An account with this email already exists.",
      createError: "Unable to create account."
    },
    store: {
      eyebrow: "Member Store",
      title: "Curated products with member pricing.",
      description:
        "Browse association-approved products, filter by category and company, and check out with cash on delivery while member discounts are applied automatically.",
      detailEyebrow: "Product Detail",
      filters: "Filters",
      filtersText: "Filter by category, company, search, and member price.",
      search: "Search",
      searchPlaceholder: "Search products",
      category: "Category",
      company: "Company",
      maxPrice: "Maximum price",
      viewDetails: "View Details",
      addToCart: "Add to Cart",
      addedToCart: "Added to cart.",
      addToCartError: "Unable to add item.",
      cart: "Cart",
      cartText: "Cash on delivery checkout with member discounts applied automatically.",
      emptyCart: "Your cart is empty.",
      deliveryTitle: "Delivery details",
      deliveryName: "Recipient name",
      deliveryPhone: "Phone number",
      deliveryAddress: "Delivery address",
      deliveryNotes: "Notes",
      deliveryNamePlaceholder: "Full name",
      deliveryPhonePlaceholder: "Phone for order confirmation",
      deliveryAddressPlaceholder: "City, street, building, or pickup note",
      deliveryNotesPlaceholder: "Optional delivery notes",
      deliveryRequired: "Please add recipient name, phone, and delivery address.",
      subtotal: "Subtotal",
      discount: "Discount",
      total: "Total",
      estimatedTotal: "Estimated total",
      checkout: "Checkout (COD)",
      checkoutError: "Checkout failed.",
      renewalPrompt: "Renew your membership to unlock member pricing.",
      cartStockWarning: "This item is no longer available in the requested quantity.",
      noProductsTitle: "No products found",
      noProductsDescription:
        "Try adjusting your category, company, search, or price filters.",
      orderConfirmedPrefix: "Order confirmed with ID",
      unitsAvailable: "units available",
      outOfStock: "Currently out of stock",
      stockSuffix: "in stock",
      manage: "Manage"
    },
    profile: {
      eyebrow: "Member Profile",
      title: "Your membership identity and account history.",
      description:
        "Manage profile details, open your membership card, and review your order history in one secure place.",
      membershipStatus: "Membership Status",
      orders: "Orders",
      registeredEvents: "Registered Events",
      savedArticles: "Saved Articles",
      personalDashboard: "Personal Dashboard",
      membershipCardEyebrow: "Membership Card",
      membershipCardTitle: "Digital membership card",
      membershipCardDescription:
        "Open your secure, short-lived QR pass on a dedicated page with one-time validation.",
      membershipCardInfoDescription:
        "Your membership card details are shown here. Open the QR only when you need live verification.",
      membershipCardOnlyHint:
        "The live QR is available only on the membership card page for better security.",
      viewMembershipCard: "View Membership QR",
      membershipCardLabel: "Official Member ID",
      membershipCardAssociationLine: "Cosmetics & Skin Care",
      membershipCardValidUntil: "Valid until",
      membershipCardMemberSince: "Member since",
      backToDashboard: "Back to Personal Dashboard",
      memberId: "Member ID",
      role: "Role",
      membershipExpiry: "Membership expiry",
      joined: "Joined",
      company: "Company",
      phone: "Phone",
      qrEyebrow: "Membership QR",
      qrTitle: "Secure dynamic access pass",
      qrGenerating: "Generating secure QR...",
      qrMemberId: "Embedded member ID",
      qrName: "Embedded name",
      qrExpiryDate: "Embedded expiry date",
      qrExpiresIn: "QR expires in",
      secondsLabel: "seconds",
      qrUnavailableTitle: "QR unavailable",
      qrUnavailableDescription:
        "Only active memberships can generate a temporary QR access pass.",
      qrRefreshed: "Membership QR refreshed.",
      qrIssueError: "Unable to issue QR session.",
      securityTitle: "Security Features",
      securityOne: "Dynamic QR sessions with short lifetime of about 45 seconds.",
      securityTwo: "One-time-use validation with server-side duplicate detection.",
      securityThree: "Automatic invalidation of any previous QR when a new one is issued.",
      securityFour: "Expired or stale screenshots stop working automatically.",
      securityFive:
        "Server validation checks status, expiry, freshness, and token integrity before approval.",
      qrHelp:
        "This pass expires quickly, refreshes automatically, becomes invalid after a successful scan, and any duplicate attempt is rejected server-side.",
      qrScreenshotWarning:
        "Screenshot copies expire quickly and are rejected after the first successful scan.",
      editProfile: "Edit Profile",
      changePassword: "Change Password",
      changePasswordHint: "Send a secure password reset link to your account email.",
      profilePhoto: "Profile Photo",
      profileUpdated: "Profile updated.",
      profileUpdateError: "Unable to update profile.",
      loadingProfile: "Loading profile...",
      orderHistory: "Order History",
      noOrders: "No orders recorded yet.",
      noRegisteredEvents: "No registered events yet.",
      noSavedArticles: "No saved articles yet.",
      membershipReceiptEyebrow: "Payment Receipt",
      membershipReceiptTitle: "Membership payment confirmed",
      membershipReceiptDescription:
        "Your membership fee has been recorded. Keep this receipt number for your records.",
      membershipReceiptId: "Receipt number",
      membershipPaidAt: "Payment date",
      membershipFeeAmount: "Amount paid",
      membershipPaymentPending: "Payment pending",
      membershipPaymentPendingDescription:
        "Your membership payment will appear here after admin approval.",
      qrRetry: "Try again",
      profileLoadError: "Unable to load your profile.",
      profileRetry: "Retry"
    },
    dashboard: {
      eyebrow: "Admin Dashboard",
      title: "Operational visibility for members, content, and commerce.",
      description:
        "Manage events, products, orders, users, and moderated content from a single dashboard designed around quick scanning and clear next actions.",
      sectionTitle: "Dashboard",
      overview: "Overview",
      totalUsers: "Total Users",
      upcomingEvents: "Upcoming Events",
      totalOrders: "Total Orders",
      registeredCompanies: "Registered Companies",
      eventManagement: "Event Management",
      productManagement: "Product Management",
      eventRegistrants: "Event Registrants",
      boardMembers: "Board Members",
      jobManagement: "Jobs",
      userManagement: "User Management",
      orders: "Orders",
      moderation: "Content Moderation",
      addEvent: "Add Event",
      addProduct: "Add Product",
      edit: "Edit",
      review: "Review",
      approved: "Approved",
      pending: "Pending",
      items: "items",
      save: "Save",
      delete: "Delete",
      approve: "Approve",
      reject: "Reject",
      actionSaved: "Saved successfully.",
      actionFailed: "Action failed.",
      eventTitlePlaceholder: "Event title",
      eventVenuePlaceholder: "Venue",
      eventCapacityPlaceholder: "Capacity",
      eventCoverImagePlaceholder: "Cover image URL",
      eventExcerptPlaceholder: "Short description",
      eventDescriptionPlaceholder: "Full description, one paragraph per line",
      eventTagsPlaceholder: "Tags separated by comma",
      productNamePlaceholder: "Product name",
      productCompanyPlaceholder: "Company",
      productImagePlaceholder: "Image URL",
      productDescriptionPlaceholder: "Short description",
      productLongDescriptionPlaceholder: "Long description, one paragraph per line"
    },
    verify: {
      eyebrow: "Membership Verification",
      loading: "Verifying membership...",
      valid: "Membership Valid",
      invalid: "Membership Invalid",
      validBody:
        "Verified member: {name}. This QR session was approved and invalidated immediately after the scan.",
      memberId: "Member ID",
      memberName: "Member",
      membershipExpiry: "Membership expiry",
      verifiedAt: "Verified at",
      associationShort: "SCSC-NNU",
      associationLine: "Society of Cosmetics & Skin Care",
      university: "An-Najah National University",
      nameLabel: "Name",
      studentIdLabel: "Student ID",
      degreeLabel: "Degree",
      expLabel: "EXP",
      verifiedStamp: "Verified",
      reasonDuplicate:
        "This QR has already been used once. Duplicate use was detected and rejected.",
      reasonExpired:
        "This QR session expired before verification. A fresh QR must be generated.",
      reasonInactive: "This membership is not currently active for validation.",
      reasonStale:
        "This QR is no longer the latest active pass. A newer pass has already replaced it.",
      reasonInvalid:
        "This membership pass is missing, invalid, expired, or no longer approved."
    },
    notFound: {
      title: "The page you requested was not found",
      description:
        "The content may have been removed, renamed, or is no longer available.",
      backHome: "Back to Home"
    },
    footer: {
      explore: "Explore",
      contact: "Contact",
      instagram: "Instagram",
      membership: "Membership",
      membershipText:
        "Join for workshops, discounts, community access, and professional growth opportunities.",
      location: "New Campus, Nablus",
      officeHours: "Sun-Thu, 9:00 AM - 4:00 PM"
    },
    categories: {
      article: {
        "Skin Care": "Skin Care",
        Makeup: "Makeup",
        "Hair Care": "Hair Care",
        Others: "Others"
      },
      product: {
        "Skin Care": "Skin Care",
        "Body Care": "Body Care",
        Makeup: "Makeup",
        Masks: "Masks"
      },
      tags: {
        Workshop: "Workshop",
        Research: "Research",
        Networking: "Networking",
        Makeup: "Makeup",
        Lab: "Lab",
        Members: "Members",
        Orientation: "Orientation"
      },
      roles: {
        admin: "Admin",
        moderator: "Moderator",
        company: "Company",
        user: "User"
      },
      boardRoles: {
        President: "President",
        "Vice President": "Vice President",
        Treasurer: "Treasurer"
      },
      orderStatus: {
        pending: "Pending",
        confirmed: "Confirmed",
        processing: "Processing",
        delivered: "Delivered"
      },
      membershipStatus: {
        active: "Active",
        expired: "Expired",
        pendingRenewal: "Pending Renewal"
      }
    }
  },
  ar: {
    localeName: "العربية",
    languageToggle: {
      label: "اللغة",
      english: "الإنجليزية",
      arabic: "العربية",
      switchToEnglish: "التبديل إلى الإنجليزية",
      switchToArabic: "التبديل إلى العربية"
    },
    site: {
      title: "SCSC-NNU",
      university: "جامعة النجاح الوطنية",
      description:
        "المنصة الرسمية لجمعية مستحضرات التجميل والعناية بالبشرة في جامعة النجاح الوطنية."
    },
    nav: {
      home: "الرئيسية",
      about: "من نحن",
      education: "التثقيف",
      events: "الفعاليات",
      contact: "تواصل معنا",
      jobs: "الوظائف",
      store: "المتجر",
      login: "تسجيل الدخول",
      signup: "انضم كعضو",
      logout: "تسجيل الخروج",
      profile: "الملف الشخصي",
      dashboard: "لوحة التحكم",
      installApp: "تثبيت التطبيق",
      installGuideEyebrow: "PWA",
      installGuideTitle: "ثبت التطبيق على جهازك",
      installGuideIosTitle: "iPhone و iPad",
      installGuideAndroidTitle: "هواتف Android",
      installGuideDesktopTitle: "متصفحات الكمبيوتر",
      installGuideIosSteps:
        "افتح زر المشاركة في Safari ثم اختر إضافة إلى الشاشة الرئيسية، عدّل الاسم إذا أردت ثم اضغط إضافة.",
      installGuideAndroidSteps:
        "افتح قائمة المتصفح ثم اختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية وبعدها أكّد التثبيت.",
      installGuideDesktopSteps:
        "افتح قائمة المتصفح أو أيقونة التثبيت داخل شريط العنوان ثم اختر تثبيت التطبيق.",
      installGuideTip:
        "إذا لم تظهر نافذة التثبيت مباشرة، حدّث الصفحة مرة واحدة ثم حاول من نفس المتصفح.",
      closeInstallGuide: "إغلاق",
      installAppIosHint: "على iPhone أو iPad افتح مشاركة ثم اختر إضافة إلى الشاشة الرئيسية.",
      installAppAndroidHint:
        "على Android افتح قائمة المتصفح ثم اختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.",
      installAppUnavailableHint:
        "إذا كان متصفحك يدعم التثبيت، افتح قائمة المتصفح ثم اختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.",
      toggleNavigation: "تبديل القائمة"
    },
    common: {
      readMore: "اقرأ المزيد",
      browseArticles: "تصفح المقالات",
      viewEvent: "عرض الفعالية",
      eventDetails: "تفاصيل الفعالية",
      seeAllEvents: "كل الفعاليات",
      all: "الكل",
      previous: "السابق",
      next: "التالي",
      page: "الصفحة",
      of: "من",
      noData: "لا توجد بيانات",
      notProvided: "غير متوفر",
      saveChanges: "حفظ التعديلات",
      refresh: "تحديث",
      toggleTheme: "تبديل المظهر"
    },
    home: {
      badge: "SCSC-NNU | جمعية طلابية",
      title: "جمعية مستحضرات التجميل والعناية بالبشرة - جامعة النجاح الوطنية",
      description:
        "جمعية طلابية محلية لطلبة تخصص مستحضرات التجميل والعناية بالبشرة، تعمل على تعزيز المعرفة العلمية والعملية وروح التعاون والجاهزية المهنية.",
      visionLabel: "الرؤية",
      visionText:
        "أن تكون جمعية مستحضرات التجميل والعناية بالبشرة منصة طلابية رائدة في تعزيز المعرفة العلمية والعملية في مجال التجميل، ومصدر إلهام للطلبة نحو التميز الأكاديمي والمهني.",
      missionLabel: "الرسالة",
      missionText:
        "تسعى الجمعية إلى تمكين الطلبة من خلال توفير بيئة تعليمية داعمة، وتنظيم أنشطة وفعاليات علمية وتدريبية تسهم في تطوير مهاراتهم وتعزيز جاهزيتهم لسوق العمل، مع تشجيع الابتكار والتعلم المستمر.",
      joinCta: "انضم كعضو",
      featuredEventCta: "استكشف الفعالية المميزة",
      viewEventsCta: "عرض الفعاليات",
      featuredEventLabel: "فعالية مميزة",
      latestNewsLabel: "آخر المستجدات",
      latestNewsTitle: "مستجدات تعليمية ونصائح ورؤى من الجمعية",
      upcomingEventsLabel: "الفعاليات",
      upcomingEventsTitle: "فعاليات علمية وتدريبية وطلابية من SCSC-NNU",
      slides: [
        {
          title: "تعلم علمي وعملي",
          caption: "ورش ودورات وفعاليات تربط المعرفة في مستحضرات التجميل والعناية بالبشرة بالتطبيق الواقعي."
        },
        {
          title: "مجتمع طلابي",
          caption: "مساحة تعاونية للطلبة للتعلم وتمثيل التخصص والنمو معًا داخل الجامعة."
        },
        {
          title: "جاهزية مهنية",
          caption: "مبادرات وروابط تعليمية ومهنية تساعد الطلبة على الاستعداد لسوق العمل."
        }
      ],
      newsEmptyTitle: "لا توجد تحديثات حاليًا",
      newsEmptyDescription: "عودوا قريبًا للاطلاع على محتوى تعليمي جديد."
    },
    membershipPromo: {
      eyebrow: "العضوية",
      title: "انضم إلى SCSC-NNU وكن جزءًا من مجتمع طلابي متخصص.",
      description:
        "يُفتح باب الانتساب مع بداية كل سنة دراسية عبر المنصات الرسمية للجمعية لمدة محددة. يحصل العضو المقبول على عضوية لمدة سنة واحدة من تاريخ الانضمام.",
      benefits: [
        {
          title: "تطور علمي",
          description: "تعزيز المعرفة في مستحضرات التجميل والعناية بالبشرة من خلال فعاليات علمية متخصصة."
        },
        {
          title: "تدريب عملي",
          description: "المشاركة في ورش عمل ودورات تدريبية وجلسات تطبيقية تساعد على بناء المهارات."
        },
        {
          title: "روابط مهنية",
          description: "التواصل مع اللجان والمبادرات والجهات المختصة وفرص التطور المهني."
        }
      ],
      whyTitle: "شروط الانتساب",
      whyDescription:
        "العضوية من الدرجة الأولى مخصصة لطلبة تخصص مستحضرات التجميل والعناية بالبشرة في جامعة النجاح الوطنية، ويمكن قبول طلبة من تخصصات أخرى كعضوية درجة ثانية  .",
      whyExtra:
        "يلتزم الأعضاء بأنظمة وتعليمات الجمعية، وتجدد العضوية سنويًا بعد اعتماد وتسليم الهيكلية الإدارية الجديدة، وتحدد رسوم الانتساب إن وجدت وفق قرارات الإدارة وتقارير أمين الصندوق.",
      joinCta: "انضم كعضو",
      learnMore: "اعرف المزيد"
    },
    about: {
      eyebrow: "عن الجمعية",
      title: "جمعية طلابية محلية للتجميل والعناية بالبشرة والتطور المهني.",
      description:
        "جمعية مستحضرات التجميل والعناية بالبشرة - جامعة النجاح الوطنية هي جمعية طلابية تضم طلبة التخصص وتمثلهم داخل الجامعة.",
      overviewTitle: "هوية الجمعية",
      overviewTextOne:
        "الاسم الصريح: جمعية مستحضرات التجميل والعناية بالبشرة - جامعة النجاح الوطنية. الاسم بالإنجليزية: Society of Cosmetics and Skin Care - An Najah National University.",
      overviewTextTwo:
        "الاختصار الرسمي: SCSC-NNU. اللغة الرسمية: العربية والإنجليزية. الطبيعة: جمعية طلابية محلية تضم طلبة تخصص مستحضرات التجميل والعناية بالبشرة في جامعة النجاح الوطنية.",
      imageAlt: "أعضاء الجمعية أثناء التعاون",
      principlesTitle: "المبادئ العامة",
      principles: [
        "تعزيز القيم الإنسانية وروح التعاون والعمل الجماعي بين الطلبة.",
        "تطوير المعرفة العلمية والعملية في مجال مستحضرات التجميل والعناية بالبشرة.",
        "تمثيل طلبة التخصص داخل الجامعة والمساهمة في رفع مستواهم الأكاديمي والمهني."
      ],
      goalsTitle: "الأهداف والغايات",
      goals: [
        "بناء مجتمع طلابي مهتم ومتكامل في هذا المجال.",
        "توفير بيئة تعليمية داعمة لتطوير مهارات الطلبة.",
        "تنظيم ورش عمل ودورات تدريبية وفعاليات علمية متخصصة.",
        "تعزيز الجانب العملي والتطبيقي لدى الطلبة.",
        "نشر الوعي العلمي في مجال العناية بالبشرة والتجميل.",
        "ربط الطلبة بسوق العمل والجهات المختصة.",
        "تشجيع البحث العلمي والتعلم المستمر."
      ],
      membershipTitle: "الانتساب",
      membershipText:
        "يتم فتح باب الانتساب مع بداية كل سنة دراسية أو بعد تشكيل الهيكلية الإدارية، ويتم الإعلان عن فترة التسجيل عبر المنصات الرسمية للجمعية. يحصل العضو المقبول على عضوية لمدة سنة واحدة من تاريخ الانضمام.",
      membershipConditions: [
        "أن يكون الطالب/ـة من طلبة تخصص مستحضرات التجميل والعناية بالبشرة في جامعة النجاح الوطنية كعضوية درجة أولى.",
        "يمكن قبول طلبة من تخصصات أخرى داخل الجامعة   كعضوية درجة ثانية.",
        "الالتزام بأنظمة وتعليمات الجمعية.",
        "تجديد العضوية سنويًا بعد اعتماد وتسليم الهيكلية الإدارية الجديدة.",
        "تحديد رسوم الانتساب إن وجدت أو تعديلها بناءً على قرارات الإدارة وتقارير أمين الصندوق."
      ],
      structureTitle: "الهيكل التنظيمي",
      foundingBody:
        "الهيئة التأسيسية هم الأعضاء الطلاب الذين قاموا بتأسيس الجمعية داخل الجامعة.",
      structureLeadershipTitle: "قيادة الجمعية",
      structureCommitteesTitle: "اللجان العاملة",
      structure: [
        "رئيس الهيئة التأسيسية",
        "نائبة الرئيس",
        "أمين الصندوق",
        "اللجنة الإعلامية",
        "لجنة العلاقات العامة",
        "لجنة الأنشطة",
        "لجنة المبادرات والمشاريع",
        "لجنة شؤون الأعضاء",
        "لجنة البحث العلمي والتدريب"
      ],
      boardEyebrow: "الهيئة الإدارية حسب السنة",
      boardTitle: "أرشيف القيادة",
      boardEmptyTitle: "لا توجد بيانات",
      boardEmptyDescription: "ستظهر أسماء أعضاء الهيئة الإدارية هنا عند إضافة السجلات."
    },
    education: {
      eyebrow: "التثقيف",
      title: "معرفة مهنية بصيغة عملية.",
      description:
        "استكشف مقالات الجمعية في العناية بالبشرة والمكياج والعناية بالشعر وموضوعات الجمال الأوسع ضمن تجربة قراءة مرتبة وواضحة.",
      emptyTitle: "لا توجد تحديثات حاليًا",
      emptyDescription: "لم يتم العثور على مقالات في هذا التصنيف بعد.",
      authorPrefix: "بقلم",
      references: "المراجع",
      noReferences: "لا توجد مراجع مضافة."
    },
    events: {
      eyebrow: "الفعاليات",
      title: "أنشطة وورش وتجارب طلابية.",
      description:
        "استكشف فعاليات الجمعية العلمية والتدريبية والتوعوية مع تفاصيل واضحة وصفحات معدّة لتسجيل سلس.",
      emptyTitle: "لا توجد فعاليات مجدولة",
      emptyDescription: "تحقق لاحقًا للاطلاع على ورش وجلسات جديدة.",
      eventDetailEyebrow: "تفاصيل الفعالية",
      attendanceNotesTitle: "ملاحظات الحضور",
      attendanceNotesBody:
        "التسجيل متاح فقط للأعضاء المسجلين دخولًا، ويستخدم معاملة فايرستور لمنع التكرار وتعطيل التسجيل عند اكتمال السعة.",
      registeredSuffix: "مسجل"
    },
    eventRegistration: {
      eyebrow: "التسجيل",
      title: "احجز مقعدك",
      seatsRemaining: "مقعدًا متبقيًا",
      full: "هذه الفعالية ممتلئة حاليًا.",
      fullButton: "الفعالية ممتلئة",
      loginToRegister: "سجّل الدخول للتسجيل",
      registerNow: "سجّل الآن",
      alreadyRegistered: "مسجل مسبقًا",
      cancelRegistration: "إلغاء التسجيل",
      reserved: "تم حجز مقعدك مسبقًا في هذه الفعالية.",
      duplicateNote: "يتم منع التسجيل المكرر عبر معاملة فايرستور لكل عضو.",
      success: "تم تأكيد التسجيل.",
      cancelSuccess: "تم إلغاء التسجيل.",
      genericError: "حدث خطأ أثناء التسجيل."
    },
    contact: {
      eyebrow: "تواصل معنا",
      title: "تواصل مع فريق الجمعية.",
      description:
        "استخدم نموذج التواصل للاستفسارات والتعاون وطلبات الورش أو الدعم العام. النموذج مصمم مع تحقق واضح وإرسال بريد عبر دوال فايربيس السحابية.",
      cardTitle: "لنتحدث",
      cardText:
        "نرحب بأسئلة الأعضاء والزوار وأعضاء الهيئة التدريسية والشركاء المهتمين بالتعليم والفعاليات أو التعاون الطلابي.",
      emailLabel: "البريد الإلكتروني",
      instagramLabel: "إنستغرام",
      locationLabel: "الموقع",
      locationValue: "الحرم الجديد، نابلس",
      officeHoursLabel: "ساعات الدوام",
      officeHoursValue: "الأحد إلى الخميس، 9:00 صباحًا حتى 4:00 مساءً",
      formName: "الاسم",
      formEmail: "البريد الإلكتروني",
      formMessage: "الرسالة",
      namePlaceholder: "اسمك",
      emailPlaceholder: "you@example.com",
      messagePlaceholder: "كيف يمكننا مساعدتك؟",
      send: "إرسال الرسالة",
      fillAllFields: "يرجى تعبئة جميع الحقول.",
      invalidEmail: "يرجى إدخال بريد إلكتروني صالح.",
      success: "تم إرسال رسالتك بنجاح.",
      genericError: "تعذر إرسال رسالتك في الوقت الحالي."
    },
    jobs: {
      eyebrow: "الوظائف",
      title: "فرص عمل للطلاب والأعضاء.",
      description:
        "تصفح الوظائف التي تنشرها الشركات الشريكة والجمعية، وقدّم طلبك مع السيرة الذاتية والمعلومات الداعمة.",
      detailEyebrow: "تفاصيل الوظيفة",
      emptyTitle: "لا توجد وظائف مفتوحة حالياً",
      emptyDescription: "ستظهر هنا الفرص الجديدة من الشركات والجمعية.",
      viewJob: "عرض والتقديم",
      postedAt: "نُشرت",
      noDescription: "لا يوجد وصف.",
      aboutRole: "عن الوظيفة",
      requirements: "المتطلبات",
      applyTitle: "قدّم على هذه الوظيفة",
      applyHint: "ارفع سيرتك بأي صيغة شائعة وأضف معلومات إضافية لصاحب الوظيفة.",
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "الهاتف",
      coverLetter: "رسالة التقديم",
      additionalInfo: "معلومات إضافية",
      cvLabel: "السيرة الذاتية",
      cvFormats: "PDF أو Word أو نص أو OpenDocument أو صورة — بحد أقصى 10 ميغابايت.",
      submitApplication: "إرسال الطلب",
      loginToApply: "سجّل الدخول لرفع السيرة والتقديم.",
      alreadyApplied: "لقد تقدمت مسبقاً لهذه الوظيفة.",
      jobClosed: "هذه الوظيفة لم تعد تقبل طلبات.",
      cvRequired: "يرجى إرفاق السيرة الذاتية.",
      cvTooLarge: "حجم السيرة يجب ألا يتجاوز 10 ميغابايت.",
      profileRequired: "الاسم والبريد مطلوبان.",
      applySuccess: "تم إرسال طلبك بنجاح.",
      applyError: "تعذر إرسال الطلب."
    },
    auth: {
      loginEyebrow: "المصادقة",
      loginTitle: "ادخل إلى حسابك العضوي.",
      loginDescription:
        "سجّل الدخول عبر البريد الإلكتروني وكلمة المرور للوصول إلى ملفك الشخصي والمتجر المحمي والتسجيل في الفعاليات وأدوات الإدارة حسب صلاحيتك.",
      signupEyebrow: "العضوية",
      signupTitle: "انضم إلى الجمعية.",
      signupDescription:
        "أنشئ حساب العضوية للوصول إلى التسجيل في الفعاليات وأدوات الملف الشخصي والتحقق برمز الاستجابة السريعة وسجل الطلبات وأسعار الأعضاء.",
      loginCardTitle: "تسجيل الدخول",
      loginCardText:
        "سجّل الدخول بحساب الجمعية. صلاحيات الإدارة والمراجعة تُدار من أدوار فايربيس.",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      passwordPlaceholder: "أدخل كلمة المرور",
      signupPasswordPlaceholder: "8 أحرف على الأقل مع رقم",
      signIn: "دخول",
      continueWithGoogle: "المتابعة عبر جوجل",
      orEmail: "أو البريد",
      forgotPassword: "نسيت كلمة المرور؟",
      enterEmailFirst: "أدخل بريدك الإلكتروني أولًا لإرسال إعادة تعيين كلمة المرور.",
      resetNeedsFirebase: "إرسال بريد إعادة التعيين يتطلب إعداد فايربيس.",
      resetSent: "تم إرسال بريد إعادة تعيين كلمة المرور.",
      resetError: "تعذر إرسال بريد إعادة التعيين.",
      lockoutPrefix: "عدد كبير من المحاولات الفاشلة. حاول مرة أخرى بعد",
      invalidCredentials: "بيانات الدخول غير صحيحة.",
      welcomeBack: "أهلًا بعودتك.",
      signupCardTitle: "أنشئ حسابك",
      signupCardText:
        "سجّل كعضو للوصول إلى المتجر والتسجيل في الفعاليات وأدوات الملف الشخصي ومزايا العضوية.",
      fullName: "الاسم الكامل",
      fullNamePlaceholder: "اسمك الكامل",
      companyLabel: "الجمعية / الشركة",
      companyPlaceholder: "اختياري",
      passwordShort: "يجب أن تكون كلمة المرور 8 أحرف على الأقل وتحتوي على رقم.",
      createAccount: "إنشاء الحساب",
      createSuccess: "تم إنشاء حساب العضوية.",
      emailAlreadyExists: "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.",
      createError: "تعذر إنشاء الحساب."
    },
    store: {
      eyebrow: "متجر الأعضاء",
      title: "منتجات مختارة بأسعار خاصة للأعضاء.",
      description:
        "تصفح المنتجات المعتمدة من الجمعية، وصفّها حسب التصنيف أو الشركة، وأكمل الطلب بالدفع عند الاستلام مع تطبيق خصومات الأعضاء تلقائيًا.",
      detailEyebrow: "تفاصيل المنتج",
      filters: "الفلاتر",
      filtersText: "صفّ حسب التصنيف والشركة والبحث والسعر الخاص بالأعضاء.",
      search: "بحث",
      searchPlaceholder: "ابحث عن منتجات",
      category: "التصنيف",
      company: "الشركة",
      maxPrice: "أعلى سعر",
      viewDetails: "عرض التفاصيل",
      addToCart: "أضف إلى السلة",
      addedToCart: "تمت إضافة المنتج إلى السلة.",
      addToCartError: "تعذر إضافة المنتج.",
      cart: "السلة",
      cartText: "الدفع عند الاستلام مع تطبيق خصومات الأعضاء تلقائيًا.",
      emptyCart: "سلتك فارغة.",
      deliveryTitle: "بيانات التوصيل",
      deliveryName: "اسم المستلم",
      deliveryPhone: "رقم الهاتف",
      deliveryAddress: "عنوان التوصيل",
      deliveryNotes: "ملاحظات",
      deliveryNamePlaceholder: "الاسم الكامل",
      deliveryPhonePlaceholder: "رقم للتأكيد على الطلب",
      deliveryAddressPlaceholder: "المدينة، الشارع، المبنى، أو ملاحظة الاستلام",
      deliveryNotesPlaceholder: "ملاحظات اختيارية للتوصيل",
      deliveryRequired: "يرجى إضافة اسم المستلم ورقم الهاتف وعنوان التوصيل.",
      subtotal: "المجموع الفرعي",
      discount: "الخصم",
      total: "الإجمالي",
      estimatedTotal: "الإجمالي التقديري",
      checkout: "إتمام الطلب بالدفع عند الاستلام",
      checkoutError: "فشل إتمام الطلب.",
      renewalPrompt: "جدّد عضويتك لتفعيل أسعار الأعضاء.",
      cartStockWarning: "هذا المنتج لم يعد متوفرًا بالكمية المطلوبة.",
      noProductsTitle: "لم يتم العثور على منتجات",
      noProductsDescription: "جرّب تعديل التصنيف أو الشركة أو البحث أو السعر.",
      orderConfirmedPrefix: "تم تأكيد الطلب بالرقم",
      unitsAvailable: "وحدة متوفرة",
      outOfStock: "غير متوفر حاليًا",
      stockSuffix: "في المخزون",
      manage: "إدارة"
    },
    profile: {
      eyebrow: "الملف الشخصي للعضو",
      title: "هوية عضويتك وسجل حسابك.",
      description:
        "أدر بيانات ملفك الشخصي، وافتح بطاقة العضوية، وراجع سجل الطلبات في مكان واحد آمن.",
      membershipStatus: "حالة العضوية",
      orders: "الطلبات",
      registeredEvents: "الفعاليات المسجلة",
      savedArticles: "المقالات المحفوظة",
      personalDashboard: "اللوحة الشخصية",
      membershipCardEyebrow: "بطاقة العضوية",
      membershipCardTitle: "بطاقة عضوية رقمية",
      membershipCardDescription:
        "افتح رمز استجابة سريع آمن وقصير العمر في صفحة مخصصة مع تحقق لمرة واحدة.",
      membershipCardInfoDescription:
        "تظهر هنا معلومات بطاقة العضوية. افتح رمز الاستجابة السريعة فقط عند الحاجة إلى تحقق مباشر.",
      membershipCardOnlyHint:
        "رمز الاستجابة السريعة الحي متاح فقط من خلال صفحة بطاقة العضوية لمزيد من الأمان.",
      viewMembershipCard: "عرض رمز العضوية",
      membershipCardLabel: "بطاقة منتسب رسمية",
      membershipCardAssociationLine: "مستحضرات التجميل والعناية بالبشرة",
      membershipCardValidUntil: "صالحة حتى",
      membershipCardMemberSince: "عضو منذ",
      backToDashboard: "العودة إلى اللوحة الشخصية",
      memberId: "رقم العضوية",
      role: "الصلاحية",
      membershipExpiry: "انتهاء العضوية",
      joined: "تاريخ الانضمام",
      company: "الشركة",
      phone: "رقم الهاتف",
      qrEyebrow: "رمز العضوية",
      qrTitle: "بطاقة دخول ديناميكية آمنة",
      qrGenerating: "جارٍ إنشاء رمز آمن...",
      qrMemberId: "رقم العضوية داخل الرمز",
      qrName: "الاسم داخل الرمز",
      qrExpiryDate: "تاريخ الانتهاء داخل الرمز",
      qrExpiresIn: "ينتهي الرمز خلال",
      secondsLabel: "ثانية",
      qrUnavailableTitle: "الرمز غير متاح",
      qrUnavailableDescription: "فقط العضويات النشطة يمكنها إنشاء رمز مؤقت.",
      qrRefreshed: "تم تحديث رمز العضوية.",
      qrIssueError: "تعذر إنشاء جلسة الرمز.",
      securityTitle: "ميزات الأمان",
      securityOne: "جلسات رمز ديناميكية بعمر قصير يقارب 45 ثانية.",
      securityTwo: "تحقق لمرة واحدة مع كشف التكرار من جهة الخادم.",
      securityThree: "إلغاء تلقائي لأي رمز سابق عند إصدار رمز جديد.",
      securityFour: "الصور الملتقطة أو الرموز القديمة تتوقف تلقائيًا عن العمل.",
      securityFive:
        "التحقق من جهة الخادم يفحص الحالة والانتهاء والحداثة وسلامة الرمز قبل القبول.",
      qrHelp:
        "هذه البطاقة تنتهي بسرعة، وتتجدد تلقائيًا، وتصبح غير صالحة بعد أول مسح ناجح، وأي محاولة مكررة يتم رفضها من جهة الخادم.",
      qrScreenshotWarning:
        "لقطات الشاشة تنتهي بسرعة ويتم رفضها بعد أول مسح ناجح.",
      editProfile: "تعديل الملف الشخصي",
      changePassword: "تغيير كلمة المرور",
      changePasswordHint: "أرسل رابطًا آمنًا لإعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
      profilePhoto: "الصورة الشخصية",
      profileUpdated: "تم تحديث الملف الشخصي.",
      profileUpdateError: "تعذر تحديث الملف الشخصي.",
      loadingProfile: "جارٍ تحميل الملف الشخصي...",
      orderHistory: "سجل الطلبات",
      noOrders: "لا توجد طلبات بعد.",
      noRegisteredEvents: "لا توجد فعاليات مسجلة بعد.",
      noSavedArticles: "لا توجد مقالات محفوظة بعد.",
      membershipReceiptEyebrow: "وصل الدفع",
      membershipReceiptTitle: "تم تأكيد دفع العضوية",
      membershipReceiptDescription:
        "تم تسجيل رسوم عضويتك. احتفظ برقم الوصل للمراجعة.",
      membershipReceiptId: "رقم الوصل",
      membershipPaidAt: "تاريخ الدفع",
      membershipFeeAmount: "المبلغ المدفوع",
      membershipPaymentPending: "الدفع قيد الانتظار",
      membershipPaymentPendingDescription:
        "سيظهر وصل الدفع هنا بعد موافقة الإدارة على عضويتك.",
      qrRetry: "إعادة المحاولة",
      profileLoadError: "تعذر تحميل الملف الشخصي.",
      profileRetry: "إعادة المحاولة"
    },
    dashboard: {
      eyebrow: "لوحة تحكم الإدارة",
      title: "رؤية تشغيلية للأعضاء والمحتوى والتجارة.",
      description:
        "أدر الفعاليات والمنتجات والطلبات والمستخدمين والمحتوى الخاضع للمراجعة من لوحة واحدة مصممة للمتابعة السريعة والقرارات الواضحة.",
      sectionTitle: "لوحة التحكم",
      overview: "نظرة عامة",
      totalUsers: "إجمالي المستخدمين",
      upcomingEvents: "الفعاليات القادمة",
      totalOrders: "إجمالي الطلبات",
      registeredCompanies: "الشركات المسجلة",
      eventManagement: "إدارة الفعاليات",
      productManagement: "إدارة المنتجات",
      eventRegistrants: "مسجلو الفعاليات",
      boardMembers: "الهيئة الإدارية",
      jobManagement: "الوظائف",
      userManagement: "إدارة المستخدمين",
      orders: "الطلبات",
      moderation: "مراجعة المحتوى",
      addEvent: "إضافة فعالية",
      addProduct: "إضافة منتج",
      edit: "تعديل",
      review: "مراجعة",
      approved: "مقبول",
      pending: "قيد الانتظار",
      items: "عناصر",
      save: "حفظ",
      delete: "حذف",
      approve: "قبول",
      reject: "رفض",
      actionSaved: "تم الحفظ بنجاح.",
      actionFailed: "تعذر تنفيذ الإجراء.",
      eventTitlePlaceholder: "عنوان الفعالية",
      eventVenuePlaceholder: "المكان",
      eventCapacityPlaceholder: "السعة",
      eventCoverImagePlaceholder: "رابط صورة الغلاف",
      eventExcerptPlaceholder: "وصف قصير",
      eventDescriptionPlaceholder: "الوصف الكامل، فقرة في كل سطر",
      eventTagsPlaceholder: "الوسوم مفصولة بفاصلة",
      productNamePlaceholder: "اسم المنتج",
      productCompanyPlaceholder: "الشركة",
      productImagePlaceholder: "رابط الصورة",
      productDescriptionPlaceholder: "وصف قصير",
      productLongDescriptionPlaceholder: "وصف تفصيلي، فقرة في كل سطر"
    },
    verify: {
      eyebrow: "التحقق من العضوية",
      loading: "جارٍ التحقق من العضوية...",
      valid: "العضوية صالحة",
      invalid: "العضوية غير صالحة",
      validBody:
        "تم التحقق من العضو: {name}. تمت الموافقة على جلسة الرمز وإبطالها مباشرة بعد المسح.",
      memberId: "رقم العضوية",
      memberName: "العضو",
      membershipExpiry: "انتهاء العضوية",
      verifiedAt: "تم التحقق في",
      associationShort: "SCSC-NNU",
      associationLine: "جمعية مستحضرات التجميل والعناية بالبشرة",
      university: "جامعة النجاح الوطنية",
      nameLabel: "الاسم",
      studentIdLabel: "الرقم الجامعي",
      degreeLabel: "الدرجة",
      expLabel: "EXP",
      verifiedStamp: "تم التحقق",
      reasonDuplicate:
        "تم استخدام هذا الرمز سابقًا مرة واحدة. تم اكتشاف محاولة تكرار ورفضها.",
      reasonExpired:
        "انتهت صلاحية جلسة الرمز قبل التحقق. يجب إنشاء رمز جديد.",
      reasonInactive: "هذه العضوية ليست نشطة حاليًا من أجل التحقق.",
      reasonStale: "هذا الرمز ليس الأحدث. تم استبداله بالفعل برمز أحدث.",
      reasonInvalid:
        "بطاقة العضوية هذه مفقودة أو غير صالحة أو منتهية أو لم تعد معتمدة."
    },
    notFound: {
      title: "الصفحة المطلوبة غير موجودة",
      description: "قد يكون المحتوى قد أزيل أو تغير اسمه أو لم يعد متاحًا.",
      backHome: "العودة للرئيسية"
    },
    footer: {
      explore: "استكشف",
      contact: "تواصل",
      instagram: "إنستغرام",
      membership: "العضوية",
      membershipText:
        "انضم للاستفادة من الورش والخصومات والوصول إلى المجتمع وفرص التطور المهني.",
      location: "الحرم الجديد، نابلس",
      officeHours: "الأحد - الخميس، 9:00 ص - 4:00 م"
    },
    categories: {
      article: {
        "Skin Care": "العناية بالبشرة",
        Makeup: "المكياج",
        "Hair Care": "العناية بالشعر",
        Others: "أخرى"
      },
      product: {
        "Skin Care": "العناية بالبشرة",
        "Body Care": "العناية بالجسم",
        Makeup: "المكياج",
        Masks: "الأقنعة"
      },
      tags: {
        Workshop: "ورشة",
        Research: "بحث",
        Networking: "تواصل",
        Makeup: "مكياج",
        Lab: "مختبر",
        Members: "الأعضاء",
        Orientation: "تعريفية"
      },
      roles: {
        admin: "مدير",
        moderator: "مشرف",
        company: "شركة",
        user: "مستخدم"
      },
      boardRoles: {
        President: "الرئيس",
        "Vice President": "نائب الرئيس",
        Treasurer: "أمين الصندوق"
      },
      orderStatus: {
        pending: "قيد الانتظار",
        confirmed: "مؤكد",
        processing: "قيد المعالجة",
        delivered: "تم التسليم"
      },
      membershipStatus: {
        active: "نشطة",
        expired: "منتهية",
        pendingRenewal: "بانتظار التجديد"
      }
    }
  }
} as const;

export type Dictionary = (typeof dictionaries)[AppLocale];

export function getDictionary(locale: AppLocale) {
  return dictionaries[locale];
}
