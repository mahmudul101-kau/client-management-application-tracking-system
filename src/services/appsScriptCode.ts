/**
 * Google Apps Script Code Template
 * This code should be pasted into the Google Sheet's Apps Script editor:
 * Extensions > Apps Script
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * Client Management & Application Tracking System
 * Google Sheets Backend Web App
 * 
 * Sheets Created / Used:
 * 1. Clients (11 columns)
 * 2. Categories (4 columns)
 * 3. ApplicationStatuses (4 columns)
 * 4. Settings (2 columns: Setting Key | Setting Value)
 * 
 * CRITICAL DEPLOYMENT / UPDATE INSTRUCTIONS:
 * Whenever you update this script:
 * 1. In your Google Sheet, click 'Extensions' > 'Apps Script'
 * 2. Replace any existing code with this entire script (Ctrl+A -> Del -> Paste)
 * 3. Save the script (Ctrl+S or disk icon)
 * 4. IMPORTANT TO APPLY CHANGES:
 *    - Click 'Deploy' > 'Manage deployments'
 *    - Click the Pencil (Edit) icon next to your active Web App deployment
 *    - Under 'Version', select 'New version'
 *    - Click 'Deploy'
 *    (If this is the first deployment: Click 'Deploy' > 'New deployment' > Web app > Execute as: 'Me' > Who has access: 'Anyone' > Deploy)
 * 5. Ensure the Web App URL in your application settings matches this deployment.
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    setupSheetsIfMissing(ss);
    
    var params = (e && e.parameter) ? e.parameter : {};
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = {};
      }
    }
    
    // Check postData first, then URL query parameters
    var rawAction = (postData && postData.action) || (params && params.action) || 'getAll';
    var action = String(rawAction).trim();
    var actionLower = action.toLowerCase();
    
    var response = { success: true };
    
    if (actionLower === 'ping' || actionLower === 'test') {
      response.message = 'Successfully connected to Google Sheet';
      response.sheetName = ss.getName();
      response.clientsCount = Math.max(0, getClientsSheet(ss).getLastRow() - 1);
      response.categoriesCount = Math.max(0, getCategoriesSheet(ss).getLastRow() - 1);
      response.statusesCount = Math.max(0, getStatusesSheet(ss).getLastRow() - 1);

      // Check if dashboard password is configured
      var sSheet = ss.getSheetByName('Settings');
      var testHasPass = false;
      if (sSheet && sSheet.getLastRow() > 1) {
        var sVals = sSheet.getRange(2, 1, sSheet.getLastRow() - 1, 2).getValues();
        for (var st = 0; st < sVals.length; st++) {
          if (String(sVals[st][0] || '').trim() === 'dashboard_password_hash') {
            testHasPass = String(sVals[st][1] || '').trim().length > 0;
          }
        }
      }
      response.hasPasswordConfigured = testHasPass;
    } else if (actionLower === 'getall' || actionLower === 'readall') {
      response.clients = readClients(ss);
      response.categories = readCategories(ss);
      response.applicationStatuses = readStatuses(ss);
      response.settings = readSettings(ss);
      response.sheetName = ss.getName();
    } else if (actionLower === 'saveall' || actionLower === 'syncall') {
      if (postData.categories && Array.isArray(postData.categories)) {
        writeCategories(ss, postData.categories);
      }
      if (postData.applicationStatuses && Array.isArray(postData.applicationStatuses)) {
        writeStatuses(ss, postData.applicationStatuses);
      }
      if (postData.clients && Array.isArray(postData.clients)) {
        writeClients(ss, postData.clients);
      }
      if (postData.settings) {
        writeSettings(ss, postData.settings);
      } else if (postData.branding) {
        writeSettings(ss, postData.branding);
      }
      response.message = 'All records successfully synchronized to Google Sheets';
      response.clients = readClients(ss);
      response.categories = readCategories(ss);
      response.applicationStatuses = readStatuses(ss);
      response.settings = readSettings(ss);
    } else if (actionLower === 'addclient' || actionLower === 'createclient') {
      response.client = insertOrUpdateClient(ss, postData.client || postData);
      response.message = 'Client added successfully to Google Sheets';
    } else if (actionLower === 'updateclient' || actionLower === 'editclient') {
      response.client = insertOrUpdateClient(ss, postData.client || postData);
      response.message = 'Client updated successfully in Google Sheets';
    } else if (actionLower === 'deleteclient' || actionLower === 'removeclient') {
      var targetClientId = postData.clientId || postData.id || params.clientId || params.id;
      response.deleted = deleteClientRow(ss, targetClientId);
      response.message = 'Client deleted successfully from Google Sheets';
    } else if (actionLower === 'addcategory' || actionLower === 'createcategory') {
      response.category = insertOrUpdateCategory(ss, postData.category || postData);
      response.message = 'Category added successfully to Google Sheets';
    } else if (actionLower === 'updatecategory' || actionLower === 'editcategory') {
      response.category = insertOrUpdateCategory(ss, postData.category || postData);
      response.message = 'Category updated successfully in Google Sheets';
    } else if (actionLower === 'deletecategory' || actionLower === 'removecategory') {
      var targetCatId = postData.categoryId || postData.id || params.categoryId || params.id;
      response.deleted = deleteCategoryRow(ss, targetCatId);
      response.message = 'Category deleted successfully from Google Sheets';
    } else if (actionLower === 'addstatus' || actionLower === 'createstatus') {
      // 1. ADD APPLICATION STATUS
      var statusInput = postData.status || postData.statusData || postData.data || postData;
      var addedStatus = addStatusRow(ss, statusInput);
      response.status = addedStatus;
      response.success = true;
      response.message = 'Status ' + addedStatus.id + ' added successfully to Google Sheets';
      response.applicationStatuses = readStatuses(ss);
    } else if (actionLower === 'updatestatus' || actionLower === 'editstatus') {
      // 2. UPDATE APPLICATION STATUS
      var statusUpdateInput = postData.status || postData.statusData || postData.data || postData;
      var updatedStatus = updateStatusRow(ss, statusUpdateInput);
      response.status = updatedStatus;
      response.success = true;
      response.message = 'Status ' + updatedStatus.id + ' updated successfully in Google Sheets';
      response.applicationStatuses = readStatuses(ss);
    } else if (actionLower === 'deletestatus' || actionLower === 'removestatus') {
      // 3. DELETE APPLICATION STATUS
      var targetStatusId = postData.statusId || postData.id || params.statusId || params.id || (postData.status && postData.status.id);
      targetStatusId = String(targetStatusId || '').trim();
      var wasDeleted = deleteStatusRow(ss, targetStatusId);
      response.deleted = wasDeleted;
      response.statusId = targetStatusId;
      response.success = true;
      response.message = wasDeleted 
        ? 'Status ' + targetStatusId + ' deleted successfully from Google Sheets' 
        : 'Status ' + targetStatusId + ' not found or already deleted';
      response.applicationStatuses = readStatuses(ss);
    } else if (
      actionLower === 'deactivatestatus' || 
      actionLower === 'activatestatus' || 
      actionLower === 'reactivatestatus' || 
      actionLower === 'togglestatus'
    ) {
      // 4. DEACTIVATE / REACTIVATE STATUS (Updates Active/Inactive column without deleting)
      var toggleStatusId = postData.statusId || postData.id || params.statusId || params.id || (postData.status && postData.status.id);
      toggleStatusId = String(toggleStatusId || '').trim();
      var desiredActive = null;
      if (actionLower === 'deactivatestatus') {
        desiredActive = 'INACTIVE';
      } else if (actionLower === 'activatestatus' || actionLower === 'reactivatestatus') {
        desiredActive = 'ACTIVE';
      }
      var toggledStatus = setStatusActiveState(ss, toggleStatusId, desiredActive);
      response.status = toggledStatus;
      response.success = !!toggledStatus;
      response.message = toggledStatus 
        ? 'Status ' + toggleStatusId + ' set to ' + toggledStatus.status + ' in Google Sheets'
        : 'Status ' + toggleStatusId + ' not found in Google Sheets';
      response.applicationStatuses = readStatuses(ss);
    } else if (actionLower === 'savesettings' || actionLower === 'savebranding') {
      response.settings = writeSettings(ss, postData.settings || postData.branding || postData);
      response.message = 'Settings saved to Google Sheets';
    } else if (action === 'verifyPassword' || actionLower === 'verifypassword') {
      var enteredPassword = String(postData.password || params.password || '');
      var sheet = getSettingsSheet(ss);
      var lastRow = sheet.getLastRow();
      var storedHash = '';
      var storedSalt = '';
      if (lastRow > 1) {
        var sVals = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
        for (var sv = 0; sv < sVals.length; sv++) {
          var sk = String(sVals[sv][0] || '').trim();
          if (sk === 'dashboard_password_hash') storedHash = String(sVals[sv][1] || '');
          if (sk === 'dashboard_password_salt') storedSalt = String(sVals[sv][1] || '');
        }
      }
      if (!storedHash) {
        // No password configured yet
        response.success = true;
        response.verified = false;
        response.hasPasswordConfigured = false;
        response.message = 'No password configured yet';
      } else {
        var computedHash = sha256Hex(storedSalt + ':' + enteredPassword);
        if (computedHash === storedHash) {
          response.success = true;
          response.verified = true;
          response.hasPasswordConfigured = true;
          response.message = 'Password verified successfully';
        } else {
          response.success = true;
          response.verified = false;
          response.hasPasswordConfigured = true;
          response.error = 'Incorrect password';
        }
      }
    } else if (action === 'setPassword' || actionLower === 'setpassword') {
      var newPassword = String(postData.newPassword || postData.password || params.newPassword || params.password || '').trim();
      var currentPassword = String(postData.currentPassword || params.currentPassword || '');
      if (!newPassword || newPassword.length < 4) {
        response.success = false;
        response.error = 'Password must be at least 4 characters long';
      } else {
        var sheet = getSettingsSheet(ss);
        var lastRow = sheet.getLastRow();
        var storedHash = '';
        var storedSalt = '';
        if (lastRow > 1) {
          var sVals = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
          for (var sv = 0; sv < sVals.length; sv++) {
            var sk = String(sVals[sv][0] || '').trim();
            if (sk === 'dashboard_password_hash') storedHash = String(sVals[sv][1] || '').trim();
            if (sk === 'dashboard_password_salt') storedSalt = String(sVals[sv][1] || '').trim();
          }
        }
        // If a password already exists, require valid currentPassword
        if (storedHash && storedHash.length > 0) {
          if (!currentPassword) {
            response.success = false;
            response.error = 'Current password is required';
            return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
          }
          var checkHash = sha256Hex(storedSalt + ':' + currentPassword);
          if (checkHash !== storedHash) {
            response.success = false;
            response.error = 'Current password is incorrect';
            return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
          }
        }

        try {
          var newSalt = Utilities.getUuid();
          var newHash = sha256Hex(newSalt + ':' + newPassword);

          updateSettingRow(sheet, 'dashboard_password_hash', newHash);
          updateSettingRow(sheet, 'dashboard_password_salt', newSalt);

          response.success = true;
          response.hasPasswordConfigured = true;
          response.message = 'Password saved successfully to Google Sheets';
        } catch (saveErr) {
          response.success = false;
          response.error = 'Failed to hash and save password to Google Sheets: ' + saveErr.toString();
        }
      }
    } else if (action === 'checkPasswordStatus' || actionLower === 'checkpasswordstatus') {
      var sheet = getSettingsSheet(ss);
      var lastRow = sheet.getLastRow();
      var storedHash = '';
      if (lastRow > 1) {
        var sVals = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
        for (var sv = 0; sv < sVals.length; sv++) {
          var sk = String(sVals[sv][0] || '').trim();
          if (sk === 'dashboard_password_hash') storedHash = String(sVals[sv][1] || '').trim();
        }
      }
      response.success = true;
      response.hasPasswordConfigured = Boolean(storedHash && storedHash.length > 0);
    } else if (action === 'initializeDatabase' || actionLower === 'initializedatabase' || actionLower === 'initdatabase') {
      var initResult = runDatabaseInitialization(ss);
      response.success = initResult.success;
      response.message = initResult.message;
      response.details = initResult.details;
      response.hasPasswordConfigured = initResult.hasPasswordConfigured;
    } else if (action === 'verifyDatabase' || actionLower === 'verifydatabase') {
      var verifyResult = runDatabaseVerification(ss);
      response.success = verifyResult.success;
      response.message = verifyResult.message;
      response.details = verifyResult.details;
      response.hasPasswordConfigured = verifyResult.hasPasswordConfigured;
    } else {
      // Safety fallback: if an action is sent with data arrays, persist them safely
      if (postData.applicationStatuses || postData.clients || postData.categories) {
        if (postData.categories && Array.isArray(postData.categories)) {
          writeCategories(ss, postData.categories);
        }
        if (postData.applicationStatuses && Array.isArray(postData.applicationStatuses)) {
          writeStatuses(ss, postData.applicationStatuses);
        }
        if (postData.clients && Array.isArray(postData.clients)) {
          writeClients(ss, postData.clients);
        }
        response.success = true;
        response.message = 'Processed action ' + action + ' via sync fallback';
        response.applicationStatuses = readStatuses(ss);
      } else {
        response.success = false;
        response.error = 'Unknown action: ' + action;
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getClientsSheet(ss) {
  var sheet = ss.getSheetByName('Clients');
  if (!sheet) {
    sheet = ss.insertSheet('Clients');
    sheet.appendRow([
      'Client ID',
      'Client Name',
      'Phone Number',
      'Category',
      'Total Amount',
      'Paid Amount',
      'Due Amount',
      'Application Status',
      'Payment Status',
      'Created Date',
      'Notes'
    ]);
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#f1f5f9');
  }
  return sheet;
}

function getCategoriesSheet(ss) {
  var sheet = ss.getSheetByName('Categories');
  if (!sheet) {
    sheet = ss.insertSheet('Categories');
    sheet.appendRow([
      'Category ID',
      'Category Name',
      'Status',
      'Created Date'
    ]);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#f1f5f9');
  }
  return sheet;
}

function getStatusesSheet(ss) {
  var sheet = ss.getSheetByName('ApplicationStatuses');
  if (!sheet) {
    sheet = ss.insertSheet('ApplicationStatuses');
    sheet.appendRow([
      'Status ID',
      'Status Name',
      'Status',
      'Created Date'
    ]);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#f1f5f9');
  }
  return sheet;
}

function getSettingsSheet(ss) {
  var sheet = ss.getSheetByName('Settings');
  if (!sheet) {
    sheet = ss.insertSheet('Settings');
    sheet.appendRow([
      'Setting Key',
      'Setting Value'
    ]);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f1f5f9');
  }
  return sheet;
}

function setupSheetsIfMissing(ss) {
  getClientsSheet(ss);
  getCategoriesSheet(ss);
  getStatusesSheet(ss);
  getSettingsSheet(ss);
}

/**
 * Initializes all required database sheets, headers, and defaults idempotently.
 * Never deletes or overwrites existing rows or passwords.
 */
