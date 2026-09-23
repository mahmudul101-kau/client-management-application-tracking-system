export type Language = 'en' | 'bn';

export interface Translations {
  // Navigation & Brand
  dashboard: string;
  clients: string;
  categories: string;
  applicationStatuses: string;
  settings: string;
  googleSheets: string;
  connected: string;
  notConnected: string;
  connectGoogleSheets: string;
  sheetsSetupGuide: string;
  syncNow: string;
  syncing: string;

  // Actions
  addClient: string;
  addNewClient: string;
  editClient: string;
  deleteClient: string;
  viewDetails: string;
  view: string;
  edit: string;
  addCategory: string;
  editCategory: string;
  deleteCategory: string;
  addStatus: string;
  editStatus: string;
  deleteStatus: string;
  save: string;
  cancel: string;
  confirm: string;
  delete: string;
  close: string;
  search: string;
  filter: string;
  resetFilters: string;
  deactivateInstead: string;
  deleteAnyway: string;
  activate: string;
  deactivate: string;

  // Form Fields & Table Headers
  createdDate: string;
  clientName: string;
  clientId: string;
  phoneNumber: string;
  phone: string;
  category: string;
  categoryId: string;
  categoryName: string;
  totalAmount: string;
  paidAmount: string;
  dueAmount: string;
  due: string;
  totalDueAmount: string;
  applicationStatus: string;
  paymentStatus: string;
  actions: string;
  notes: string;
  statusId: string;
  statusName: string;
  state: string;

  // Status Values
  active: string;
  inactive: string;
  paid: string;
  partial: string;
  unpaid: string;
  completed: string;
  notCompleted: string;

  // Validation messages
  nameRequired: string;
  phoneRequired: string;
  categoryRequired: string;
  totalMustBePositive: string;
  paidMustBePositive: string;

  // Dashboard Stats
  totalClients: string;
  totalExpectedAmount: string;
  totalIncome: string;
  totalDue: string;
  totalApplications: string;
  applicationsByStatus: string;
  paymentSummary: string;
  paymentBreakdown: string;
  recentClients: string;
  viewAll: string;
  financialOverview: string;
  quickActions: string;

  // Settings & Branding
  brandingSettings: string;
  brandingSavedSuccess: string;
  appTitle: string;
  appSlogan: string;
  appLogo: string;
  uploadLogo: string;
  removeLogo: string;
  logoHint: string;
  currencySetting: string;
  currencyHint: string;
  customCurrency: string;
  selectCurrency: string;
  resetDefaults: string;
  settingsSaved: string;

  // Modals & Confirmation
  deleteConfirmTitle: string;
  deleteClientConfirm: string;
  deleteClientConfirmMsg: string;
  deleteClientWarning: string;
  deleteCategoryConfirm: string;
  deleteCategoryWarning: string;
  categoryInUse: string;
  categoryInUseWarning: string;
  deleteStatusConfirm: string;
  deleteStatusWarning: string;
  statusInUse: string;
  statusInUseWarning: string;
  linkedClientsDetected: string;
  deleteSafeConfirm: string;
  irreversibleWarning: string;

  // Placeholders & Search
  clientManagement: string;
  manageClientsDesc: string;
  searchPlaceholder: string;
  allCategories: string;
  allAppStatuses: string;
  allPaymentStatuses: string;
  allPayments: string;
  noMatchingClients: string;
  noClientsYet: string;
  clearFilters: string;
  showingResults: string;
  of: string;

  // Status management UI
  manageAppStatuses: string;
  manageAppStatusesDesc: string;
  statusNameRequired: string;
  statusSaved: string;
  statusDeleted: string;

