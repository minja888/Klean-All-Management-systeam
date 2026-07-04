// ---------------------------------------------------------------------------
// i18n — bilingual dictionary (English + Kiswahili)
// ---------------------------------------------------------------------------
// Every user-facing label lives here as a key with an `en` and `sw` value.
// Business DATA (names, amounts) stays neutral — we only translate the chrome.
// The active language is remembered in a cookie ("lang") and provided to the
// React tree by <I18nProvider> (see components/i18n-provider.tsx).
// ---------------------------------------------------------------------------

export type Lang = "en" | "sw";

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "sw", label: "Kiswahili" },
];

/** dictionary[key] = { en, sw } */
export const dictionary = {
  // Brand / generic
  "app.name": { en: "Klean All", sw: "Klean All" },
  "app.tagline": { en: "Factory ERP / POS", sw: "Mfumo wa Kiwanda / POS" },

  // Common actions
  "action.save": { en: "Save", sw: "Hifadhi" },
  "action.cancel": { en: "Cancel", sw: "Ghairi" },
  "action.create": { en: "Create", sw: "Tengeneza" },
  "action.edit": { en: "Edit", sw: "Hariri" },
  "action.delete": { en: "Delete", sw: "Futa" },
  "action.search": { en: "Search", sw: "Tafuta" },
  "action.add": { en: "Add", sw: "Ongeza" },
  "action.close": { en: "Close", sw: "Funga" },
  "common.loading": { en: "Loading…", sw: "Inapakia…" },
  "common.noData": { en: "No records yet.", sw: "Hakuna kumbukumbu bado." },
  "common.actions": { en: "Actions", sw: "Vitendo" },
  "common.confirmDelete": { en: "Are you sure you want to delete this?", sw: "Una uhakika unataka kufuta hii?" },
  "common.saved": { en: "Saved.", sw: "Imehifadhiwa." },

  // Auth
  "auth.login": { en: "Sign in", sw: "Ingia" },
  "auth.logout": { en: "Sign out", sw: "Toka" },
  "auth.email": { en: "Email", sw: "Barua pepe" },
  "auth.password": { en: "Password", sw: "Nywila" },
  "auth.signingIn": { en: "Signing in…", sw: "Inaingia…" },
  "auth.welcome": { en: "Welcome back", sw: "Karibu tena" },
  "auth.invalid": { en: "Invalid email or password.", sw: "Barua pepe au nywila si sahihi." },
  "auth.show": { en: "Show", sw: "Onyesha" },
  "auth.hide": { en: "Hide", sw: "Ficha" },
  "auth.loginTab": { en: "Sign in", sw: "Ingia" },
  "auth.registerTab": { en: "Register", sw: "Jisajili" },
  "auth.chooseRole": { en: "Choose your role", sw: "Chagua wajibu wako" },
  "auth.chooseName": { en: "Choose your name", sw: "Chagua jina lako" },
  "auth.useEmailInstead": { en: "Sign in with email instead", sw: "Ingia kwa barua pepe badala yake" },
  "auth.useRoleInstead": { en: "Sign in by role instead", sw: "Ingia kwa wajibu badala yake" },
  "auth.forgot": { en: "Forgot password?", sw: "Umesahau password?" },
  "auth.forgotHint": { en: "Enter your email. The Administrator will be notified and will give you a temporary password.", sw: "Andika barua pepe yako. Administrator atapata taarifa na atakupa password ya muda." },
  "auth.forgotSent": { en: "Request sent. Please contact your Administrator for the temporary password.", sw: "Ombi limetumwa. Wasiliana na Administrator wako kupata password ya muda." },
  "auth.pendingApproval": { en: "Your account is waiting for Admin approval. Please wait.", sw: "Akaunti yako inasubiri idhini ya Admin. Tafadhali subiri." },
  "auth.fullName": { en: "Full name", sw: "Jina kamili" },
  "auth.position": { en: "Your job / position", sw: "Kazi / nafasi yako" },
  "auth.confirmPassword": { en: "Confirm password", sw: "Rudia password" },
  "auth.passwordMismatch": { en: "Passwords do not match.", sw: "Password hazifanani." },
  "auth.registered": { en: "Account created! Wait for the Administrator to approve your access.", sw: "Akaunti imeundwa! Subiri Administrator akuidhinishe." },
  "auth.roleADMIN": { en: "Administrator", sw: "Msimamizi Mkuu (Admin)" },
  "auth.roleMANAGER": { en: "Manager", sw: "Meneja" },
  "auth.roleACCOUNTING": { en: "Accountant", sw: "Mhasibu" },
  "auth.roleWORKER": { en: "Worker", sw: "Mfanyakazi" },
  "auth.changePassword": { en: "Change password", sw: "Badilisha password" },
  "auth.currentPassword": { en: "Current password", sw: "Password ya sasa" },
  "auth.newPassword": { en: "New password", sw: "Password mpya" },
  "auth.mustChange": { en: "For your security, create your own new password before continuing.", sw: "Kwa usalama wako, tengeneza password yako mpya kabla ya kuendelea." },
  "auth.passwordChanged": { en: "Password changed successfully.", sw: "Password imebadilishwa." },

  // Navigation / modules
  "nav.dashboard": { en: "Dashboard", sw: "Dashibodi" },
  "nav.materials": { en: "Materials", sw: "Malighafi" },
  "nav.inventory": { en: "Inventory", sw: "Bohari" },
  "nav.suppliers": { en: "Suppliers", sw: "Wasambazaji" },
  "nav.purchases": { en: "Purchases", sw: "Manunuzi" },
  "nav.products": { en: "Products", sw: "Bidhaa" },
  "nav.production": { en: "Production", sw: "Uzalishaji" },
  "nav.customers": { en: "Customers", sw: "Wateja" },
  "nav.pos": { en: "Point of Sale", sw: "Mauzo (POS)" },
  "nav.sales": { en: "Sales", sw: "Mauzo" },
  "nav.expenses": { en: "Expenses", sw: "Matumizi" },
  "nav.payroll": { en: "Payroll", sw: "Mishahara" },
  "nav.accounting": { en: "Accounting", sw: "Uhasibu" },
  "nav.reports": { en: "Reports", sw: "Ripoti" },
  "nav.users": { en: "Users", sw: "Watumiaji" },
  "nav.settings": { en: "Settings", sw: "Mipangilio" },
  "nav.audit": { en: "Audit Log", sw: "Kumbukumbu za Mabadiliko" },
  "nav.admin": { en: "Administration", sw: "Utawala" },

  // Roles
  "role.ADMIN": { en: "Administrator", sw: "Msimamizi" },
  "role.MANAGER": { en: "Manager", sw: "Meneja" },
  "role.ACCOUNTING": { en: "Accounting", sw: "Uhasibu" },
  "role.WORKER": { en: "Worker", sw: "Mfanyakazi" },

  // Users page
  "users.title": { en: "Users", sw: "Watumiaji" },
  "users.new": { en: "New user", sw: "Mtumiaji mpya" },
  "users.name": { en: "Full name", sw: "Jina kamili" },
  "users.role": { en: "Role", sw: "Wajibu" },
  "users.department": { en: "Department", sw: "Idara" },
  "users.status": { en: "Status", sw: "Hali" },
  "users.active": { en: "Active", sw: "Anatumika" },
  "users.inactive": { en: "Inactive", sw: "Hatumiki" },
  "users.passwordHint": { en: "Leave blank to keep the current password.", sw: "Acha wazi kubaki na nywila ya sasa." },

  // Settings page
  "settings.title": { en: "Settings", sw: "Mipangilio" },
  "settings.departments": { en: "Departments", sw: "Idara" },
  "settings.materialCategories": { en: "Material Categories", sw: "Aina za Malighafi" },
  "settings.expenseCategories": { en: "Expense Categories", sw: "Aina za Matumizi" },
  "settings.app": { en: "Company", sw: "Kampuni" },
  "settings.companyName": { en: "Company name", sw: "Jina la kampuni" },
  "settings.currency": { en: "Currency", sw: "Sarafu" },
  "settings.lowStockDefault": { en: "Default low-stock level", sw: "Kiwango cha chini cha bidhaa" },
  "settings.defaultLanguage": { en: "Default language", sw: "Lugha ya msingi" },
  "settings.categoryName": { en: "Name", sw: "Jina" },
  "settings.departmentName": { en: "Department name", sw: "Jina la idara" },
  "settings.description": { en: "Description", sw: "Maelezo" },

  // Common (extra)
  "common.total": { en: "Total", sw: "Jumla" },
  "common.all": { en: "All", sw: "Zote" },
  "common.optional": { en: "optional", sw: "hiari" },
  "common.back": { en: "Back", sw: "Rudi" },
  "common.view": { en: "View", sw: "Angalia" },
  "common.print": { en: "Print", sw: "Chapisha" },

  // Materials
  "materials.title": { en: "Materials", sw: "Malighafi" },
  "materials.new": { en: "New material", sw: "Malighafi mpya" },
  "materials.name": { en: "Name", sw: "Jina" },
  "materials.category": { en: "Category", sw: "Aina" },
  "materials.purchaseUnit": { en: "Purchase unit", sw: "Kipimo cha kununua" },
  "materials.stockUnit": { en: "Stock unit", sw: "Kipimo cha kuhifadhi" },
  "materials.conversionFactor": { en: "Conversion factor", sw: "Kigezo cha ubadilishaji" },
  "materials.reorderLevel": { en: "Reorder level", sw: "Kiwango cha kuagiza tena" },
  "materials.costPrice": { en: "Cost price", sw: "Bei ya gharama" },
  "materials.currentStock": { en: "Current stock", sw: "Bidhaa iliyopo" },
  "materials.conversionHint": { en: "Stock units per 1 purchase unit (e.g. metres per roll).", sw: "Vipimo vya hifadhi kwa kipimo 1 cha kununua." },
  "materials.record": { en: "Record", sw: "Rekodi" },
  "materials.recordTitle": { en: "Record stock movement", sw: "Rekodi mzunguko wa bidhaa" },
  "materials.stockIn": { en: "Stock in (received)", sw: "Imeingia (imepokelewa)" },
  "materials.stockOut": { en: "Stock out (used)", sw: "Imetumika (imetoka)" },
  "materials.quantity": { en: "Quantity", sw: "Kiasi" },
  "materials.note": { en: "Note", sw: "Maelezo" },
  "materials.priceAdminOnly": { en: "Price is set by the Admin.", sw: "Bei inawekwa na Admin tu." },
  "materials.unitHint": { en: "e.g. kilo, roll, bag, carton, metre, piece", sw: "mfano: kilo, roli, mfuko, katoni, mita, kipande" },

  // Inventory
  "inventory.title": { en: "Inventory", sw: "Bohari" },
  "inventory.level": { en: "Stock level", sw: "Kiwango cha bidhaa" },
  "inventory.value": { en: "Value", sw: "Thamani" },
  "inventory.totalValue": { en: "Total stock value", sw: "Thamani ya jumla" },
  "inventory.lowStockItems": { en: "Low-stock items", sw: "Bidhaa zinazopungua" },
  "inventory.lowBadge": { en: "Low", sw: "Chini" },

  // Suppliers
  "suppliers.title": { en: "Suppliers", sw: "Wasambazaji" },
  "suppliers.new": { en: "New supplier", sw: "Msambazaji mpya" },
  "suppliers.name": { en: "Name", sw: "Jina" },
  "suppliers.phone": { en: "Phone", sw: "Simu" },
  "suppliers.email": { en: "Email", sw: "Barua pepe" },
  "suppliers.address": { en: "Address", sw: "Anuani" },
  "suppliers.creditOwed": { en: "Credit owed", sw: "Deni tunalodaiwa" },

  // Purchases
  "purchases.title": { en: "Purchases", sw: "Manunuzi" },
  "purchases.new": { en: "New purchase order", sw: "Oda mpya ya manunuzi" },
  "purchases.order": { en: "Order", sw: "Oda" },
  "purchases.supplier": { en: "Supplier", sw: "Msambazaji" },
  "purchases.status": { en: "Status", sw: "Hali" },
  "purchases.date": { en: "Date", sw: "Tarehe" },
  "purchases.total": { en: "Total", sw: "Jumla" },
  "purchases.paid": { en: "Paid", sw: "Imelipwa" },
  "purchases.credit": { en: "Credit", sw: "Deni" },
  "purchases.items": { en: "Items", sw: "Bidhaa" },
  "purchases.material": { en: "Material", sw: "Malighafi" },
  "purchases.qty": { en: "Quantity", sw: "Kiasi" },
  "purchases.unitPrice": { en: "Unit price", sw: "Bei kwa kipimo" },
  "purchases.lineTotal": { en: "Line total", sw: "Jumla ya mstari" },
  "purchases.addItem": { en: "Add item", sw: "Ongeza bidhaa" },
  "purchases.amountPaid": { en: "Amount paid", sw: "Kiasi kilicholipwa" },
  "purchases.receive": { en: "Receive", sw: "Pokea" },
  "purchases.confirmReceive": { en: "Receive this order and add stock?", sw: "Pokea oda hii na uongeze bidhaa?" },
  "purchases.notes": { en: "Notes", sw: "Maelezo" },

  // Order status
  "status.DRAFT": { en: "Draft", sw: "Rasimu" },
  "status.ORDERED": { en: "Ordered", sw: "Imeagizwa" },
  "status.RECEIVED": { en: "Received", sw: "Imepokelewa" },
  "status.CANCELLED": { en: "Cancelled", sw: "Imeghairiwa" },

  // Products & BOM
  "products.title": { en: "Products", sw: "Bidhaa" },
  "products.new": { en: "New product", sw: "Bidhaa mpya" },
  "products.sku": { en: "SKU", sw: "SKU" },
  "products.name": { en: "Name", sw: "Jina" },
  "products.unit": { en: "Unit", sw: "Kipimo" },
  "products.sellingPrice": { en: "Selling price", sw: "Bei ya kuuza" },
  "products.currentStock": { en: "In stock", sw: "Iliyopo" },
  "products.reorderLevel": { en: "Reorder level", sw: "Kiwango cha kuagiza tena" },
  "products.bom": { en: "BOM", sw: "Viungo" },
  "products.editBom": { en: "Edit BOM", sw: "Hariri viungo" },
  "products.bomFor": { en: "Bill of Materials", sw: "Orodha ya malighafi" },
  "products.quantityPerUnit": { en: "Qty per unit", sw: "Kiasi kwa kipimo" },
  "products.addMaterial": { en: "Add material", sw: "Ongeza malighafi" },
  "products.saveBom": { en: "Save BOM", sw: "Hifadhi viungo" },

  // Production
  "production.title": { en: "Production", sw: "Uzalishaji" },
  "production.new": { en: "New batch", sw: "Kundi jipya" },
  "production.batch": { en: "Batch", sw: "Kundi" },
  "production.product": { en: "Product", sw: "Bidhaa" },
  "production.planned": { en: "Planned", sw: "Iliyopangwa" },
  "production.produced": { en: "Produced", sw: "Iliyozalishwa" },
  "production.waste": { en: "Waste", sw: "Taka" },
  "production.status": { en: "Status", sw: "Hali" },
  "production.complete": { en: "Complete", sw: "Kamilisha" },
  "production.completeTitle": { en: "Complete batch", sw: "Kamilisha kundi" },
  "production.quantityProduced": { en: "Quantity produced", sw: "Kiasi kilichozalishwa" },
  "production.wasteQuantity": { en: "Waste quantity", sw: "Kiasi cha taka" },
  "production.usageHint": { en: "Materials will be consumed from the recipe (BOM) × quantity produced.", sw: "Malighafi zitatumika kutoka kwenye viungo × kiasi kilichozalishwa." },

  // Batch status
  "bstatus.PLANNED": { en: "Planned", sw: "Imepangwa" },
  "bstatus.IN_PROGRESS": { en: "In progress", sw: "Inaendelea" },
  "bstatus.COMPLETED": { en: "Completed", sw: "Imekamilika" },
  "bstatus.CANCELLED": { en: "Cancelled", sw: "Imeghairiwa" },

  // Customers
  "customers.title": { en: "Customers", sw: "Wateja" },
  "customers.new": { en: "New customer", sw: "Mteja mpya" },
  "customers.name": { en: "Name", sw: "Jina" },
  "customers.phone": { en: "Phone", sw: "Simu" },
  "customers.email": { en: "Email", sw: "Barua pepe" },
  "customers.address": { en: "Address", sw: "Anuani" },
  "customers.debt": { en: "Debt", sw: "Deni" },

  // POS
  "pos.title": { en: "Point of Sale", sw: "Mauzo (POS)" },
  "pos.cart": { en: "Cart", sw: "Kikapu" },
  "pos.product": { en: "Product", sw: "Bidhaa" },
  "pos.qty": { en: "Qty", sw: "Kiasi" },
  "pos.price": { en: "Price", sw: "Bei" },
  "pos.total": { en: "Total", sw: "Jumla" },
  "pos.amountPaid": { en: "Amount paid", sw: "Kiasi kilicholipwa" },
  "pos.paymentMethod": { en: "Payment method", sw: "Njia ya malipo" },
  "pos.customer": { en: "Customer", sw: "Mteja" },
  "pos.walkIn": { en: "Walk-in", sw: "Mteja wa papo hapo" },
  "pos.emptyCart": { en: "Cart is empty. Add products.", sw: "Kikapu ni tupu. Ongeza bidhaa." },
  "pos.completeSale": { en: "Complete sale", sw: "Kamilisha mauzo" },
  "pos.balance": { en: "Balance (debt)", sw: "Salio (deni)" },
  "pos.searchProduct": { en: "Search products…", sw: "Tafuta bidhaa…" },

  // Sales
  "sales.title": { en: "Sales", sw: "Mauzo" },
  "sales.number": { en: "Sale", sw: "Mauzo" },
  "sales.date": { en: "Date", sw: "Tarehe" },
  "sales.receipt": { en: "Receipt", sw: "Risiti" },

  // Payment methods
  "method.Cash": { en: "Cash", sw: "Fedha taslimu" },
  "method.M-Pesa": { en: "M-Pesa", sw: "M-Pesa" },
  "method.Bank": { en: "Bank", sw: "Benki" },

  // Receipt
  "receipt.title": { en: "Receipt", sw: "Risiti" },
  "receipt.thankYou": { en: "Thank you for your business!", sw: "Asante kwa biashara!" },

  // Expenses
  "expenses.title": { en: "Expenses", sw: "Matumizi" },
  "expenses.new": { en: "New expense", sw: "Matumizi mapya" },
  "expenses.category": { en: "Category", sw: "Aina" },
  "expenses.amount": { en: "Amount", sw: "Kiasi" },
  "expenses.description": { en: "Description", sw: "Maelezo" },
  "expenses.date": { en: "Date", sw: "Tarehe" },

  // Payroll
  "payroll.title": { en: "Payroll", sw: "Mishahara" },
  "payroll.employees": { en: "Employees", sw: "Wafanyakazi" },
  "payroll.runs": { en: "Payroll runs", sw: "Mizunguko ya mishahara" },
  "payroll.newRun": { en: "New run", sw: "Mzunguko mpya" },
  "payroll.newEmployee": { en: "New employee", sw: "Mfanyakazi mpya" },
  "payroll.year": { en: "Year", sw: "Mwaka" },
  "payroll.month": { en: "Month", sw: "Mwezi" },
  "payroll.period": { en: "Period", sw: "Kipindi" },
  "payroll.status": { en: "Status", sw: "Hali" },
  "payroll.totalNet": { en: "Total net", sw: "Jumla halisi" },
  "payroll.employee": { en: "Employee", sw: "Mfanyakazi" },
  "payroll.position": { en: "Position", sw: "Wadhifa" },
  "payroll.baseSalary": { en: "Base salary", sw: "Mshahara wa msingi" },
  "payroll.bonus": { en: "Bonus", sw: "Bonasi" },
  "payroll.foodAllowance": { en: "Food", sw: "Chakula" },
  "payroll.transportAllowance": { en: "Transport", sw: "Usafiri" },
  "payroll.deductions": { en: "Deductions", sw: "Makato" },
  "payroll.netPay": { en: "Net pay", sw: "Malipo halisi" },
  "payroll.approve": { en: "Approve", sw: "Idhinisha" },
  "payroll.pay": { en: "Mark paid", sw: "Weka kama imelipwa" },
  "payroll.phone": { en: "Phone", sw: "Simu" },
  "payroll.active": { en: "Active", sw: "Anatumika" },
  "payroll.openRun": { en: "Open", sw: "Fungua" },

  // Payroll status
  "pstatus.DRAFT": { en: "Draft", sw: "Rasimu" },
  "pstatus.APPROVED": { en: "Approved", sw: "Imeidhinishwa" },
  "pstatus.PAID": { en: "Paid", sw: "Imelipwa" },

  // Dashboard KPIs
  "dash.netProfitMonth": { en: "Net profit (month)", sw: "Faida halisi (mwezi)" },
  "dash.netProfitYTD": { en: "Net profit (YTD)", sw: "Faida halisi (mwaka)" },
  "dash.salesMonth": { en: "Sales (month)", sw: "Mauzo (mwezi)" },
  "dash.purchasesMonth": { en: "Purchases (month)", sw: "Manunuzi (mwezi)" },
  "dash.supplierCredit": { en: "Supplier credit", sw: "Deni la wasambazaji" },
  "dash.customerDebt": { en: "Customer debt", sw: "Deni la wateja" },
  "dash.stockValue": { en: "Stock value", sw: "Thamani ya bidhaa" },
  "dash.production": { en: "Production (month)", sw: "Uzalishaji (mwezi)" },
  "dash.lowStockAlerts": { en: "Low-stock alerts", sw: "Tahadhari za bidhaa" },
  "dash.notifications": { en: "Approvals needed", sw: "Maombi yanayosubiri idhini" },
  "dash.newRegistration": { en: "New registration", sw: "Usajili mpya" },
  "dash.resetRequest": { en: "Password reset request", sw: "Ombi la kubadilishiwa password" },
  "dash.approveNow": { en: "Approve", sw: "Idhinisha" },
  "dash.openUsers": { en: "Open Users", sw: "Fungua Watumiaji" },
  "dash.approved": { en: "Approved!", sw: "Imeidhinishwa!" },

  // Accounting
  "accounting.title": { en: "Accounting", sw: "Uhasibu" },
  "accounting.payables": { en: "Payables (owed to suppliers)", sw: "Madeni (kwa wasambazaji)" },
  "accounting.receivables": { en: "Receivables (owed by customers)", sw: "Malipo (kutoka kwa wateja)" },
  "accounting.payments": { en: "Recent payments", sw: "Malipo ya hivi karibuni" },
  "accounting.recordPayment": { en: "Record payment", sw: "Rekodi malipo" },
  "accounting.totalPayable": { en: "Total payable", sw: "Jumla ya madeni" },
  "accounting.totalReceivable": { en: "Total receivable", sw: "Jumla ya malipo" },
  "accounting.pay": { en: "Pay", sw: "Lipa" },
  "accounting.receive": { en: "Receive", sw: "Pokea" },
  "accounting.balance": { en: "Balance", sw: "Salio" },
  "accounting.amount": { en: "Amount", sw: "Kiasi" },
  "accounting.method": { en: "Method", sw: "Njia" },

  // Reports
  "reports.title": { en: "Reports", sw: "Ripoti" },
  "reports.from": { en: "From", sw: "Kutoka" },
  "reports.to": { en: "To", sw: "Hadi" },
  "reports.generate": { en: "Generate", sw: "Tengeneza" },
  "reports.revenue": { en: "Revenue", sw: "Mapato" },
  "reports.cogs": { en: "Cost of goods (COGS)", sw: "Gharama za bidhaa" },
  "reports.grossProfit": { en: "Gross profit", sw: "Faida ghafi" },
  "reports.expenses": { en: "Expenses", sw: "Matumizi" },
  "reports.payroll": { en: "Payroll", sw: "Mishahara" },
  "reports.operatingCost": { en: "Operating cost", sw: "Gharama za uendeshaji" },
  "reports.netProfit": { en: "Net profit", sw: "Faida halisi" },
  "reports.exportSales": { en: "Export sales (CSV)", sw: "Hamisha mauzo (CSV)" },
  "reports.exportExpenses": { en: "Export expenses (CSV)", sw: "Hamisha matumizi (CSV)" },
  "reports.exportProfit": { en: "Export profit (CSV)", sw: "Hamisha faida (CSV)" },

  // Audit
  "audit.title": { en: "Audit Log", sw: "Kumbukumbu za Mabadiliko" },
  "audit.action": { en: "Action", sw: "Kitendo" },
  "audit.entity": { en: "Entity", sw: "Kipengele" },
  "audit.user": { en: "User", sw: "Mtumiaji" },
  "audit.when": { en: "When", sw: "Lini" },
  "audit.filterEntity": { en: "Filter by entity…", sw: "Chuja kwa kipengele…" },

  // Users admin extras
  "users.position": { en: "Position", sw: "Nafasi" },
  "users.pending": { en: "Waiting approval", sw: "Anasubiri idhini" },
  "users.approve": { en: "Approve", sw: "Idhinisha" },
  "users.resetRequests": { en: "Password reset requests", sw: "Maombi ya kubadilishiwa password" },
  "users.resetHint": { en: "Set a temporary password for the person (Edit); they will be forced to create their own on next login.", sw: "Mwekee password ya muda (Hariri); atalazimishwa kutengeneza yake mwenyewe akiingia." },
  "users.tempPasswordNote": { en: "The person will be asked to create their own password on first login.", sw: "Mtu huyu ataombwa kutengeneza password yake mwenyewe akiingia mara ya kwanza." },

  // Usage tips (shown at the top of each page)
  "tips.title": { en: "How to use", sw: "Jinsi ya kutumia" },
  "tips.materials": { en: "1) Add a material with its unit (kilo, roll…). 2) Use “Record” to note stock coming in or being used. Prices are set by the Admin.", sw: "1) Ongeza malighafi na kipimo chake (kilo, roli…). 2) Tumia “Rekodi” kuandika inayoingia au inayotumika. Bei zinawekwa na Admin." },
  "tips.inventory": { en: "This page shows current stock. Yellow rows are low on stock — order more.", sw: "Ukurasa huu unaonyesha bidhaa zilizopo. Mistari ya njano ni bidhaa zinazopungua — agiza zaidi." },
  "tips.suppliers": { en: "Add the people/companies you buy materials from. “Credit owed” is money you still owe them.", sw: "Ongeza watu/kampuni unaonunua malighafi kwao. “Deni tunalodaiwa” ni pesa ambayo bado unawadai wao." },
  "tips.purchases": { en: "First add a Supplier and Materials. Then create an order with its items. When goods arrive, press “Receive” — stock increases automatically.", sw: "Kwanza ongeza Msambazaji na Malighafi. Kisha tengeneza oda na bidhaa zake. Mzigo ukifika bonyeza “Pokea” — stock inaongezeka yenyewe." },
  "tips.products": { en: "Add finished products (with selling price), then open “Edit BOM” to set the recipe — how much material one product uses.", sw: "Ongeza bidhaa za kuuza (na bei), kisha fungua “Hariri viungo” kuweka kichocheo — kiasi cha malighafi kwa bidhaa moja." },
  "tips.production": { en: "Create a batch (product + quantity). When done, press “Complete” — materials are deducted and finished goods added automatically.", sw: "Tengeneza kundi (bidhaa + kiasi). Ukimaliza bonyeza “Kamilisha” — malighafi zinapungua na bidhaa zinaongezeka zenyewe." },
  "tips.customers": { en: "Add your customers. “Debt” shows how much each still owes you.", sw: "Ongeza wateja wako. “Deni” inaonyesha kiasi ambacho kila mmoja anadaiwa." },
  "tips.pos": { en: "Tap products to add to cart, choose customer & payment, enter amount paid, then “Complete sale” and print the receipt.", sw: "Gusa bidhaa kuweka kikapuni, chagua mteja na njia ya malipo, weka kiasi kilicholipwa, kisha “Kamilisha mauzo” na uchapishe risiti." },
  "tips.sales": { en: "All past sales. Red “Debt” means the customer hasn’t finished paying — record payments in Accounting.", sw: "Mauzo yote yaliyopita. “Deni” nyekundu = mteja hajamaliza kulipa — rekodi malipo kwenye Uhasibu." },
  "tips.expenses": { en: "Record every company cost here (rent, electricity…). Choose the right category so reports are accurate.", sw: "Rekodi kila gharama ya kampuni hapa (kodi, umeme…). Chagua aina sahihi ili ripoti ziwe sahihi." },
  "tips.payroll": { en: "Add employees with salaries. Each month create a run, adjust bonuses/deductions, then Approve and Mark paid.", sw: "Ongeza wafanyakazi na mishahara. Kila mwezi tengeneza mzunguko, rekebisha bonasi/makato, kisha Idhinisha na Weka imelipwa." },
  "tips.accounting": { en: "Left: money you owe suppliers. Right: money customers owe you. Press Pay/Receive to record a payment.", sw: "Kushoto: unachodaiwa na wasambazaji. Kulia: wateja wanachokudai. Bonyeza Lipa/Pokea kurekodi malipo." },
  "tips.reports": { en: "Choose a period and Generate to see profit. Use the export buttons to download CSV files (open in Excel).", sw: "Chagua kipindi na Tengeneza kuona faida. Tumia vitufe vya kuhamisha kupakua CSV (inafunguka kwenye Excel)." },
} as const;

export type TranslationKey = keyof typeof dictionary;

/** Translate a key into the chosen language, falling back to English then the key. */
export function translate(lang: Lang, key: TranslationKey): string {
  const entry = dictionary[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en ?? key;
}