function runDatabaseInitialization(ss) {
  var details = {
    clients: false,
    categories: false,
    applicationStatuses: false,
    settings: false,
    defaultStatusesCreated: 0,
    defaultCategoriesCreated: 0,
    defaultSettingsCreated: false
  };

  try {
    // 1. Clients Sheet & Headers
    var clientsSheet = ss.getSheetByName('Clients');
    var clientHeaders = [
      'Client ID', 'Client Name', 'Phone Number', 'Category', 
      'Total Amount', 'Paid Amount', 'Due Amount', 'Application Status', 
      'Payment Status', 'Created Date', 'Notes'
    ];
    if (!clientsSheet) {
      clientsSheet = ss.insertSheet('Clients');
      clientsSheet.appendRow(clientHeaders);
      clientsSheet.getRange(1, 1, 1, clientHeaders.length).setFontWeight('bold').setBackground('#f1f5f9');
    } else {
      ensureSheetHeaders(clientsSheet, clientHeaders);
    }
    details.clients = true;

    // 2. Categories Sheet & Headers
    var categoriesSheet = ss.getSheetByName('Categories');
    var categoryHeaders = ['Category ID', 'Category Name', 'Status', 'Created Date'];
    if (!categoriesSheet) {
      categoriesSheet = ss.insertSheet('Categories');
      categoriesSheet.appendRow(categoryHeaders);
      categoriesSheet.getRange(1, 1, 1, categoryHeaders.length).setFontWeight('bold').setBackground('#f1f5f9');
    } else {
      ensureSheetHeaders(categoriesSheet, categoryHeaders);
    }
    details.categories = true;

    // Seed default categories if empty
    if (categoriesSheet.getLastRow() <= 1) {
      var defaultCats = [
        ['CAT-001', 'Saudi Scholarship', 'ACTIVE', '2026-09-01'],
        ['CAT-002', 'University Admission', 'ACTIVE', '2026-09-02'],
        ['CAT-003', 'Visa Application', 'ACTIVE', '2026-09-03']
      ];
      categoriesSheet.getRange(2, 1, defaultCats.length, 4).setValues(defaultCats);
      details.defaultCategoriesCreated = defaultCats.length;
    }

    // 3. ApplicationStatuses Sheet & Headers
    var statusesSheet = ss.getSheetByName('ApplicationStatuses');
    var statusHeaders = ['Status ID', 'Status Name', 'Status', 'Created Date'];
    if (!statusesSheet) {
      statusesSheet = ss.insertSheet('ApplicationStatuses');
      statusesSheet.appendRow(statusHeaders);
      statusesSheet.getRange(1, 1, 1, statusHeaders.length).setFontWeight('bold').setBackground('#f1f5f9');
    } else {
      ensureSheetHeaders(statusesSheet, statusHeaders);
    }
    details.applicationStatuses = true;

    // Seed default application statuses if empty
    if (statusesSheet.getLastRow() <= 1) {
      var defaultStatuses = [
        ['APP-001', 'New', 'ACTIVE', '2026-09-01'],
        ['APP-002', 'Processing', 'ACTIVE', '2026-09-02'],
        ['APP-003', 'Completed', 'ACTIVE', '2026-09-03'],
        ['APP-004', 'Rejected', 'ACTIVE', '2026-09-04']
      ];
      statusesSheet.getRange(2, 1, defaultStatuses.length, 4).setValues(defaultStatuses);
      details.defaultStatusesCreated = defaultStatuses.length;
    }

    // 4. Settings Sheet & Defaults
    var settingsSheet = ss.getSheetByName('Settings');
    var settingsHeaders = ['Setting Key', 'Setting Value'];
    if (!settingsSheet) {
      settingsSheet = ss.insertSheet('Settings');
      settingsSheet.appendRow(settingsHeaders);
      settingsSheet.getRange(1, 1, 1, settingsHeaders.length).setFontWeight('bold').setBackground('#f1f5f9');
    } else {
      ensureSheetHeaders(settingsSheet, settingsHeaders);
    }
    details.settings = true;

    // Seed default branding & configuration only if missing (never overwrite existing values or password)
    var existingSettings = {};
    var lastRow = settingsSheet.getLastRow();
    if (lastRow > 1) {
      var sVals = settingsSheet.getRange(2, 1, lastRow - 1, 2).getValues();
      for (var s = 0; s < sVals.length; s++) {
        var k = String(sVals[s][0] || '').trim();
        if (k) existingSettings[k] = String(sVals[s][1] || '');
      }
    }

    var defaultSettingsPairs = [
      ['app_title', 'Client Management & Application Tracking System'],
      ['app_slogan', 'Google Sheets Database'],
      ['logo_url', ''],
      ['currency', 'USD'],
      ['custom_currency_symbol', '']
    ];

    for (var d = 0; d < defaultSettingsPairs.length; d++) {
      var key = defaultSettingsPairs[d][0];
      var defaultVal = defaultSettingsPairs[d][1];
      if (existingSettings[key] === undefined) {
        settingsSheet.appendRow([key, defaultVal]);
        details.defaultSettingsCreated = true;
      }
    }

    var hasPassword = !!(existingSettings['dashboard_password_hash']);

    return {
      success: true,
      message: 'Database structure initialized and verified successfully',
      details: details,
      hasPasswordConfigured: hasPassword
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to initialize database: ' + err.toString(),
      details: details,
      hasPasswordConfigured: false
    };
  }
}