  // Security & Dashboard Lock
  welcomeBack: string;
  enterPasswordToContinue: string;
  lockDashboard: string;
  dashboardLocked: string;
  enterPasswordToUnlock: string;
  password: string;
  unlock: string;
  unlocking: string;
  incorrectPassword: string;
  setupInitialPassword: string;
  setupPasswordDesc: string;
  newPassword: string;
  confirmPassword: string;
  currentPassword: string;
  passwordsDoNotMatch: string;
  passwordTooShort: string;
  passwordSetSuccess: string;
  passwordChangeSuccess: string;
  securitySettings: string;
  changePassword: string;
  autoLockNotice: string;
  passwordProtected: string;
  noPasswordConfigured: string;
  setPassword: string;
  updatePassword: string;
  // Setup Wizard
  welcomeToApp: string;
  setupRequiredTitle: string;
  setupRequiredDesc: string;
  startSetup: string;
  stepGoogleSheets: string;
  stepAppsScript: string;
  stepInitDatabase: string;
  stepPasswordSetup: string;
  connectGoogleSheetsTitle: string;
  connectGoogleSheetsDesc: string;
  testConnection: string;
  testingConnection: string;
  connectionSuccessful: string;
  connectionFailed: string;
  continueToInit: string;
  initDatabaseTitle: string;
  initDatabaseDesc: string;
  initializeDatabaseButton: string;
  initializingDatabase: string;
  verifyingStructure: string;
  initSuccessTitle: string;
  initSuccessDesc: string;
  retryInit: string;
  continueToPassword: string;
  createDashboardPasswordTitle: string;
  createDashboardPasswordDesc: string;
  finishSetupAndEnter: string;
  creatingPassword: string;
  setupCompletedNotice: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    dashboard: 'Dashboard',
    clients: 'Clients',
    categories: 'Categories',
    applicationStatuses: 'Application Statuses',
    settings: 'Settings',
    googleSheets: 'Google Sheets',
    connected: 'Connected',
    notConnected: 'Not Connected',
    connectGoogleSheets: 'Connect Google Sheet',
    sheetsSetupGuide: 'Sheets Setup Guide',
    syncNow: 'Sync Now',
    syncing: 'Syncing...',

    addClient: 'Add Client',
    addNewClient: 'Add New Client',
    editClient: 'Edit Client',
    deleteClient: 'Delete Client',
    viewDetails: 'View Details',
    view: 'View',
    edit: 'Edit',
    addCategory: 'Add Category',
    editCategory: 'Edit Category',
    deleteCategory: 'Delete Category',
    addStatus: 'Add Status',
    editStatus: 'Edit Status',
    deleteStatus: 'Delete Status',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    resetFilters: 'Reset all filters',
    deactivateInstead: 'Deactivate Instead',
    deleteAnyway: 'Delete Anyway',
    activate: 'Activate',
    deactivate: 'Deactivate',

    createdDate: 'Created Date',
    clientName: 'Client Name',
    clientId: 'Client ID',
    phoneNumber: 'Phone Number',
    phone: 'Phone',
    category: 'Category',
    categoryId: 'Category ID',
    categoryName: 'Category Name',
    totalAmount: 'Total Amount',
    paidAmount: 'Paid',
    dueAmount: 'Due',
    due: 'Due',
    totalDueAmount: 'Total Due Amount',
    applicationStatus: 'Application Status',
    paymentStatus: 'Payment Status',
    actions: 'Actions',
    notes: 'Notes',
    statusId: 'Status ID',
    statusName: 'Status Name',
    state: 'State',

    active: 'ACTIVE',
    inactive: 'INACTIVE',
    paid: 'PAID',
    partial: 'PARTIAL',
    unpaid: 'UNPAID',
    completed: 'Completed',
    notCompleted: 'Not Completed',

    nameRequired: 'Client Name is required.',
    phoneRequired: 'Phone Number is required.',
    categoryRequired: 'Category is required.',
    totalMustBePositive: 'Total Amount must be a positive number.',
    paidMustBePositive: 'Paid Amount cannot be negative.',

