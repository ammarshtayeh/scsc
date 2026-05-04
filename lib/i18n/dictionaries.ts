import type { AppLocale } from "@/lib/i18n/config";

export const dictionaries = {
  en: {
    localeName: "English",
    languageToggle: {
      label: "Language",
      english: "EN",
      arabic: "AR",
      switchToEnglish: "Switch to English",
      switchToArabic: "Switch to Arabic"
    },
    site: {
      title: "Cosmetics & Skin Care",
      university: "An-Najah National University",
      description:
        "A modern association platform for education, membership, events, and curated products."
    },
    nav: {
      home: "Home",
      about: "About",
      education: "Education",
      events: "Events",
      contact: "Contact",
      store: "Store",
      login: "Login",
      signup: "Become a Member",
      logout: "Logout",
      profile: "Profile",
      dashboard: "Dashboard",
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
      refresh: "Refresh"
    },
    home: {
      badge: "Elegance meets evidence-based care",
      title: "Empowering cosmetic and skin care leaders at An-Najah.",
      description:
        "We connect members through education, scientific awareness, practical workshops, and a trusted community shaped by care, professionalism, and innovation.",
      visionLabel: "Vision",
      visionText:
        "To become the university's leading student association for cosmetic science, beauty education, and member growth.",
      missionLabel: "Mission",
      missionText:
        "Deliver workshops, content, and member services that translate modern knowledge into safe, elegant, real-world practice.",
      joinCta: "Become a Member",
      featuredEventCta: "Explore Featured Event",
      viewEventsCta: "View Events",
      featuredEventLabel: "Featured Event",
      latestNewsLabel: "Latest News",
      latestNewsTitle: "Educational updates, tips, and association insights",
      upcomingEventsLabel: "Upcoming Events",
      upcomingEventsTitle: "Workshops and experiences worth planning around",
      slides: [
        {
          title: "Clinical beauty education",
          caption:
            "Workshops and curated sessions designed around safe, modern cosmetic practice."
        },
        {
          title: "Elegant member experiences",
          caption:
            "Events, networking, and leadership opportunities shaped for ambitious students."
        },
        {
          title: "Trusted product discovery",
          caption:
            "Association-approved selections with member pricing and thoughtful presentation."
        }
      ],
      newsEmptyTitle: "No updates available",
      newsEmptyDescription: "Check back soon for new educational content."
    },
    membershipPromo: {
      eyebrow: "Membership",
      title: "Join a community shaped around beauty, science, and leadership.",
      description:
        "Membership opens the door to workshops, discounts, interdisciplinary events, leadership tracks, and a trusted network of students and professionals.",
      benefits: [
        {
          title: "Networking",
          description:
            "Build relationships with peers, faculty, and cosmetic industry collaborators."
        },
        {
          title: "Workshops",
          description:
            "Join practical labs, seminars, and training sessions throughout the year."
        },
        {
          title: "Member Discounts",
          description:
            "Receive store discounts and access to curated offers from partner brands."
        }
      ],
      whyTitle: "Why members stay involved",
      whyDescription:
        "Access to partner events, exclusive education, special product pricing, and verified membership benefits through dynamic QR identity.",
      whyExtra:
        "Members also gain structured opportunities to volunteer, lead committees, and contribute to educational content for the wider student body.",
      joinCta: "Become a Member",
      learnMore: "Learn More"
    },
    about: {
      eyebrow: "About the Association",
      title: "A student association built around beauty, science, and service.",
      description:
        "The Cosmetics & Skin Care Association brings together students who care about evidence-based practice, elegant presentation, community education, and meaningful professional growth.",
      overviewTitle: "Association overview",
      overviewTextOne:
        "Our association exists to connect cosmetic science, skin care literacy, and student leadership through workshops, peer collaboration, practical events, and responsible product awareness.",
      overviewTextTwo:
        "We create accessible educational experiences for members and the wider campus community, while giving students a structured path to volunteer, lead, and grow.",
      imageAlt: "Association members collaborating",
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
      title: "Learning, networking, and hands-on experiences.",
      description:
        "Explore upcoming association events with clear scheduling, concise previews, and detail pages built for smooth registration.",
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
      reserved: "Your seat is already reserved for this event.",
      duplicateNote:
        "Duplicate registrations are prevented through a Firestore transaction per member.",
      success: "Registration confirmed.",
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
        "Sign in with your association account. In mock mode, emails containing `admin` or `moderator` will open the matching role.",
      emailLabel: "Email",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      signupPasswordPlaceholder: "At least 6 characters",
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
      companyLabel: "Association / Company",
      companyPlaceholder: "Optional",
      passwordShort: "Password must be at least 6 characters.",
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
      estimatedTotal: "Estimated total",
      checkout: "Checkout (COD)",
      checkoutError: "Checkout failed.",
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
      editProfile: "Edit Profile",
      profilePhoto: "Profile Photo",
      profileUpdated: "Profile updated.",
      profileUpdateError: "Unable to update profile.",
      loadingProfile: "Loading profile...",
      orderHistory: "Order History",
      noOrders: "No orders recorded yet.",
      noRegisteredEvents: "No registered events yet.",
      noSavedArticles: "No saved articles yet."
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
      userManagement: "User Management",
      orders: "Orders",
      moderation: "Content Moderation",
      addEvent: "Add Event",
      addProduct: "Add Product",
      edit: "Edit",
      review: "Review",
      approved: "Approved",
      pending: "Pending",
      items: "items"
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
      english: "EN",
      arabic: "AR",
      switchToEnglish: "التبديل إلى الإنجليزية",
      switchToArabic: "التبديل إلى العربية"
    },
    site: {
      title: "جمعية مستحضرات التجميل والعناية بالبشرة",
      university: "جامعة النجاح الوطنية",
      description:
        "منصة عصرية للجمعية تجمع التعليم والعضوية والفعاليات والمتجر المختار بعناية."
    },
    nav: {
      home: "الرئيسية",
      about: "من نحن",
      education: "التثقيف",
      events: "الفعاليات",
      contact: "تواصل معنا",
      store: "المتجر",
      login: "تسجيل الدخول",
      signup: "انضم كعضو",
      logout: "تسجيل الخروج",
      profile: "الملف الشخصي",
      dashboard: "لوحة التحكم",
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
      refresh: "تحديث"
    },
    home: {
      badge: "أناقة مبنية على المعرفة العلمية",
      title: "نُمكّن قادة التجميل والعناية بالبشرة في جامعة النجاح.",
      description:
        "نربط الأعضاء بالتعليم، والوعي العلمي، والورش العملية، ومجتمع موثوق قائم على العناية والاحتراف والابتكار.",
      visionLabel: "الرؤية",
      visionText:
        "أن نصبح الجمعية الطلابية الرائدة في الجامعة في علوم التجميل والتعليم الجمالي ونمو الأعضاء.",
      missionLabel: "الرسالة",
      missionText:
        "تقديم ورش ومحتوى وخدمات عضوية تنقل المعرفة الحديثة إلى ممارسة آمنة وأنيقة وواقعية.",
      joinCta: "انضم كعضو",
      featuredEventCta: "استكشف الفعالية المميزة",
      viewEventsCta: "عرض الفعاليات",
      featuredEventLabel: "فعالية مميزة",
      latestNewsLabel: "آخر المستجدات",
      latestNewsTitle: "مستجدات تعليمية ونصائح ورؤى من الجمعية",
      upcomingEventsLabel: "الفعاليات القادمة",
      upcomingEventsTitle: "ورش وتجارب تستحق التخطيط لها",
      slides: [
        {
          title: "تعليم جمالي سريري",
          caption: "ورش وجلسات مختارة بعناية تدور حول الممارسة التجميلية الحديثة والآمنة."
        },
        {
          title: "تجربة عضوية أنيقة",
          caption: "فعاليات وشبكات علاقات وفرص قيادية مصممة للطلبة الطموحين."
        },
        {
          title: "اكتشاف موثوق للمنتجات",
          caption: "منتجات معتمدة من الجمعية بأسعار خاصة للأعضاء وعرض احترافي."
        }
      ],
      newsEmptyTitle: "لا توجد تحديثات حاليًا",
      newsEmptyDescription: "عودوا قريبًا للاطلاع على محتوى تعليمي جديد."
    },
    membershipPromo: {
      eyebrow: "العضوية",
      title: "انضم إلى مجتمع يجمع بين الجمال والعلم والقيادة.",
      description:
        "العضوية تفتح الباب أمام الورش والخصومات والفعاليات متعددة التخصصات والمسارات القيادية وشبكة موثوقة من الطلبة والمهنيين.",
      benefits: [
        {
          title: "بناء العلاقات",
          description: "كوّن علاقات مع الزملاء وأعضاء الهيئة التدريسية وشركاء قطاع التجميل."
        },
        {
          title: "ورش عملية",
          description: "انضم إلى مختبرات عملية وندوات وجلسات تدريبية طوال العام."
        },
        {
          title: "خصومات الأعضاء",
          description: "احصل على خصومات المتجر ووصول إلى عروض مختارة من العلامات الشريكة."
        }
      ],
      whyTitle: "لماذا يستمر الأعضاء بالمشاركة",
      whyDescription:
        "وصول إلى فعاليات الشركاء وتعليم حصري وأسعار خاصة على المنتجات ومزايا عضوية موثقة عبر QR ديناميكي.",
      whyExtra:
        "كما يحصل الأعضاء على فرص منظمة للتطوع وقيادة اللجان والمساهمة في المحتوى التعليمي للمجتمع الطلابي.",
      joinCta: "انضم كعضو",
      learnMore: "اعرف المزيد"
    },
    about: {
      eyebrow: "عن الجمعية",
      title: "جمعية طلابية مبنية على الجمال والعلم والخدمة.",
      description:
        "تجمع جمعية مستحضرات التجميل والعناية بالبشرة الطلبة المهتمين بالممارسة المبنية على الدليل، والعرض الأنيق، والتثقيف المجتمعي، والنمو المهني الحقيقي.",
      overviewTitle: "نبذة عن الجمعية",
      overviewTextOne:
        "توجد جمعيتنا لربط علوم التجميل وثقافة العناية بالبشرة والقيادة الطلابية من خلال الورش والتعاون بين الأقران والفعاليات العملية والوعي المسؤول بالمنتجات.",
      overviewTextTwo:
        "نقدّم تجارب تعليمية سهلة الوصول للأعضاء وللمجتمع الجامعي الأوسع، مع منح الطلبة مسارًا منظمًا للتطوع والقيادة والتطور.",
      imageAlt: "أعضاء الجمعية أثناء التعاون",
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
      title: "تعلّم وتواصل وتجارب عملية.",
      description:
        "استكشف فعاليات الجمعية القادمة مع مواعيد واضحة وبطاقات مختصرة وصفحات تفاصيل معدّة لتسجيل سلس.",
      emptyTitle: "لا توجد فعاليات مجدولة",
      emptyDescription: "تحقق لاحقًا للاطلاع على ورش وجلسات جديدة.",
      eventDetailEyebrow: "تفاصيل الفعالية",
      attendanceNotesTitle: "ملاحظات الحضور",
      attendanceNotesBody:
        "التسجيل متاح فقط للأعضاء المسجلين دخولًا، ويستخدم معاملة Firestore لمنع التكرار وتعطيل التسجيل عند اكتمال السعة.",
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
      reserved: "تم حجز مقعدك مسبقًا في هذه الفعالية.",
      duplicateNote: "يتم منع التسجيل المكرر عبر معاملة Firestore لكل عضو.",
      success: "تم تأكيد التسجيل.",
      genericError: "حدث خطأ أثناء التسجيل."
    },
    contact: {
      eyebrow: "تواصل معنا",
      title: "تواصل مع فريق الجمعية.",
      description:
        "استخدم نموذج التواصل للاستفسارات والتعاون وطلبات الورش أو الدعم العام. النموذج مصمم مع تحقق واضح وإرسال بريد عبر Firebase Cloud Functions.",
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
    auth: {
      loginEyebrow: "المصادقة",
      loginTitle: "ادخل إلى حسابك العضوي.",
      loginDescription:
        "سجّل الدخول عبر البريد الإلكتروني وكلمة المرور للوصول إلى ملفك الشخصي والمتجر المحمي والتسجيل في الفعاليات وأدوات الإدارة حسب صلاحيتك.",
      signupEyebrow: "العضوية",
      signupTitle: "انضم إلى الجمعية.",
      signupDescription:
        "أنشئ حساب العضوية للوصول إلى التسجيل في الفعاليات وأدوات الملف الشخصي والتحقق بالـ QR وسجل الطلبات وأسعار الأعضاء.",
      loginCardTitle: "تسجيل الدخول",
      loginCardText:
        "سجّل الدخول بحساب الجمعية. في وضع mock، أي بريد يحتوي على `admin` أو `moderator` سيفتح الصلاحية المطابقة.",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      passwordPlaceholder: "أدخل كلمة المرور",
      signupPasswordPlaceholder: "6 أحرف على الأقل",
      signIn: "دخول",
      continueWithGoogle: "المتابعة عبر Google",
      orEmail: "أو البريد",
      forgotPassword: "نسيت كلمة المرور؟",
      enterEmailFirst: "أدخل بريدك الإلكتروني أولًا لإرسال إعادة تعيين كلمة المرور.",
      resetNeedsFirebase: "إرسال بريد إعادة التعيين يتطلب إعداد Firebase.",
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
      passwordShort: "يجب أن تكون كلمة المرور 6 أحرف على الأقل.",
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
      estimatedTotal: "الإجمالي التقديري",
      checkout: "إتمام الطلب (COD)",
      checkoutError: "فشل إتمام الطلب.",
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
        "افتح رمز QR آمن وقصير العمر في صفحة مخصصة مع تحقق لمرة واحدة.",
      membershipCardInfoDescription:
        "تظهر هنا معلومات بطاقة العضوية. افتح رمز QR فقط عند الحاجة إلى تحقق مباشر.",
      membershipCardOnlyHint:
        "رمز QR الحي متاح فقط من خلال صفحة بطاقة العضوية لمزيد من الأمان.",
      viewMembershipCard: "عرض QR العضوية",
      backToDashboard: "العودة إلى اللوحة الشخصية",
      memberId: "رقم العضوية",
      role: "الصلاحية",
      membershipExpiry: "انتهاء العضوية",
      joined: "تاريخ الانضمام",
      company: "الشركة",
      phone: "رقم الهاتف",
      qrEyebrow: "QR العضوية",
      qrTitle: "بطاقة دخول ديناميكية آمنة",
      qrGenerating: "جارٍ إنشاء QR آمن...",
      qrMemberId: "رقم العضوية داخل QR",
      qrName: "الاسم داخل QR",
      qrExpiryDate: "تاريخ الانتهاء داخل QR",
      qrExpiresIn: "ينتهي QR خلال",
      secondsLabel: "ثانية",
      qrUnavailableTitle: "QR غير متاح",
      qrUnavailableDescription: "فقط العضويات النشطة يمكنها إنشاء QR مؤقت.",
      qrRefreshed: "تم تحديث QR العضوية.",
      qrIssueError: "تعذر إنشاء جلسة QR.",
      securityTitle: "ميزات الأمان",
      securityOne: "جلسات QR ديناميكية بعمر قصير يقارب 45 ثانية.",
      securityTwo: "تحقق لمرة واحدة مع كشف التكرار من جهة الخادم.",
      securityThree: "إلغاء تلقائي لأي QR سابق عند إصدار QR جديد.",
      securityFour: "الصور الملتقطة أو الرموز القديمة تتوقف تلقائيًا عن العمل.",
      securityFive:
        "التحقق من جهة الخادم يفحص الحالة والانتهاء والحداثة وسلامة الرمز قبل القبول.",
      qrHelp:
        "هذه البطاقة تنتهي بسرعة، وتتجدد تلقائيًا، وتصبح غير صالحة بعد أول مسح ناجح، وأي محاولة مكررة يتم رفضها من جهة الخادم.",
      editProfile: "تعديل الملف الشخصي",
      profilePhoto: "الصورة الشخصية",
      profileUpdated: "تم تحديث الملف الشخصي.",
      profileUpdateError: "تعذر تحديث الملف الشخصي.",
      loadingProfile: "جارٍ تحميل الملف الشخصي...",
      orderHistory: "سجل الطلبات",
      noOrders: "لا توجد طلبات بعد.",
      noRegisteredEvents: "لا توجد فعاليات مسجلة بعد.",
      noSavedArticles: "لا توجد مقالات محفوظة بعد."
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
      userManagement: "إدارة المستخدمين",
      orders: "الطلبات",
      moderation: "مراجعة المحتوى",
      addEvent: "إضافة فعالية",
      addProduct: "إضافة منتج",
      edit: "تعديل",
      review: "مراجعة",
      approved: "مقبول",
      pending: "قيد الانتظار",
      items: "عناصر"
    },
    verify: {
      eyebrow: "التحقق من العضوية",
      loading: "جارٍ التحقق من العضوية...",
      valid: "العضوية صالحة",
      invalid: "العضوية غير صالحة",
      validBody:
        "تم التحقق من العضو: {name}. تمت الموافقة على جلسة الـ QR وإبطالها مباشرة بعد المسح.",
      memberId: "رقم العضوية",
      memberName: "العضو",
      membershipExpiry: "انتهاء العضوية",
      verifiedAt: "تم التحقق في",
      reasonDuplicate:
        "تم استخدام هذا الـ QR سابقًا مرة واحدة. تم اكتشاف محاولة تكرار ورفضها.",
      reasonExpired:
        "انتهت صلاحية جلسة الـ QR قبل التحقق. يجب إنشاء QR جديد.",
      reasonInactive: "هذه العضوية ليست نشطة حاليًا من أجل التحقق.",
      reasonStale: "هذا الـ QR ليس الأحدث. تم استبداله بالفعل برمز أحدث.",
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