/**
 * Ensures a sheet has the required column headers at row 1 without destroying data.
 */
function ensureSheetHeaders(sheet, expectedHeaders) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0 || sheet.getLastRow() === 0) {
    sheet.appendRow(expectedHeaders);
    sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight('bold').setBackground('#f1f5f9');
    return;
  }
  var currentHeaders = sheet.getRange(1, 1, 1, Math.max(lastCol, expectedHeaders.length)).getValues()[0] || [];
  var needsUpdate = false;
  var finalHeaders = [];
  for (var i = 0; i < expectedHeaders.length; i++) {
    var cur = String(currentHeaders[i] || '').trim();
    if (!cur) {
      finalHeaders.push(expectedHeaders[i]);
      needsUpdate = true;
    } else {
      finalHeaders.push(cur);
    }
  }
  if (needsUpdate) {
    sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]).setFontWeight('bold');
  }
}

/**
 * Verifies that all 4 required database sheets and their required headers exist and are readable.
 */
function runDatabaseVerification(ss) {
  var sheets = ['Clients', 'Categories', 'ApplicationStatuses', 'Settings'];
  var verification = {
    clients: false,
    categories: false,
    applicationStatuses: false,
    settings: false,
    canReadWrite: false
  };

  try {
    for (var i = 0; i < sheets.length; i++) {
      var sName = sheets[i];
      var sh = ss.getSheetByName(sName);
      if (!sh) {
        return {
          success: false,
          message: 'Required sheet "' + sName + '" is missing.',
          details: verification,
          hasPasswordConfigured: false
        };
      }
      if (sName === 'Clients') verification.clients = true;
      if (sName === 'Categories') verification.categories = true;
      if (sName === 'ApplicationStatuses') verification.applicationStatuses = true;
      if (sName === 'Settings') verification.settings = true;
    }

    // Verify Settings read
    var settingsSheet = ss.getSheetByName('Settings');
    var sLastRow = settingsSheet.getLastRow();
    var hasPassword = false;
    if (sLastRow > 1) {
      var sVals = settingsSheet.getRange(2, 1, sLastRow - 1, 2).getValues();
      for (var j = 0; j < sVals.length; j++) {
        if (String(sVals[j][0] || '').trim() === 'dashboard_password_hash') {
          hasPassword = String(sVals[j][1] || '').length > 0;
        }
      }
    }

    verification.canReadWrite = true;

    return {
      success: true,
      message: 'All 4 database sheets and structure verified successfully',
      details: verification,
      hasPasswordConfigured: hasPassword
    };
  } catch (err) {
    return {
      success: false,
      message: 'Database verification failed: ' + err.toString(),
      details: verification,
      hasPasswordConfigured: false
    };
  }
}