    totalClients: 'Total Clients',
    totalExpectedAmount: 'Total Expected Amount',
    totalIncome: 'Total Income',
    totalDue: 'Total Due',
    totalApplications: 'Total Applications',
    applicationsByStatus: 'Applications by Status',
    paymentSummary: 'Payment Summary',
    paymentBreakdown: 'Payment Status Breakdown',
    recentClients: 'Recent Clients',
    viewAll: 'View All',
    financialOverview: 'Financial Overview',
    quickActions: 'Quick Actions',

    brandingSettings: 'Settings & Branding',
    brandingSavedSuccess: 'Settings saved successfully!',
    appTitle: 'Application Title',
    appSlogan: 'Subtitle / Slogan',
    appLogo: 'Company / Business Logo',
    uploadLogo: 'Upload Logo',
    removeLogo: 'Remove Logo',
    logoHint: 'Recommended: PNG, JPG, or SVG with transparent background (Max 2MB).',
    currencySetting: 'Global Currency',
    currencyHint: 'Select the currency symbol used across the entire application for all monetary displays.',
    customCurrency: 'Custom Currency Symbol / Code',
    selectCurrency: 'Select Currency',
    resetDefaults: 'Reset to Defaults',
    settingsSaved: 'Settings saved successfully!',

    deleteConfirmTitle: 'Confirm Deletion',
    deleteClientConfirm: 'Delete Client Confirmation',
    deleteClientConfirmMsg: 'Are you sure you want to delete this client? This action cannot be undone.',
    deleteClientWarning: 'Are you sure you want to delete this client? This action cannot be undone.',
    deleteCategoryConfirm: 'Delete Category Confirmation',
    deleteCategoryWarning: 'This category is currently linked to existing clients. We strongly recommend deactivating it instead to preserve client history.',
    categoryInUse: 'Category Currently in Use',
    categoryInUseWarning: 'This category is currently assigned to existing clients. Deleting it will leave those records without an active category definition.',
    deleteStatusConfirm: 'Delete Application Status Confirmation',
    deleteStatusWarning: 'This status is currently used by existing clients. We recommend deactivating it instead to preserve client history.',
    statusInUse: 'Status Currently in Use',
    statusInUseWarning: 'This status is currently assigned to existing clients. We strongly recommend deactivating it instead to preserve client history.',
    linkedClientsDetected: 'Clients Currently Linked',
    deleteSafeConfirm: 'Are you sure you want to permanently delete this item?',
    irreversibleWarning: 'This record will be permanently removed from Google Sheets.',

    clientManagement: 'Client Management',
    manageClientsDesc: 'Manage applicants, payment balances, and status tracking.',
    searchPlaceholder: 'Search by client name, ID, phone, category...',
    allCategories: 'All Categories',
    allAppStatuses: 'All App Statuses',
    allPaymentStatuses: 'All Payment Statuses',
    allPayments: 'All Payments',
    noMatchingClients: 'No clients match your criteria',
    noClientsYet: 'No clients added yet',
    clearFilters: 'Clear all filters',
    showingResults: 'Showing',
    of: 'of',

    manageAppStatuses: 'Application Status Management',
    manageAppStatusesDesc: 'Configure dynamic application processing stages used for client tracking.',
    statusNameRequired: 'Status name is required.',
    statusSaved: 'Application status saved successfully.',
    statusDeleted: 'Application status deleted successfully.',

