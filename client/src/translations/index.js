// 翻译文件
const translations = {
  en: {
    // 导航栏
    nav: {
      home: 'Home',
      products: 'Products',
      services: 'Services',
      contact: 'Contact',
      login: 'Login',
      register: 'Register',
      profile: 'Profile',
      commission: 'Affiliate',
      logout: 'Logout'
    },
    
    // 首页
    home: {
      title: 'Syntax Dropshipping',
      subtitle: 'Your Global Commerce Partner',
      description: 'Achieve higher profitability with the lowest cost for every order without compromising quality.',
      getStarted: 'INSTALL APP BY SHOPIFY',
      learnMore: 'Learn More'
    },

    // 登录页面
    login: {
      title: 'Login',
      email: 'Email',
      password: 'Password',
      loginButton: 'Login',
      noAccount: "Don't have an account?",
      registerLink: 'Register here',
      emailPlaceholder: 'Enter your email',
      passwordPlaceholder: 'Enter your password'
    },

    // 注册页面
    register: {
      title: 'Register',
      username: 'Username',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      referralCode: 'Referral Code (Optional)',
      registerButton: 'Register',
      hasAccount: 'Already have an account?',
      loginLink: 'Login here',
      usernamePlaceholder: 'Enter your username',
      emailPlaceholder: 'Enter your email',
      passwordPlaceholder: 'Enter your password',
      confirmPasswordPlaceholder: 'Confirm your password',
      referralCodePlaceholder: 'Enter referral code'
    },

    // 佣金中心
    commission: {
      title: 'Affiliate',
      subtitle: 'Manage your referral commissions and withdrawals',
      availableBalance: 'Available Balance',
      frozenBalance: 'Frozen Balance',
      totalEarnings: 'Total Earnings',
      referrals: 'Referrals',
      
      // 标签页
      tabs: {
        overview: 'Overview',
        referralManagement: 'Referral Management',
        commissionRecords: 'Commission Records',
        withdrawalRecords: 'Withdrawal Records'
      },

      // 概览
      overview: {
        title: 'Account Overview',
        applyWithdrawal: 'Apply Withdrawal',
        recentCommissionRecords: 'Recent Commission Records',
        referralStatistics: 'Referral Statistics',
        totalReferrals: 'Total Referrals',
        activeUsers: 'Active Users',
        totalCommissions: 'Total Commissions',
        withdrawnAmount: 'Withdrawn Amount',
        noCommissionRecords: 'No commission records yet',
        orderPrefix: 'Order #'
      },

      // 推荐管理
      referral: {
        title: 'Referral Management',
        myReferralLink: 'My Referral Link',
        copyLink: 'Copy Link',
        referralCode: 'Referral Code',
        referredUsersList: 'Referred Users List',
        userInfo: 'User Info',
        registrationTime: 'Registration Time',
        orderCount: 'Order Count',
        totalOrders: 'Total Orders',
        noReferredUsers: 'No referred users yet',
        linkCopied: 'Referral link copied to clipboard!'
      },

      // 佣金记录
      records: {
        title: 'Commission Records',
        orderInfo: 'Order Info',
        orderAmount: 'Order Amount',
        commissionAmount: 'Commission Amount',
        status: 'Status',
        time: 'Time',
        noRecords: 'No commission records yet'
      },

      // 提现记录
      withdrawals: {
        title: 'Withdrawal Records',
        applyWithdrawal: 'Apply Withdrawal',
        withdrawalNumber: 'Withdrawal Number',
        amount: 'Amount',
        method: 'Method',
        status: 'Status',
        appliedTime: 'Applied Time',
        noRecords: 'No withdrawal records yet',
        
        // 提现方式
        methods: {
          bankTransfer: 'Bank Transfer',
          paypal: 'PayPal',
          alipay: 'Alipay',
          wechatPay: 'WeChat Pay'
        }
      },

      // 提现申请表单
      withdrawalForm: {
        title: 'Apply Withdrawal',
        withdrawalAmount: 'Withdrawal Amount',
        withdrawalMethod: 'Withdrawal Method',
        accountInformation: 'Account Information',
        availableBalance: 'Available balance',
        bankName: 'Bank Name',
        accountNumber: 'Account Number',
        accountName: 'Account Name',
        paypalEmail: 'PayPal Email',
        alipayAccount: 'Alipay Account',
        wechatId: 'WeChat ID',
        cancel: 'Cancel',
        submitApplication: 'Submit Application',
        enterAmount: 'Enter withdrawal amount',
        enterPrefix: 'Enter'
      },

      // 状态
      status: {
        pending: 'Pending',
        frozen: 'Frozen',
        available: 'Available',
        paid: 'Paid',
        cancelled: 'Cancelled',
        processing: 'Processing',
        completed: 'Completed',
        rejected: 'Rejected'
      }
    },

    // 产品页面
    products: {
      title: 'Products',
      loading: 'Loading products...',
      noProducts: 'No products available'
    },

    // 服务页面
    services: {
      title: 'Our Services'
    },

    // 联系页面
    contact: {
      title: 'Contact Us'
    },

    // 个人资料
    profile: {
      title: 'Profile'
    },

    // 通用
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      submit: 'Submit',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      refresh: 'Refresh',
      language: 'Language'
    },

    // WhatsApp
    whatsapp: {
      chatButton: 'WhatsApp',
      tooltip: 'Chat on WhatsApp',
      heroMessage: "Hi! I'm interested in your dropshipping services. Could you help me get started?",
      generalMessage: "Hello! I'm interested in your dropshipping services.",
      supportMessage: "Hi! I need help with your dropshipping platform."
    }
  },

  zh: {
    // 导航栏
    nav: {
      home: '首页',
      products: '产品',
      services: '服务',
      contact: '联系我们',
      login: '登录',
      register: '注册',
      profile: '个人资料',
      commission: 'Affiliate',
      logout: '退出登录'
    },
    
    // 首页
    home: {
      title: 'Syntax 代发货',
      subtitle: '我们的目标是优质服务真实',
      description: '以最低成本实现每个订单的更高盈利能力，同时不影响质量。',
      getStarted: '通过 SHOPIFY 安装应用',
      learnMore: '了解更多'
    },

    // 登录页面
    login: {
      title: '登录',
      email: '邮箱',
      password: '密码',
      loginButton: '登录',
      noAccount: '还没有账户？',
      registerLink: '点击注册',
      emailPlaceholder: '请输入邮箱',
      passwordPlaceholder: '请输入密码'
    },

    // 注册页面
    register: {
      title: '注册',
      username: '用户名',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      referralCode: '推荐码（可选）',
      registerButton: '注册',
      hasAccount: '已有账户？',
      loginLink: '点击登录',
      usernamePlaceholder: '请输入用户名',
      emailPlaceholder: '请输入邮箱',
      passwordPlaceholder: '请输入密码',
      confirmPasswordPlaceholder: '请确认密码',
      referralCodePlaceholder: '请输入推荐码'
    },

    // 佣金中心
    commission: {
      title: 'Affiliate',
      subtitle: '管理您的推荐佣金和提现',
      availableBalance: '可提现余额',
      frozenBalance: '冻结余额',
      totalEarnings: '总收益',
      referrals: '推荐用户',
      
      // 标签页
      tabs: {
        overview: '概览',
        referralManagement: '推荐管理',
        commissionRecords: '佣金记录',
        withdrawalRecords: '提现记录'
      },

      // 概览
      overview: {
        title: '账户概览',
        applyWithdrawal: '申请提现',
        recentCommissionRecords: '最近佣金记录',
        referralStatistics: '推荐统计',
        totalReferrals: '总推荐用户',
        activeUsers: '活跃用户',
        totalCommissions: '总佣金次数',
        withdrawnAmount: '已提现金额',
        noCommissionRecords: '暂无佣金记录',
        orderPrefix: '订单 #'
      },

      // 推荐管理
      referral: {
        title: '推荐管理',
        myReferralLink: '我的推荐链接',
        copyLink: '复制链接',
        referralCode: '推荐码',
        referredUsersList: '推荐用户列表',
        userInfo: '用户信息',
        registrationTime: '注册时间',
        orderCount: '订单数量',
        totalOrders: '订单总额',
        noReferredUsers: '暂无推荐用户',
        linkCopied: '推荐链接已复制到剪贴板！'
      },

      // 佣金记录
      records: {
        title: '佣金记录',
        orderInfo: '订单信息',
        orderAmount: '订单金额',
        commissionAmount: '佣金金额',
        status: '状态',
        time: '时间',
        noRecords: '暂无佣金记录'
      },

      // 提现记录
      withdrawals: {
        title: '提现记录',
        applyWithdrawal: '申请提现',
        withdrawalNumber: '提现单号',
        amount: '金额',
        method: '方式',
        status: '状态',
        appliedTime: '申请时间',
        noRecords: '暂无提现记录',
        
        // 提现方式
        methods: {
          bankTransfer: '银行转账',
          paypal: 'PayPal',
          alipay: '支付宝',
          wechatPay: '微信支付'
        }
      },

      // 提现申请表单
      withdrawalForm: {
        title: '申请提现',
        withdrawalAmount: '提现金额',
        withdrawalMethod: '提现方式',
        accountInformation: '账户信息',
        availableBalance: '可提现余额',
        bankName: '银行名称',
        accountNumber: '账户号码',
        accountName: '账户名称',
        paypalEmail: 'PayPal邮箱',
        alipayAccount: '支付宝账号',
        wechatId: '微信号',
        cancel: '取消',
        submitApplication: '提交申请',
        enterAmount: '请输入提现金额',
        enterPrefix: '请输入'
      },

      // 状态
      status: {
        pending: '待处理',
        frozen: '冻结中',
        available: '可提现',
        paid: '已结算',
        cancelled: '已取消',
        processing: '处理中',
        completed: '已完成',
        rejected: '已拒绝'
      }
    },

    // 产品页面
    products: {
      title: '产品',
      loading: '加载产品中...',
      noProducts: '暂无产品'
    },

    // 服务页面
    services: {
      title: '我们的服务'
    },

    // 联系页面
    contact: {
      title: '联系我们'
    },

    // 个人资料
    profile: {
      title: '个人资料'
    },

    // 通用
    common: {
      loading: '加载中...',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      submit: '提交',
      back: '返回',
      next: '下一步',
      previous: '上一步',
      search: '搜索',
      filter: '筛选',
      sort: '排序',
      refresh: '刷新',
      language: '语言'
    },

    // WhatsApp
    whatsapp: {
      chatButton: 'WhatsApp',
      tooltip: '在WhatsApp上聊天',
      heroMessage: '您好！我对您的代发货服务感兴趣。能帮我了解一下吗？',
      generalMessage: '您好！我对您的代发货服务感兴趣。',
      supportMessage: '您好！我需要关于代发货平台的帮助。'
    }
  },

  sv: {
    // 导航栏
    nav: {
      home: 'Hem',
      products: 'Produkter',
      services: 'Tjänster',
      contact: 'Kontakt',
      login: 'Logga in',
      register: 'Registrera',
      profile: 'Profil',
      commission: 'Affiliate',
      logout: 'Logga ut'
    },
    
    // 首页
    home: {
      title: 'Syntax Dropshipping',
      subtitle: 'Din globala handelspartner',
      description: 'Uppnå högre lönsamhet med lägsta kostnad för varje order utan att kompromissa med kvaliteten.',
      getStarted: 'INSTALLERA APP VIA SHOPIFY',
      learnMore: 'Läs mer'
    },

    // 登录页面
    login: {
      title: 'Logga in',
      email: 'E-post',
      password: 'Lösenord',
      loginButton: 'Logga in',
      noAccount: 'Har du inget konto?',
      registerLink: 'Registrera här',
      emailPlaceholder: 'Ange din e-post',
      passwordPlaceholder: 'Ange ditt lösenord'
    },

    // 注册页面
    register: {
      title: 'Registrera',
      username: 'Användarnamn',
      email: 'E-post',
      password: 'Lösenord',
      confirmPassword: 'Bekräfta lösenord',
      referralCode: 'Hänvisningskod (Valfritt)',
      registerButton: 'Registrera',
      hasAccount: 'Har du redan ett konto?',
      loginLink: 'Logga in här',
      usernamePlaceholder: 'Ange användarnamn',
      emailPlaceholder: 'Ange din e-post',
      passwordPlaceholder: 'Ange lösenord',
      confirmPasswordPlaceholder: 'Bekräfta lösenord',
      referralCodePlaceholder: 'Ange hänvisningskod'
    },

    // 佣金中心
    commission: {
      title: 'Affiliate',
      subtitle: 'Hantera dina hänvisningsprovisioner och uttag',
      availableBalance: 'Tillgängligt saldo',
      frozenBalance: 'Fryst saldo',
      totalEarnings: 'Totala intäkter',
      referrals: 'Hänvisningar',
      
      // 标签页
      tabs: {
        overview: 'Översikt',
        referralManagement: 'Hänvisningshantering',
        commissionRecords: 'Provisionsregister',
        withdrawalRecords: 'Uttagsregister'
      },

      // 概览
      overview: {
        title: 'Kontoöversikt',
        applyWithdrawal: 'Ansök om uttag',
        recentCommissionRecords: 'Senaste provisionsregister',
        referralStatistics: 'Hänvisningsstatistik',
        totalReferrals: 'Totala hänvisningar',
        activeUsers: 'Aktiva användare',
        totalCommissions: 'Totala provisioner',
        withdrawnAmount: 'Uttaget belopp',
        noCommissionRecords: 'Inga provisionsregister än',
        orderPrefix: 'Beställning #'
      },

      // 推荐管理
      referral: {
        title: 'Hänvisningshantering',
        myReferralLink: 'Min hänvisningslänk',
        copyLink: 'Kopiera länk',
        referralCode: 'Hänvisningskod',
        referredUsersList: 'Lista över hänvisade användare',
        userInfo: 'Användarinfo',
        registrationTime: 'Registreringstid',
        orderCount: 'Antal beställningar',
        totalOrders: 'Totala beställningar',
        noReferredUsers: 'Inga hänvisade användare än',
        linkCopied: 'Hänvisningslänk kopierad till urklipp!'
      },

      // 佣金记录
      records: {
        title: 'Provisionsregister',
        orderInfo: 'Beställningsinfo',
        orderAmount: 'Beställningsbelopp',
        commissionAmount: 'Provisionsbelopp',
        status: 'Status',
        time: 'Tid',
        noRecords: 'Inga provisionsregister än'
      },

      // 提现记录
      withdrawals: {
        title: 'Uttagsregister',
        applyWithdrawal: 'Ansök om uttag',
        withdrawalNumber: 'Uttagsnummer',
        amount: 'Belopp',
        method: 'Metod',
        status: 'Status',
        appliedTime: 'Ansökningstid',
        noRecords: 'Inga uttagsregister än',
        
        // 提现方式
        methods: {
          bankTransfer: 'Banköverföring',
          paypal: 'PayPal',
          alipay: 'Alipay',
          wechatPay: 'WeChat Pay'
        }
      },

      // 提现申请表单
      withdrawalForm: {
        title: 'Ansök om uttag',
        withdrawalAmount: 'Uttagsbelopp',
        withdrawalMethod: 'Uttagsmetod',
        accountInformation: 'Kontoinformation',
        availableBalance: 'Tillgängligt saldo',
        bankName: 'Banknamn',
        accountNumber: 'Kontonummer',
        accountName: 'Kontonamn',
        paypalEmail: 'PayPal-e-post',
        alipayAccount: 'Alipay-konto',
        wechatId: 'WeChat-ID',
        cancel: 'Avbryt',
        submitApplication: 'Skicka ansökan',
        enterAmount: 'Ange uttagsbelopp',
        enterPrefix: 'Ange'
      },

      // 状态
      status: {
        pending: 'Väntande',
        frozen: 'Fryst',
        available: 'Tillgänglig',
        paid: 'Betald',
        cancelled: 'Avbruten',
        processing: 'Bearbetas',
        completed: 'Slutförd',
        rejected: 'Avvisad'
      }
    },

    // 产品页面
    products: {
      title: 'Produkter',
      loading: 'Laddar produkter...',
      noProducts: 'Inga produkter tillgängliga'
    },

    // 服务页面
    services: {
      title: 'Våra tjänster'
    },

    // 联系页面
    contact: {
      title: 'Kontakta oss'
    },

    // 个人资料
    profile: {
      title: 'Profil'
    },

    // 通用
    common: {
      loading: 'Laddar...',
      save: 'Spara',
      cancel: 'Avbryt',
      confirm: 'Bekräfta',
      delete: 'Radera',
      edit: 'Redigera',
      submit: 'Skicka',
      back: 'Tillbaka',
      next: 'Nästa',
      previous: 'Föregående',
      search: 'Sök',
      filter: 'Filtrera',
      sort: 'Sortera',
      refresh: 'Uppdatera',
      language: 'Språk'
    },

    // WhatsApp
    whatsapp: {
      chatButton: 'WhatsApp',
      tooltip: 'Chatta på WhatsApp',
      heroMessage: 'Hej! Jag är intresserad av era dropshipping-tjänster. Kan ni hjälpa mig komma igång?',
      generalMessage: 'Hej! Jag är intresserad av era dropshipping-tjänster.',
      supportMessage: 'Hej! Jag behöver hjälp med er dropshipping-plattform.'
    }
  },

  da: {
    // 导航栏
    nav: {
      home: 'Hjem',
      products: 'Produkter',
      services: 'Tjenester',
      contact: 'Kontakt',
      login: 'Log ind',
      register: 'Registrer',
      profile: 'Profil',
      commission: 'Affiliate',
      logout: 'Log ud'
    },
    
    // 首页
    home: {
      title: 'Syntax Dropshipping',
      subtitle: 'Din globale handelspartner',
      description: 'Opnå højere rentabilitet med de laveste omkostninger for hver ordre uden at gå på kompromis med kvaliteten.',
      getStarted: 'INSTALLER APP VIA SHOPIFY',
      learnMore: 'Læs mere'
    },

    // 登录页面
    login: {
      title: 'Log ind',
      email: 'E-mail',
      password: 'Adgangskode',
      loginButton: 'Log ind',
      noAccount: 'Har du ikke en konto?',
      registerLink: 'Registrer her',
      emailPlaceholder: 'Indtast din e-mail',
      passwordPlaceholder: 'Indtast din adgangskode'
    },

    // 注册页面
    register: {
      title: 'Registrer',
      username: 'Brugernavn',
      email: 'E-mail',
      password: 'Adgangskode',
      confirmPassword: 'Bekræft adgangskode',
      referralCode: 'Henvisningskode (Valgfrit)',
      registerButton: 'Registrer',
      hasAccount: 'Har du allerede en konto?',
      loginLink: 'Log ind her',
      usernamePlaceholder: 'Indtast brugernavn',
      emailPlaceholder: 'Indtast din e-mail',
      passwordPlaceholder: 'Indtast adgangskode',
      confirmPasswordPlaceholder: 'Bekræft adgangskode',
      referralCodePlaceholder: 'Indtast henvisningskode'
    },

    // 佣金中心
    commission: {
      title: 'Affiliate',
      subtitle: 'Administrer dine henvisningsprovisioner og udbetalinger',
      availableBalance: 'Tilgængelig saldo',
      frozenBalance: 'Fastfrosset saldo',
      totalEarnings: 'Samlede indtægter',
      referrals: 'Henvisninger'
    },

    // 通用
    common: {
      loading: 'Indlæser...',
      save: 'Gem',
      cancel: 'Annuller',
      confirm: 'Bekræft',
      delete: 'Slet',
      edit: 'Rediger',
      submit: 'Send',
      back: 'Tilbage',
      next: 'Næste',
      previous: 'Forrige',
      search: 'Søg',
      filter: 'Filter',
      sort: 'Sorter',
      refresh: 'Opdater',
      language: 'Sprog'
    },

    // WhatsApp
    whatsapp: {
      chatButton: 'WhatsApp',
      tooltip: 'Chat på WhatsApp',
      heroMessage: 'Hej! Jeg er interesseret i jeres dropshipping-tjenester. Kan I hjælpe mig med at komme i gang?',
      generalMessage: 'Hej! Jeg er interesseret i jeres dropshipping-tjenester.',
      supportMessage: 'Hej! Jeg har brug for hjælp til jeres dropshipping-platform.'
    }
  },

  no: {
    // 导航栏
    nav: {
      home: 'Hjem',
      products: 'Produkter',
      services: 'Tjenester',
      contact: 'Kontakt',
      login: 'Logg inn',
      register: 'Registrer',
      profile: 'Profil',
      commission: 'Affiliate',
      logout: 'Logg ut'
    },
    
    // 首页
    home: {
      title: 'Syntax Dropshipping',
      subtitle: 'Din globale handelspartner',
      description: 'Oppnå høyere lønnsomhet med laveste kostnader for hver bestilling uten å kompromittere kvaliteten.',
      getStarted: 'INSTALLER APP VIA SHOPIFY',
      learnMore: 'Les mer'
    },

    // 登录页面
    login: {
      title: 'Logg inn',
      email: 'E-post',
      password: 'Passord',
      loginButton: 'Logg inn',
      noAccount: 'Har du ikke en konto?',
      registerLink: 'Registrer her',
      emailPlaceholder: 'Skriv inn din e-post',
      passwordPlaceholder: 'Skriv inn ditt passord'
    },

    // 注册页面
    register: {
      title: 'Registrer',
      username: 'Brukernavn',
      email: 'E-post',
      password: 'Passord',
      confirmPassword: 'Bekreft passord',
      referralCode: 'Henvisningskode (Valgfritt)',
      registerButton: 'Registrer',
      hasAccount: 'Har du allerede en konto?',
      loginLink: 'Logg inn her',
      usernamePlaceholder: 'Skriv inn brukernavn',
      emailPlaceholder: 'Skriv inn din e-post',
      passwordPlaceholder: 'Skriv inn passord',
      confirmPasswordPlaceholder: 'Bekreft passord',
      referralCodePlaceholder: 'Skriv inn henvisningskode'
    },

    // 佣金中心
    commission: {
      title: 'Affiliate',
      subtitle: 'Administrer dine henvisningsprovisioner og uttak',
      availableBalance: 'Tilgjengelig saldo',
      frozenBalance: 'Frossen saldo',
      totalEarnings: 'Totale inntekter',
      referrals: 'Henvisninger'
    },

    // 通用
    common: {
      loading: 'Laster...',
      save: 'Lagre',
      cancel: 'Avbryt',
      confirm: 'Bekreft',
      delete: 'Slett',
      edit: 'Rediger',
      submit: 'Send inn',
      back: 'Tilbake',
      next: 'Neste',
      previous: 'Forrige',
      search: 'Søk',
      filter: 'Filter',
      sort: 'Sorter',
      refresh: 'Oppdater',
      language: 'Språk'
    },

    // WhatsApp
    whatsapp: {
      chatButton: 'WhatsApp',
      tooltip: 'Chat på WhatsApp',
      heroMessage: 'Hei! Jeg er interessert i deres dropshipping-tjenester. Kan dere hjelpe meg å komme i gang?',
      generalMessage: 'Hei! Jeg er interessert i deres dropshipping-tjenester.',
      supportMessage: 'Hei! Jeg trenger hjelp med deres dropshipping-plattform.'
    }
  },

  fi: {
    // 导航栏
    nav: {
      home: 'Koti',
      products: 'Tuotteet',
      services: 'Palvelut',
      contact: 'Yhteystiedot',
      login: 'Kirjaudu sisään',
      register: 'Rekisteröidy',
      profile: 'Profiili',
      commission: 'Affiliate',
      logout: 'Kirjaudu ulos'
    },
    
    // 首页
    home: {
      title: 'Syntax Dropshipping',
      subtitle: 'Globaali kauppakumppanisi',
      description: 'Saavuta korkeampi kannattavuus alhaisimmilla kustannuksilla jokaiselle tilaukselle vaarantamatta laatua.',
      getStarted: 'ASENNA SOVELLUS SHOPIFYN KAUTTA',
      learnMore: 'Lue lisää'
    },

    // 登录页面
    login: {
      title: 'Kirjaudu sisään',
      email: 'Sähköposti',
      password: 'Salasana',
      loginButton: 'Kirjaudu sisään',
      noAccount: 'Eikö sinulla ole tiliä?',
      registerLink: 'Rekisteröidy tässä',
      emailPlaceholder: 'Syötä sähköpostiosoitteesi',
      passwordPlaceholder: 'Syötä salasanasi'
    },

    // 注册页面
    register: {
      title: 'Rekisteröidy',
      username: 'Käyttäjänimi',
      email: 'Sähköposti',
      password: 'Salasana',
      confirmPassword: 'Vahvista salasana',
      referralCode: 'Suosittelukoodi (Valinnainen)',
      registerButton: 'Rekisteröidy',
      hasAccount: 'Onko sinulla jo tili?',
      loginLink: 'Kirjaudu sisään tässä',
      usernamePlaceholder: 'Syötä käyttäjänimi',
      emailPlaceholder: 'Syötä sähköpostiosoitteesi',
      passwordPlaceholder: 'Syötä salasana',
      confirmPasswordPlaceholder: 'Vahvista salasana',
      referralCodePlaceholder: 'Syötä suosittelukoodi'
    },

    // 佣金中心
    commission: {
      title: 'Affiliate',
      subtitle: 'Hallitse suositteluprovisiosi ja nostoja',
      availableBalance: 'Käytettävissä oleva saldo',
      frozenBalance: 'Jäädytetty saldo',
      totalEarnings: 'Kokonaisansiot',
      referrals: 'Suosittelut'
    },

    // 通用
    common: {
      loading: 'Ladataan...',
      save: 'Tallenna',
      cancel: 'Peruuta',
      confirm: 'Vahvista',
      delete: 'Poista',
      edit: 'Muokkaa',
      submit: 'Lähetä',
      back: 'Takaisin',
      next: 'Seuraava',
      previous: 'Edellinen',
      search: 'Haku',
      filter: 'Suodata',
      sort: 'Lajittele',
      refresh: 'Päivitä',
      language: 'Kieli'
    },

    // WhatsApp
    whatsapp: {
      chatButton: 'WhatsApp',
      tooltip: 'Keskustele WhatsAppissa',
      heroMessage: 'Hei! Olen kiinnostunut dropshipping-palveluistanne. Voitteko auttaa minua aloittamaan?',
      generalMessage: 'Hei! Olen kiinnostunut dropshipping-palveluistanne.',
      supportMessage: 'Hei! Tarvitsen apua dropshipping-alustassanne.'
    }
  },

  is: {
    // 导航栏
    nav: {
      home: 'Heim',
      products: 'Vörur',
      services: 'Þjónusta',
      contact: 'Samband',
      login: 'Innskráning',
      register: 'Skráning',
      profile: 'Prófíll',
      commission: 'Affiliate',
      logout: 'Útskráning'
    },
    
    // 首页
    home: {
      title: 'Syntax Dropshipping',
      subtitle: 'Þinn alþjóðlegi viðskiptafélagi',
      description: 'Náðu meiri arðsemi með lægsta kostnaði fyrir hverja pöntun án þess að skerða gæði.',
      getStarted: 'SETJA UPP APP Í GEGNUM SHOPIFY',
      learnMore: 'Læra meira'
    },

    // 登录页面
    login: {
      title: 'Innskráning',
      email: 'Netfang',
      password: 'Lykilorð',
      loginButton: 'Skrá inn',
      noAccount: 'Áttu ekki reikning?',
      registerLink: 'Skráðu þig hér',
      emailPlaceholder: 'Sláðu inn netfangið þitt',
      passwordPlaceholder: 'Sláðu inn lykilorðið þitt'
    },

    // 注册页面
    register: {
      title: 'Skráning',
      username: 'Notandanafn',
      email: 'Netfang',
      password: 'Lykilorð',
      confirmPassword: 'Staðfesta lykilorð',
      referralCode: 'Tilvísunarkóði (Valfrjálst)',
      registerButton: 'Skrá sig',
      hasAccount: 'Áttu nú þegar reikning?',
      loginLink: 'Skráðu þig inn hér',
      usernamePlaceholder: 'Sláðu inn notandanafn',
      emailPlaceholder: 'Sláðu inn netfangið þitt',
      passwordPlaceholder: 'Sláðu inn lykilorð',
      confirmPasswordPlaceholder: 'Staðfesta lykilorð',
      referralCodePlaceholder: 'Sláðu inn tilvísunarkóða'
    },

    // 佣金中心
    commission: {
      title: 'Affiliate',
      subtitle: 'Stjórnaðu tilvísunarþóknunum þínum og úttektum',
      availableBalance: 'Tiltæk innistæða',
      frozenBalance: 'Fryst innistæða',
      totalEarnings: 'Heildartekjur',
      referrals: 'Tilvísanir'
    },

    // 通用
    common: {
      loading: 'Hleður...',
      save: 'Vista',
      cancel: 'Hætta við',
      confirm: 'Staðfesta',
      delete: 'Eyða',
      edit: 'Breyta',
      submit: 'Senda',
      back: 'Til baka',
      next: 'Næsta',
      previous: 'Fyrri',
      search: 'Leita',
      filter: 'Sía',
      sort: 'Raða',
      refresh: 'Endurhlaða',
      language: 'Tungumál'
    },

    // WhatsApp
    whatsapp: {
      chatButton: 'WhatsApp',
      tooltip: 'Spjalla á WhatsApp',
      heroMessage: 'Halló! Mig langar að vita meira um dropshipping þjónustuna ykkar. Getið þið hjálpað mér að byrja?',
      generalMessage: 'Halló! Mig langar að vita meira um dropshipping þjónustuna ykkar.',
      supportMessage: 'Halló! Ég þarf hjálp með dropshipping pallinn ykkar.'
    }
  },

  es: {
    // 导航栏
    nav: {
      home: 'Inicio',
      products: 'Productos',
      services: 'Servicios',
      contact: 'Contacto',
      login: 'Iniciar sesión',
      register: 'Registrarse',
      profile: 'Perfil',
      commission: 'Affiliate',
      logout: 'Cerrar sesión'
    },
    
    // 首页
    home: {
      title: 'Syntax Dropshipping',
      subtitle: 'Tu socio comercial global',
      description: 'Logra mayor rentabilidad con el menor costo para cada pedido sin comprometer la calidad.',
      getStarted: 'INSTALAR APP VÍA SHOPIFY',
      learnMore: 'Saber más'
    },

    // 登录页面
    login: {
      title: 'Iniciar sesión',
      email: 'Correo electrónico',
      password: 'Contraseña',
      loginButton: 'Iniciar sesión',
      noAccount: '¿No tienes una cuenta?',
      registerLink: 'Regístrate aquí',
      emailPlaceholder: 'Ingresa tu correo electrónico',
      passwordPlaceholder: 'Ingresa tu contraseña'
    },

    // 注册页面
    register: {
      title: 'Registrarse',
      username: 'Nombre de usuario',
      email: 'Correo electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      referralCode: 'Código de referencia (Opcional)',
      registerButton: 'Registrarse',
      hasAccount: '¿Ya tienes una cuenta?',
      loginLink: 'Inicia sesión aquí',
      usernamePlaceholder: 'Ingresa nombre de usuario',
      emailPlaceholder: 'Ingresa tu correo electrónico',
      passwordPlaceholder: 'Ingresa contraseña',
      confirmPasswordPlaceholder: 'Confirma contraseña',
      referralCodePlaceholder: 'Ingresa código de referencia'
    },

    // 佣金中心
    commission: {
      title: 'Affiliate',
      subtitle: 'Gestiona tus comisiones de referencia y retiros',
      availableBalance: 'Saldo disponible',
      frozenBalance: 'Saldo congelado',
      totalEarnings: 'Ganancias totales',
      referrals: 'Referencias'
    },

    // 通用
    common: {
      loading: 'Cargando...',
      save: 'Guardar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      delete: 'Eliminar',
      edit: 'Editar',
      submit: 'Enviar',
      back: 'Volver',
      next: 'Siguiente',
      previous: 'Anterior',
      search: 'Buscar',
      filter: 'Filtrar',
      sort: 'Ordenar',
      refresh: 'Actualizar',
      language: 'Idioma'
    },

    // WhatsApp
    whatsapp: {
      chatButton: 'WhatsApp',
      tooltip: 'Chatear en WhatsApp',
      heroMessage: '¡Hola! Estoy interesado en sus servicios de dropshipping. ¿Pueden ayudarme a empezar?',
      generalMessage: '¡Hola! Estoy interesado en sus servicios de dropshipping.',
      supportMessage: '¡Hola! Necesito ayuda con su plataforma de dropshipping.'
    }
  },

  fr: {
    // 导航栏
    nav: {
      home: 'Accueil',
      products: 'Produits',
      services: 'Services',
      contact: 'Contact',
      login: 'Se connecter',
      register: "S'inscrire",
      profile: 'Profil',
      commission: 'Affiliate',
      logout: 'Se déconnecter'
    },
    
    // 首页
    home: {
      title: 'Syntax Dropshipping',
      subtitle: 'Votre partenaire commercial mondial',
      description: 'Atteignez une rentabilité plus élevée avec le coût le plus bas pour chaque commande sans compromettre la qualité.',
      getStarted: 'INSTALLER APP VIA SHOPIFY',
      learnMore: 'En savoir plus'
    },

    // 登录页面
    login: {
      title: 'Se connecter',
      email: 'E-mail',
      password: 'Mot de passe',
      loginButton: 'Se connecter',
      noAccount: "Vous n'avez pas de compte ?",
      registerLink: 'Inscrivez-vous ici',
      emailPlaceholder: 'Entrez votre e-mail',
      passwordPlaceholder: 'Entrez votre mot de passe'
    },

    // 注册页面
    register: {
      title: "S'inscrire",
      username: "Nom d'utilisateur",
      email: 'E-mail',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      referralCode: 'Code de parrainage (Optionnel)',
      registerButton: "S'inscrire",
      hasAccount: 'Vous avez déjà un compte ?',
      loginLink: 'Connectez-vous ici',
      usernamePlaceholder: "Entrez le nom d'utilisateur",
      emailPlaceholder: 'Entrez votre e-mail',
      passwordPlaceholder: 'Entrez le mot de passe',
      confirmPasswordPlaceholder: 'Confirmez le mot de passe',
      referralCodePlaceholder: 'Entrez le code de parrainage'
    },

    // 佣金中心
    commission: {
      title: 'Affiliate',
      subtitle: 'Gérez vos commissions de parrainage et retraits',
      availableBalance: 'Solde disponible',
      frozenBalance: 'Solde gelé',
      totalEarnings: 'Gains totaux',
      referrals: 'Parrainages'
    },

    // 通用
    common: {
      loading: 'Chargement...',
      save: 'Enregistrer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      delete: 'Supprimer',
      edit: 'Modifier',
      submit: 'Soumettre',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      search: 'Rechercher',
      filter: 'Filtrer',
      sort: 'Trier',
      refresh: 'Actualiser',
      language: 'Langue'
    },

    // WhatsApp
    whatsapp: {
      chatButton: 'WhatsApp',
      tooltip: 'Discuter sur WhatsApp',
      heroMessage: 'Bonjour ! Je suis intéressé par vos services de dropshipping. Pouvez-vous m\'aider à commencer ?',
      generalMessage: 'Bonjour ! Je suis intéressé par vos services de dropshipping.',
      supportMessage: 'Bonjour ! J\'ai besoin d\'aide avec votre plateforme de dropshipping.'
    }
  },

  de: {
    // 导航栏
    nav: {
      home: 'Startseite',
      products: 'Produkte',
      services: 'Dienstleistungen',
      contact: 'Kontakt',
      login: 'Anmelden',
      register: 'Registrieren',
      profile: 'Profil',
      commission: 'Affiliate',
      logout: 'Abmelden'
    },
    
    // 首页
    home: {
      title: 'Syntax Dropshipping',
      subtitle: 'Ihr globaler Handelspartner',
      description: 'Erreichen Sie höhere Rentabilität mit den niedrigsten Kosten für jede Bestellung ohne Qualitätseinbußen.',
      getStarted: 'APP ÜBER SHOPIFY INSTALLIEREN',
      learnMore: 'Mehr erfahren'
    },

    // 登录页面
    login: {
      title: 'Anmelden',
      email: 'E-Mail',
      password: 'Passwort',
      loginButton: 'Anmelden',
      noAccount: 'Haben Sie kein Konto?',
      registerLink: 'Hier registrieren',
      emailPlaceholder: 'E-Mail eingeben',
      passwordPlaceholder: 'Passwort eingeben'
    },

    // 注册页面
    register: {
      title: 'Registrieren',
      username: 'Benutzername',
      email: 'E-Mail',
      password: 'Passwort',
      confirmPassword: 'Passwort bestätigen',
      referralCode: 'Empfehlungscode (Optional)',
      registerButton: 'Registrieren',
      hasAccount: 'Haben Sie bereits ein Konto?',
      loginLink: 'Hier anmelden',
      usernamePlaceholder: 'Benutzername eingeben',
      emailPlaceholder: 'E-Mail eingeben',
      passwordPlaceholder: 'Passwort eingeben',
      confirmPasswordPlaceholder: 'Passwort bestätigen',
      referralCodePlaceholder: 'Empfehlungscode eingeben'
    },

    // 佣金中心
    commission: {
      title: 'Affiliate',
      subtitle: 'Verwalten Sie Ihre Empfehlungsprovisionen und Auszahlungen',
      availableBalance: 'Verfügbares Guthaben',
      frozenBalance: 'Eingefrorenes Guthaben',
      totalEarnings: 'Gesamteinnahmen',
      referrals: 'Empfehlungen'
    },

    // 通用
    common: {
      loading: 'Lädt...',
      save: 'Speichern',
      cancel: 'Abbrechen',
      confirm: 'Bestätigen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      submit: 'Senden',
      back: 'Zurück',
      next: 'Weiter',
      previous: 'Vorherige',
      search: 'Suchen',
      filter: 'Filtern',
      sort: 'Sortieren',
      refresh: 'Aktualisieren',
      language: 'Sprache'
    },

    // WhatsApp
    whatsapp: {
      chatButton: 'WhatsApp',
      tooltip: 'Auf WhatsApp chatten',
      heroMessage: 'Hallo! Ich interessiere mich für Ihre Dropshipping-Dienste. Können Sie mir beim Einstieg helfen?',
      generalMessage: 'Hallo! Ich interessiere mich für Ihre Dropshipping-Dienste.',
      supportMessage: 'Hallo! Ich brauche Hilfe bei Ihrer Dropshipping-Plattform.'
    }
  },

  pt: {
    // 导航栏
    nav: {
      home: 'Início',
      products: 'Produtos',
      services: 'Serviços',
      contact: 'Contato',
      login: 'Entrar',
      register: 'Registrar',
      profile: 'Perfil',
      commission: 'Affiliate',
      logout: 'Sair'
    },
    
    // 首页
    home: {
      title: 'Syntax Dropshipping',
      subtitle: 'Seu parceiro comercial global',
      description: 'Alcance maior rentabilidade com o menor custo para cada pedido sem comprometer a qualidade.',
      getStarted: 'INSTALAR APP VIA SHOPIFY',
      learnMore: 'Saiba mais'
    },

    // 登录页面
    login: {
      title: 'Entrar',
      email: 'E-mail',
      password: 'Senha',
      loginButton: 'Entrar',
      noAccount: 'Não tem uma conta?',
      registerLink: 'Registre-se aqui',
      emailPlaceholder: 'Digite seu e-mail',
      passwordPlaceholder: 'Digite sua senha'
    },

    // 注册页面
    register: {
      title: 'Registrar',
      username: 'Nome de usuário',
      email: 'E-mail',
      password: 'Senha',
      confirmPassword: 'Confirmar senha',
      referralCode: 'Código de indicação (Opcional)',
      registerButton: 'Registrar',
      hasAccount: 'Já tem uma conta?',
      loginLink: 'Entre aqui',
      usernamePlaceholder: 'Digite nome de usuário',
      emailPlaceholder: 'Digite seu e-mail',
      passwordPlaceholder: 'Digite senha',
      confirmPasswordPlaceholder: 'Confirme senha',
      referralCodePlaceholder: 'Digite código de indicação'
    },

    // 佣金中心
    commission: {
      title: 'Affiliate',
      subtitle: 'Gerencie suas comissões de indicação e saques',
      availableBalance: 'Saldo disponível',
      frozenBalance: 'Saldo congelado',
      totalEarnings: 'Ganhos totais',
      referrals: 'Indicações'
    },

    // 通用
    common: {
      loading: 'Carregando...',
      save: 'Salvar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      delete: 'Excluir',
      edit: 'Editar',
      submit: 'Enviar',
      back: 'Voltar',
      next: 'Próximo',
      previous: 'Anterior',
      search: 'Pesquisar',
      filter: 'Filtrar',
      sort: 'Classificar',
      refresh: 'Atualizar',
      language: 'Idioma'
    },

    // WhatsApp
    whatsapp: {
      chatButton: 'WhatsApp',
      tooltip: 'Conversar no WhatsApp',
      heroMessage: 'Olá! Estou interessado em seus serviços de dropshipping. Podem me ajudar a começar?',
      generalMessage: 'Olá! Estou interessado em seus serviços de dropshipping.',
      supportMessage: 'Olá! Preciso de ajuda com sua plataforma de dropshipping.'
    }
  }
};

// 获取翻译文本的函数
export const getTranslation = (language, path) => {
  const keys = path.split('.');
  let result = translations[language];
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      // 如果找不到翻译，返回英文版本作为后备
      result = translations.en;
      for (const fallbackKey of keys) {
        if (result && typeof result === 'object' && fallbackKey in result) {
          result = result[fallbackKey];
        } else {
          return path; // 如果英文版本也没有，返回原始路径
        }
      }
      break;
    }
  }
  
  return typeof result === 'string' ? result : path;
};

export default translations;