function readClients(ss) {
  var sheet = getClientsSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  var values = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  var clients = [];
  
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var id = String(row[0] || '').trim();
    if (!id) continue;
    
    var total = parseFloat(row[4]) || 0;
    var paid = parseFloat(row[5]) || 0;
    var due = Math.max(0, total - paid);
    var pStatus = (paid >= total && total > 0) || (total === 0 && paid === 0) ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');
    
    clients.push({
      id: id,
      name: String(row[1] || ''),
      phone: String(row[2] || ''),
      category: String(row[3] || ''),
      totalAmount: total,
      paidAmount: paid,
      dueAmount: due,
      applicationStatus: String(row[7] || 'New'),
      paymentStatus: pStatus,
      createdDate: formatSheetDate(row[9]),
      notes: String(row[10] || '')
    });
  }
  return clients;
}

function readCategories(ss) {
  var sheet = getCategoriesSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  var values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var categories = [];
  
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var id = String(row[0] || '').trim();
    if (!id) continue;
    
    categories.push({
      id: id,
      name: String(row[1] || ''),
      status: String(row[2] || 'ACTIVE').toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      createdDate: formatSheetDate(row[3])
    });
  }
  return categories;
}

function readStatuses(ss) {
  var sheet = getStatusesSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  var values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var statuses = [];
  
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var id = String(row[0] || '').trim();
    if (!id) continue;
    
    statuses.push({
      id: id,
      name: String(row[1] || ''),
      status: String(row[2] || 'ACTIVE').toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      createdDate: formatSheetDate(row[3])
    });
  }
  return statuses;
}