    welcomeBack: 'Welcome Back',
    enterPasswordToContinue: 'Enter your password to continue',
    lockDashboard: 'Lock Dashboard',
    dashboardLocked: 'Dashboard Locked',
    enterPasswordToUnlock: 'Enter password to access dashboard',
    password: 'Password',
    unlock: 'Unlock',
    unlocking: 'Verifying...',
    incorrectPassword: 'Incorrect password. Please try again.',
    setupInitialPassword: 'Set Initial Password',
    setupPasswordDesc: 'No security password is configured yet. Set a password to protect your client management system.',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    currentPassword: 'Current Password',
    passwordsDoNotMatch: 'Passwords do not match.',
    passwordTooShort: 'Password must be at least 4 characters.',
    passwordSetSuccess: 'Password configured successfully!',
    passwordChangeSuccess: 'Password changed successfully!',
    securitySettings: 'Security & Dashboard Lock',
    changePassword: 'Change Password',
    autoLockNotice: 'Application locked due to 10 minutes of inactivity.',
    passwordProtected: 'Password Protected',
    noPasswordConfigured: 'No Password Configured',
    setPassword: 'Set Password',
    updatePassword: 'Update Password',
    welcomeToApp: 'Welcome to',
    setupRequiredTitle: 'Initial Setup Required',
    setupRequiredDesc: 'Before using the system, connect your Google Sheets database and set up your secure Dashboard password.',
    startSetup: 'Start Setup',
    stepGoogleSheets: 'Connect Google Sheet',
    stepAppsScript: 'Apps Script Integration',
    stepInitDatabase: 'Initialize Database',
    stepPasswordSetup: 'Create Password',
    connectGoogleSheetsTitle: 'Connect Google Sheets & Apps Script',
    connectGoogleSheetsDesc: 'Connect your Google Sheets spreadsheet database via Google Apps Script Web App for persistent cloud storage.',
    testConnection: 'Test Connection',
    testingConnection: 'Testing connection...',
    connectionSuccessful: 'Connection successful! Google Sheet database is ready.',
    connectionFailed: 'Connection failed. Please check the Web App URL and permissions.',
    continueToInit: 'Continue to Database Setup',
    initDatabaseTitle: 'Initialize Application Database',
    initDatabaseDesc: 'The application will automatically create all required sheets, columns, default settings, and database structure. You do not need to create anything manually.',
    initializeDatabaseButton: 'Initialize Database',
    initializingDatabase: 'Creating database & sheets...',
    verifyingStructure: 'Verifying structure...',
    initSuccessTitle: 'Database Ready!',
    initSuccessDesc: 'All sheets (Clients, Categories, ApplicationStatuses, Settings) and headers have been verified.',
    retryInit: 'Retry Initialization',
    continueToPassword: 'Continue to Password Setup',
    createDashboardPasswordTitle: 'Create Dashboard Password',
    createDashboardPasswordDesc: 'Set a secure password to protect your client management system. Passwords are saved as cryptographic salted SHA-256 hashes.',
    finishSetupAndEnter: 'Finish Setup & Enter Dashboard',
    creatingPassword: 'Securing password...',
    setupCompletedNotice: 'Setup completed! Welcome to your Dashboard.',
  },
  bn: {
    dashboard: 'ড্যাশবোর্ড',
    clients: 'ক্লায়েন্টস',
    categories: 'ক্যাটাগরি',
    applicationStatuses: 'আবেদন স্ট্যাটাস',
    settings: 'সেটিংস',
    googleSheets: 'গুগল শিট',
    connected: 'সংযুক্ত',
    notConnected: 'সংযুক্ত নয়',
    connectGoogleSheets: 'গুগল শিট সংযুক্ত করুন',
    sheetsSetupGuide: 'শিট সেটআপ নির্দেশিকা',
    syncNow: 'সিঙ্ক করুন',
    syncing: 'সিঙ্ক হচ্ছে...',

    addClient: 'ক্লায়েন্ট যোগ করুন',
    addNewClient: 'নতুন ক্লায়েন্ট যোগ করুন',
    editClient: 'ক্লায়েন্ট সম্পাদনা',
    deleteClient: 'ক্লায়েন্ট মুছুন',
    viewDetails: 'বিস্তারিত দেখুন',
    view: 'দেখুন',
    edit: 'সম্পাদনা',
    addCategory: 'ক্যাটাগরি যোগ করুন',
    editCategory: 'ক্যাটাগরি সম্পাদনা',
    deleteCategory: 'ক্যাটাগরি মুছুন',
    addStatus: 'স্ট্যাটাস যোগ করুন',
    editStatus: 'স্ট্যাটাস সম্পাদনা',
    deleteStatus: 'স্ট্যাটাস মুছুন',
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    confirm: 'নিশ্চিত করুন',
    delete: 'মুছুন',
    close: 'বন্ধ করুন',
    search: 'অনুসন্ধান',
    filter: 'ফিল্টার',
    resetFilters: 'সব ফিল্টার রিসেট',
    deactivateInstead: 'নিষ্ক্রিয় করুন (পরামর্শিত)',
    deleteAnyway: 'স্থায়ীভাবে মুছুন',
    activate: 'সক্রিয় করুন',
    deactivate: 'নিষ্ক্রিয় করুন',

    createdDate: 'তৈরির তারিখ',
    clientName: 'ক্লায়েন্টের নাম',
    clientId: 'ক্লায়েন্ট আইডি',
    phoneNumber: 'ফোন নম্বর',
    phone: 'ফোন',
    category: 'ক্যাটাগরি',
    categoryId: 'ক্যাটাগরি আইডি',
    categoryName: 'ক্যাটাগরির নাম',
    totalAmount: 'মোট টাকা',
    paidAmount: 'পরিশোধ',
    dueAmount: 'বকেয়া',
    due: 'বকেয়া',
    totalDueAmount: 'মোট বকেয়া টাকা',
    applicationStatus: 'আবেদন স্ট্যাটাস',
    paymentStatus: 'পেমেন্ট স্ট্যাটাস',
    actions: 'অ্যাকশন',
    notes: 'মন্তব্য / নোট',
    statusId: 'স্ট্যাটাস আইডি',
    statusName: 'স্ট্যাটাসের নাম',
    state: 'অবস্থা',

    active: 'সক্রিয়',
    inactive: 'নিষ্ক্রিয়',
    paid: 'পরিশোধিত',
    partial: 'আংশিক',
    unpaid: 'অপরিশোধিত',
    completed: 'সম্পন্ন',
    notCompleted: 'অসম্পূর্ণ',

    nameRequired: 'ক্লায়েন্টের নাম আবশ্যক।',
    phoneRequired: 'ফোন নম্বর আবশ্যক।',
    categoryRequired: 'ক্যাটাগরি নির্বাচন করা আবশ্যক।',
    totalMustBePositive: 'মোট টাকা ধনাত্মক সংখ্যা হতে হবে।',
    paidMustBePositive: 'পরিশোধের পরিমাণ ঋণাত্মক হতে পারবে না।',

    totalClients: 'মোট ক্লায়েন্ট',
    totalExpectedAmount: 'মোট প্রত্যাশিত আয়',
    totalIncome: 'মোট আদায়কৃত আয়',
    totalDue: 'মোট বকেয়া',
    totalApplications: 'মোট আবেদন',
    applicationsByStatus: 'স্ট্যাটাস অনুযায়ী আবেদন',
    paymentSummary: 'পেমেন্ট সারসংক্ষেপ',
    paymentBreakdown: 'পেমেন্ট অবস্থা অনুযায়ী বিভাজন',
    recentClients: 'সাম্প্রতিক ক্লায়েন্ট',
    viewAll: 'সবগুলো দেখুন',
    financialOverview: 'আর্থিক বিবরণ',
    quickActions: 'দ্রুত অ্যাকশন',

    brandingSettings: 'সেটিংস ও ব্র্যান্ডিং',
    brandingSavedSuccess: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!',
    appTitle: 'অ্যাপ্লিকেশনের নাম',
    appSlogan: 'স্লোগান / সাবটাইটেল',
    appLogo: 'কোম্পানি / ব্যবসার লোগো',
    uploadLogo: 'লোগো আপলোড করুন',
    removeLogo: 'লোগো সরান',
    logoHint: 'সুপারিশ: পিএনজি, জেপিজি বা এসভিজি ফরম্যাট (সর্বোচ্চ ২ মেগাবাইট)।',
    currencySetting: 'গ্লোবাল কারেন্সি / মুদ্রা',
    currencyHint: 'পুরো অ্যাপ্লিকেশনের সকল আর্থিক পরিমাণের জন্য ব্যবহৃত মুদ্রা ও প্রতীক নির্বাচন করুন।',
    customCurrency: 'কাস্টম মুদ্রা প্রতীক / কোড',
    selectCurrency: 'মুদ্রা নির্বাচন করুন',
    resetDefaults: 'ডিফল্টে ফেরত যান',
    settingsSaved: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!',

    deleteConfirmTitle: 'মুছে ফেলার নিশ্চিতকরণ',
    deleteClientConfirm: 'ক্লায়েন্ট মুছে ফেলার নিশ্চিতকরণ',
    deleteClientConfirmMsg: 'আপনি কি নিশ্চিতভাবে এই ক্লায়েন্টের তথ্য মুছে ফেলতে চান? এই কাজটি পুনরায় ফিরিয়ে আনা যাবে না।',
    deleteClientWarning: 'আপনি কি নিশ্চিতভাবে এই ক্লায়েন্টের তথ্য মুছে ফেলতে চান? এই কাজটি পুনরায় ফিরিয়ে আনা যাবে না।',
    deleteCategoryConfirm: 'ক্যাটাগরি মুছে ফেলার নিশ্চিতকরণ',
    deleteCategoryWarning: 'এই ক্যাটাগরিটি বর্তমানে সংরক্ষিত ক্লায়েন্টদের সাথে যুক্ত আছে। ক্লায়েন্টের তথ্য সুরক্ষার জন্য এটিকে স্থায়ীভাবে না মুছে নিষ্ক্রিয় করার পরামর্শ দেওয়া হচ্ছে।',
    categoryInUse: 'ক্যাটাগরিটি বর্তমানে ব্যবহৃত হচ্ছে',
    categoryInUseWarning: 'এই ক্যাটাগরিটি বিদ্যমান ক্লায়েন্টদের জন্য বরাদ্দ আছে। স্থায়ীভাবে মুছে ফেললে পূর্বের রেকর্ডে ক্যাটাগরি অনুপস্থিত থাকবে।',
    deleteStatusConfirm: 'আবেদন স্ট্যাটাস মুছে ফেলার নিশ্চিতকরণ',
    deleteStatusWarning: 'এই স্ট্যাটাসটি বর্তমানে বিদ্যমান ক্লায়েন্টদের জন্য ব্যবহৃত হচ্ছে। ক্লায়েন্ট হিস্ট্রি ঠিক রাখতে এটি মুছে না ফেলে নিষ্ক্রিয় করার পরামর্শ দেওয়া হচ্ছে।',
    statusInUse: 'স্ট্যাটাসটি বর্তমানে ব্যবহৃত হচ্ছে',
    statusInUseWarning: 'এই স্ট্যাটাসটি বর্তমানে বিদ্যমান ক্লায়েন্টদের সাথে যুক্ত আছে। তথ্য সংরক্ষণে এটিকে মুছে না ফেলে নিষ্ক্রিয় করার পরামর্শ দেওয়া হচ্ছে।',
    linkedClientsDetected: 'যুক্ত থাকা ক্লায়েন্ট সংখ্যা',
    deleteSafeConfirm: 'আপনি কি নিশ্চিতভাবে এই রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?',
    irreversibleWarning: 'এটি গুগল শিট ডেটাবেস থেকে স্থায়ীভাবে মুছে যাবে।',

    clientManagement: 'ক্লায়েন্ট ব্যবস্থাপনা',
    manageClientsDesc: 'ক্লায়েন্টের আবেদন, পেমেন্ট ব্যালেন্স এবং প্রক্রিয়াকরণ ট্র্যাক করুন।',
    searchPlaceholder: 'ক্লায়েন্টের নাম, আইডি, ফোন, ক্যাটাগরি দিয়ে খুঁজুন...',
    allCategories: 'সকল ক্যাটাগরি',
    allAppStatuses: 'সকল আবেদন স্ট্যাটাস',
    allPaymentStatuses: 'সকল পেমেন্ট স্ট্যাটাস',
    allPayments: 'সকল পেমেন্ট',
    noMatchingClients: 'কোনো ক্লায়েন্ট পাওয়া যায়নি',
    noClientsYet: 'এখনো কোনো ক্লায়েন্ট যোগ করা হয়নি',
    clearFilters: 'ফিল্টার পরিষ্কার করুন',
    showingResults: 'প্রদর্শিত হচ্ছে',
    of: 'এর মধ্যে',

    manageAppStatuses: 'আবেদন স্ট্যাটাস ব্যবস্থাপনা',
    manageAppStatusesDesc: 'ক্লায়েন্ট ট্র্যাকিংয়ের জন্য প্রয়োজনীয় প্রক্রিয়াকরণ পর্যায় বা স্ট্যাটাস কনফিগার করুন।',
    statusNameRequired: 'স্ট্যাটাসের নাম আবশ্যক।',
    statusSaved: 'আবেদন স্ট্যাটাস সফলভাবে সংরক্ষিত হয়েছে।',
    statusDeleted: 'আবেদন স্ট্যাটাস সফলভাবে মুছে ফেলা হয়েছে।',

    welcomeBack: 'স্বাগতম',
    enterPasswordToContinue: 'চালিয়ে যেতে আপনার পাসওয়ার্ড দিন',
    lockDashboard: 'ড্যাশবোর্ড লক করুন',
    dashboardLocked: 'ড্যাশবোর্ড লক করা হয়েছে',
    enterPasswordToUnlock: 'ড্যাশবোর্ড অ্যাক্সেস করতে পাসওয়ার্ড লিখুন',
    password: 'পাসওয়ার্ড',
    unlock: 'আনলক করুন',
    unlocking: 'যাচাই করা হচ্ছে...',
    incorrectPassword: 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।',
    setupInitialPassword: 'প্রাথমিক পাসওয়ার্ড সেট করুন',
    setupPasswordDesc: 'এখনও কোনো নিরাপত্তা পাসওয়ার্ড কনফিগার করা হয়নি। ক্লায়েন্ট ডেটা সুরক্ষিত রাখতে একটি পাসওয়ার্ড সেট করুন।',
    newPassword: 'নতুন পাসওয়ার্ড',
    confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
    currentPassword: 'বর্তমান পাসওয়ার্ড',
    passwordsDoNotMatch: 'পাসওয়ার্ড দুটি মেলেনি।',
    passwordTooShort: 'পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে।',
    passwordSetSuccess: 'পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!',
    passwordChangeSuccess: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!',
    securitySettings: 'নিরাপত্তা ও ড্যাশবোর্ড লক',
    changePassword: 'পাসওয়ার্ড পরিবর্তন করুন',
    autoLockNotice: '১০ মিনিট নিষ্ক্রিয় থাকার কারণে অ্যাপ্লিকেশনটি লক করা হয়েছে।',
    passwordProtected: 'পাসওয়ার্ড দ্বারা সুরক্ষিত',
    noPasswordConfigured: 'কোনো পাসওয়ার্ড কনফিগার করা নেই',
    setPassword: 'পাসওয়ার্ড সেট করুন',
    updatePassword: 'পাসওয়ার্ড আপডেট করুন',
    welcomeToApp: 'স্বাগতম',
    setupRequiredTitle: 'প্রাথমিক সেটআপ আবশ্যক',
    setupRequiredDesc: 'অ্যাপ্লিকেশন ব্যবহারের পূর্বে আপনার গুগল শিট ডাটাবেজ সংযুক্ত করুন এবং একটি সুরক্ষিত ড্যাশবোর্ড পাসওয়ার্ড তৈরি করুন।',
    startSetup: 'সেটআপ শুরু করুন',
    stepGoogleSheets: 'গুগল শিট সংযোগ',
    stepAppsScript: 'অ্যাপস স্ক্রিপ্ট ইন্টিগ্রেশন',
    stepInitDatabase: 'ডাটাবেজ ইনিশিয়ালাইজ',
    stepPasswordSetup: 'পাসওয়ার্ড তৈরি',
    connectGoogleSheetsTitle: 'গুগল শিট ও অ্যাপস স্ক্রিপ্ট সংযোগ',
    connectGoogleSheetsDesc: 'স্থায়ী ক্লাউড স্টোরেজের জন্য গুগল অ্যাপস স্ক্রিপ্ট ওয়েব অ্যাপের মাধ্যমে আপনার গুগল স্প্রেডশিট ডাটাবেজ সংযুক্ত করুন।',
    testConnection: 'সংযোগ পরীক্ষা করুন',
    testingConnection: 'সংযোগ পরীক্ষা করা হচ্ছে...',
    connectionSuccessful: 'সংযোগ সফল হয়েছে! গুগল শিট ডাটাবেজ প্রস্তুত।',
    connectionFailed: 'সংযোগ ব্যর্থ হয়েছে। ওয়েব অ্যাপ ইউআরএল এবং অ্যাক্সেস অনুমতি যাচাই করুন।',
    continueToInit: 'ডাটাবেজ সেটআপে এগিয়ে যান',
    initDatabaseTitle: 'অ্যাপ্লিকেশন ডাটাবেজ ইনিশিয়ালাইজ করুন',
    initDatabaseDesc: 'অ্যাপ্লিকেশনটি স্বয়ংক্রিয়ভাবে প্রয়োজনীয় সকল শিট, কলাম হেডার, ডিফল্ট সেটিংস এবং ডাটাবেজ কাঠামো তৈরি করবে। আপনাকে ম্যানুয়ালি কিছু তৈরি করতে হবে না।',
    initializeDatabaseButton: 'ডাটাবেজ ইনিশিয়ালাইজ করুন',
    initializingDatabase: 'ডাটাবেজ ও শিট তৈরি হচ্ছে...',
    verifyingStructure: 'কাঠামো যাচাই করা হচ্ছে...',
    initSuccessTitle: 'ডাটাবেজ প্রস্তুত!',
    initSuccessDesc: 'সকল প্রয়োজনীয় শিট (Clients, Categories, ApplicationStatuses, Settings) ও হেডার সফলভাবে তৈরি ও যাচাই করা হয়েছে।',
    retryInit: 'পুনরায় চেষ্টা করুন',
    continueToPassword: 'পাসওয়ার্ড সেটআপে এগিয়ে যান',
    createDashboardPasswordTitle: 'ড্যাশবোর্ড পাসওয়ার্ড তৈরি করুন',
    createDashboardPasswordDesc: 'আপনার ক্লায়েন্ট ব্যবস্থাপনা সিস্টেম সুরক্ষিত রাখতে একটি পাসওয়ার্ড দিন। পাসওয়ার্ডটি ক্রিপ্টোগ্রাফিক সল্টেড SHA-256 হ্যাশ হিসেবে সংরক্ষিত হয়।',
    finishSetupAndEnter: 'সেটআপ সম্পন্ন করুন ও ড্যাশবোর্ডে প্রবেশ করুন',
    creatingPassword: 'পাসওয়ার্ড সুরক্ষিত করা হচ্ছে...',
    setupCompletedNotice: 'সেটআপ সফলভাবে সম্পন্ন হয়েছে! ড্যাশবোর্ডে স্বাগতম।',
  },
};

export const STORAGE_KEY_LANGUAGE = 'language_preference_v1';

export function getStoredLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LANGUAGE);
    if (saved === 'bn' || saved === 'en') {
      return saved;
    }
  } catch (e) {
    console.error('Failed to read language preference:', e);
  }
  return 'en';
}

export function saveStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
  } catch (e) {
    console.error('Failed to save language preference:', e);
  }
}