function readSettings(ss) {
  var sheet = getSettingsSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { hasPasswordConfigured: false };
  
  var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var settings = {};
  var hasPassword = false;
  for (var i = 0; i < values.length; i++) {
    var k = String(values[i][0] || '').trim();
    if (k) {
      var val = String(values[i][1] !== undefined && values[i][1] !== null ? values[i][1] : '');
      
      // NEVER expose password hash or salt to frontend!
      if (k === 'dashboard_password_hash') {
        if (val.length > 0) hasPassword = true;
        continue;
      }
      if (k === 'dashboard_password_salt') {
        continue;
      }

      settings[k] = val;
      
      var norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm === 'apptitle' || norm === 'title' || norm === 'applicationtitle' || norm === 'name') {
        settings.app_title = val;
        settings.title = val;
      } else if (norm === 'appslogan' || norm === 'slogan' || norm === 'subtitle' || norm === 'tagline') {
        settings.app_slogan = val;
        settings.slogan = val;
      } else if (norm === 'logourl' || norm === 'logo' || norm === 'applogo') {
        settings.logo_url = val;
        settings.logoUrl = val;
      } else if (norm === 'currency' || norm === 'globalcurrency') {
        settings.currency = val;
      } else if (norm === 'customcurrencysymbol' || norm === 'symbol' || norm === 'currencysymbol') {
        settings.custom_currency_symbol = val;
        settings.customCurrencySymbol = val;
      }
    }
  }
  settings.hasPasswordConfigured = hasPassword;
  return settings;
}

function writeClients(ss, clients) {
  var sheet = getClientsSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 11).clearContent();
  }
  if (!clients || clients.length === 0) return;
  
  var rows = clients.map(function(c) {
    var total = parseFloat(c.totalAmount) || 0;
    var paid = parseFloat(c.paidAmount) || 0;
    var due = Math.max(0, total - paid);
    var pStatus = (paid >= total && total > 0) || (total === 0 && paid === 0) ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');
    return [
      c.id,
      c.name || '',
      c.phone || '',
      c.category || '',
      total,
      paid,
      due,
      c.applicationStatus || 'New',
      pStatus,
      c.createdDate || '',
      c.notes || ''
    ];
  });
  
  sheet.getRange(2, 1, rows.length, 11).setValues(rows);
}

function writeCategories(ss, categories) {
  var sheet = getCategoriesSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 4).clearContent();
  }
  if (!categories || categories.length === 0) return;
  
  var rows = categories.map(function(cat) {
    return [
      cat.id,
      cat.name || '',
      cat.status || 'ACTIVE',
      cat.createdDate || ''
    ];
  });
  
  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
}

function writeStatuses(ss, statuses) {
  var sheet = getStatusesSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 4).clearContent();
  }
  if (!statuses || statuses.length === 0) return;
  
  var rows = statuses.map(function(st) {
    return [
      st.id,
      st.name || '',
      st.status || 'ACTIVE',
      st.createdDate || ''
    ];
  });
  
  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
}

function writeSettings(ss, rawInput) {
  if (!rawInput || typeof rawInput !== 'object') return {};
  var sheet = getSettingsSheet(ss);

  // Read existing password hash & salt so they are preserved
  var existingHash = '';
  var existingSalt = '';
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var existingVals = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var e = 0; e < existingVals.length; e++) {
      var ek = String(existingVals[e][0] || '').trim();
      if (ek === 'dashboard_password_hash') {
        existingHash = String(existingVals[e][1] || '');
      } else if (ek === 'dashboard_password_salt') {
        existingSalt = String(existingVals[e][1] || '');
      }
    }
  }

  // Unpack settings if nested
  var source = (rawInput.settings && typeof rawInput.settings === 'object')
    ? rawInput.settings
    : ((rawInput.branding && typeof rawInput.branding === 'object') ? rawInput.branding : rawInput);

  // If source contains explicit password hash / salt, allow updating them safely
  if (source.dashboard_password_hash) {
    existingHash = String(source.dashboard_password_hash);
  }
  if (source.dashboard_password_salt) {
    existingSalt = String(source.dashboard_password_salt);
  }

  var appTitle = source.app_title !== undefined ? source.app_title : (source.title !== undefined ? source.title : (source.appTitle !== undefined ? source.appTitle : ''));
  var appSlogan = source.app_slogan !== undefined ? source.app_slogan : (source.slogan !== undefined ? source.slogan : (source.appSlogan !== undefined ? source.appSlogan : ''));
  var logoUrl = source.logo_url !== undefined ? source.logo_url : (source.logoUrl !== undefined ? source.logoUrl : (source.logo !== undefined ? source.logo : ''));
  var currency = source.currency !== undefined ? source.currency : (source.global_currency !== undefined ? source.global_currency : 'USD');
  var customCurrencySymbol = source.custom_currency_symbol !== undefined ? source.custom_currency_symbol : (source.customCurrencySymbol !== undefined ? source.customCurrencySymbol : '');

  // Ensure logo string is within Google Sheets 50,000 character cell limit
  var safeLogoStr = String(logoUrl !== undefined && logoUrl !== null ? logoUrl : '');
  if (safeLogoStr.length > 49000) {
    safeLogoStr = safeLogoStr.substring(0, 49000);
  }

  // Clear existing settings data rows
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 2).clearContent();
  }

  var rows = [
    ['app_title', String(appTitle !== undefined && appTitle !== null ? appTitle : '')],
    ['app_slogan', String(appSlogan !== undefined && appSlogan !== null ? appSlogan : '')],
    ['logo_url', safeLogoStr],
    ['currency', String(currency || 'USD')],
    ['custom_currency_symbol', String(customCurrencySymbol !== undefined && customCurrencySymbol !== null ? customCurrencySymbol : '')]
  ];

  if (existingHash) {
    rows.push(['dashboard_password_hash', existingHash]);
  }
  if (existingSalt) {
    rows.push(['dashboard_password_salt', existingSalt]);
  }

  try {
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  } catch (err) {
    // If bulk setValues fails, write row-by-row safely
    for (var r = 0; r < rows.length; r++) {
      try {
        sheet.getRange(2 + r, 1, 1, 2).setValues([[rows[r][0], rows[r][1]]]);
      } catch (cellErr) {
        sheet.getRange(2 + r, 1, 1, 2).setValues([[rows[r][0], '']]);
      }
    }
  }

  return {
    app_title: String(appTitle || ''),
    title: String(appTitle || ''),
    app_slogan: String(appSlogan || ''),
    slogan: String(appSlogan || ''),
    logo_url: safeLogoStr,
    logoUrl: safeLogoStr,
    currency: String(currency || 'USD'),
    custom_currency_symbol: String(customCurrencySymbol || ''),
    customCurrencySymbol: String(customCurrencySymbol || ''),
    hasPasswordConfigured: !!existingHash
  };
}

function insertOrUpdateClient(ss, client) {
  var sheet = getClientsSheet(ss);
  var lastRow = sheet.getLastRow();
  var total = parseFloat(client.totalAmount) || 0;
  var paid = parseFloat(client.paidAmount) || 0;
  var due = Math.max(0, total - paid);
  var pStatus = (paid >= total && total > 0) || (total === 0 && paid === 0) ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');
  
  var rowData = [
    client.id,
    client.name || '',
    client.phone || '',
    client.category || '',
    total,
    paid,
    due,
    client.applicationStatus || 'New',
    pStatus,
    client.createdDate || '',
    client.notes || ''
  ];
  
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === client.id) {
        sheet.getRange(i + 2, 1, 1, 11).setValues([rowData]);
        return client;
      }
    }
  }
  sheet.appendRow(rowData);
  return client;
}

function insertOrUpdateCategory(ss, category) {
  var sheet = getCategoriesSheet(ss);
  var lastRow = sheet.getLastRow();
  var rowData = [
    category.id,
    category.name || '',
    category.status || 'ACTIVE',
    category.createdDate || ''
  ];
  
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === category.id) {
        sheet.getRange(i + 2, 1, 1, 4).setValues([rowData]);
        return category;
      }
    }
  }
  sheet.appendRow(rowData);
  return category;
}

/**
 * Generates next sequential APP ID from the ApplicationStatuses sheet (e.g. APP-001, APP-002)
 */
function generateNextStatusIdFromSheet(sheet) {
  var lastRow = sheet.getLastRow();
  var maxNum = 0;
  if (lastRow > 1) {
    var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      var val = String(values[i][0] || '').trim();
      var match = val.match(/^APP-(\d+)$/i);
      if (match) {
        var num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  var nextNum = maxNum + 1;
  var padded = ('000' + nextNum).slice(-3);
  return 'APP-' + padded;
}

/**
 * Appends a new application status row to ApplicationStatuses
 * Supports automatic sequential ID generation and duplicate prevention
 */
function addStatusRow(ss, rawStatus) {
  var sheet = getStatusesSheet(ss);
  
  var statusId = '';
  if (rawStatus && rawStatus.id && String(rawStatus.id).trim().length > 0 && String(rawStatus.id).trim().toLowerCase() !== 'auto') {
    statusId = String(rawStatus.id).trim();
  } else {
    statusId = generateNextStatusIdFromSheet(sheet);
  }
  
  var statusName = (rawStatus && rawStatus.name) ? String(rawStatus.name).trim() : '';
  var statusState = (rawStatus && rawStatus.status && String(rawStatus.status).toUpperCase() === 'INACTIVE') ? 'INACTIVE' : 'ACTIVE';
  var createdDate = (rawStatus && rawStatus.createdDate) ? formatSheetDate(rawStatus.createdDate) : formatSheetDate(new Date());
  
  var rowData = [
    statusId,
    statusName,
    statusState,
    createdDate
  ];
  
  // If status with this ID already exists, update row in-place
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim().toUpperCase() === statusId.toUpperCase()) {
        sheet.getRange(i + 2, 1, 1, 4).setValues([rowData]);
        return {
          id: statusId,
          name: statusName,
          status: statusState,
          createdDate: createdDate
        };
      }
    }
  }
  
  sheet.appendRow(rowData);
  return {
    id: statusId,
    name: statusName,
    status: statusState,
    createdDate: createdDate
  };
}

/**
 * Updates an existing status row in ApplicationStatuses
 * Locates exact row by Status ID, preserves Status ID and Created Date, never duplicates
 */
function updateStatusRow(ss, rawStatus) {
  var sheet = getStatusesSheet(ss);
  var targetId = String((rawStatus && (rawStatus.id || rawStatus.statusId)) || '').trim();
  if (!targetId) {
    return addStatusRow(ss, rawStatus);
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var rows = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    for (var i = 0; i < rows.length; i++) {
      var currentId = String(rows[i][0] || '').trim();
      if (currentId.toUpperCase() === targetId.toUpperCase()) {
        // Exact row match: preserve original ID and original Created Date
        var preservedId = currentId;
        var preservedCreatedDate = formatSheetDate(rows[i][3]) || (rawStatus.createdDate ? formatSheetDate(rawStatus.createdDate) : formatSheetDate(new Date()));
        var updatedName = (rawStatus && rawStatus.name !== undefined) ? String(rawStatus.name).trim() : String(rows[i][1] || '');
        var updatedState = (rawStatus && rawStatus.status) 
          ? (String(rawStatus.status).toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') 
          : String(rows[i][2] || 'ACTIVE');
          
        var updatedRow = [preservedId, updatedName, updatedState, preservedCreatedDate];
        sheet.getRange(i + 2, 1, 1, 4).setValues([updatedRow]);
        
        return {
          id: preservedId,
          name: updatedName,
          status: updatedState,
          createdDate: preservedCreatedDate
        };
      }
    }
  }
  
  // If not found in sheet, add safely
  return addStatusRow(ss, rawStatus);
}

/**
 * Deactivates or activates a status in ApplicationStatuses
 * Updates Active/Inactive column (Column 3) without deleting the row
 */
function setStatusActiveState(ss, statusId, desiredState) {
  if (!statusId) return null;
  var sheet = getStatusesSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var rows = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    for (var i = 0; i < rows.length; i++) {
      var currentId = String(rows[i][0] || '').trim();
      if (currentId.toUpperCase() === String(statusId).trim().toUpperCase()) {
        var current = String(rows[i][2] || 'ACTIVE').toUpperCase();
        var nextState = desiredState || (current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
        
        sheet.getRange(i + 2, 3).setValue(nextState);
        return {
          id: currentId,
          name: String(rows[i][1] || ''),
          status: nextState,
          createdDate: formatSheetDate(rows[i][3])
        };
      }
    }
  }
  return null;
}

function deleteClientRow(ss, clientId) {
  if (!clientId) return false;
  var sheet = getClientsSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === String(clientId).trim()) {
        sheet.deleteRow(i + 2);
        return true;
      }
    }
  }
  return false;
}

function deleteCategoryRow(ss, categoryId) {
  if (!categoryId) return false;
  var sheet = getCategoriesSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === String(categoryId).trim()) {
        sheet.deleteRow(i + 2);
        return true;
      }
    }
  }
  return false;
}

/**
 * Finds exact row by Status ID and deletes that row from ApplicationStatuses
 */
function deleteStatusRow(ss, statusId) {
  if (!statusId) return false;
  var sheet = getStatusesSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      var currentId = String(ids[i][0] || '').trim();
      if (currentId.toUpperCase() === String(statusId).trim().toUpperCase()) {
        sheet.deleteRow(i + 2);
        return true;
      }
    }
  }
  return false;
}

function formatSheetDate(d) {
  if (!d) return '';
  if (typeof d === 'string') {
    // If it's already YYYY-MM-DD
    if (/^\\d{4}-\\d{2}-\\d{2}/.test(d)) {
      return d.substring(0, 10);
    }
  }
  try {
    var dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return String(d);
    var y = dateObj.getFullYear();
    var m = String(dateObj.getMonth() + 1);
    if (m.length < 2) m = '0' + m;
    var day = String(dateObj.getDate());
    if (day.length < 2) day = '0' + day;
    return y + '-' + m + '-' + day;
  } catch (e) {
    return String(d);
  }
}

/**
 * Calculates a SHA-256 hex string from input using Apps Script Utilities.
 */
function sha256Hex(str) {
  if (!str) return '';
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(str), Utilities.Charset.UTF_8);
  var txt = '';
  for (var i = 0; i < rawHash.length; i++) {
    var hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    var byteString = hashVal.toString(16);
    if (byteString.length === 1) byteString = '0' + byteString;
    txt += byteString;
  }
  return txt;
}

/**
 * Updates or appends a key-value row in the Settings sheet.
 */
function updateSettingRow(sheet, key, value) {
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][0] || '').trim() === key) {
        sheet.getRange(2 + i, 2).setValue(String(value));
        return;
      }
    }
  }
  sheet.appendRow([key, String(value)]);
}
`;

