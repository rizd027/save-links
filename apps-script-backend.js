/**
 * SaveLinks - Professional Column-Based Backend
 * 
 * Version: 1.2
 * Features:
 * - SHA-256 Password Hashing.
 * - Human-Readable Columns (No more JSON blobs).
 * - Automatic Sheet Initialization.
 * - Dedicated sheet per user.
 * - Profile and Email update support.
 */

const USERS_SHEET_NAME = 'Users';

// Schema mapping (Column Index -> Property)
const SCHEMA = [
    'TYPE',           // 0
    'ID',             // 1
    'TITLE_NAME',     // 2
    'URL',            // 3
    'DESCRIPTION',    // 4
    'TAGS',           // 5 (Joined by comma)
    'ICON',           // 6
    'COLOR',          // 7
    'COLLECTION_ID',  // 8
    'IS_FAV',         // 9 (TRUE/FALSE)
    'IS_PRIV',        // 10 (TRUE/FALSE)
    'CLICKS',         // 11
    'LINK_COUNT',     // 12
    'CREATED_AT',     // 13
    'UPDATED_AT'      // 14
];

/**
 * Main entry point for POST requests
 */
function doPost(e) {
    try {
        if (!e || !e.postData || !e.postData.contents) return createJsonResponse(false, 'No data received');

        const data = JSON.parse(e.postData.contents);
        const ss = SpreadsheetApp.getActiveSpreadsheet();

        // Auth Actions
        if (data.action === 'register') return register(ss, data);
        if (data.action === 'login') return login(ss, data);
        if (data.action === 'updateEmail') return updateEmail(ss, data);
        if (data.action === 'updateProfile') return updateProfile(ss, data);
        if (data.action === 'requestResetCode') return requestResetCode(ss, data);
        if (data.action === 'resetPassword') return resetPassword(ss, data);

        // Data Actions
        const email = data.email || data.oldEmail;
        if (!email) return createJsonResponse(false, 'Email required');

        const userSheet = ensureUserSheet(ss, email);

        if (data.action === 'getData') {
            return getUserData(userSheet);
        } else if (data.action === 'saveData') {
            return saveUserData(userSheet, data.links, data.collections, data.config);
        }

        return createJsonResponse(false, 'Unknown operation');
    } catch (error) {
        return createJsonResponse(false, 'Server Error: ' + error.toString());
    }
}

/**
 * Fetch data and reconstruct objects from columns
 */
function getUserData(sheet) {
    const range = sheet.getDataRange();
    if (range.getLastRow() <= 1) {
        return createJsonResponse(true, null, null, { links: [], collections: [] });
    }

    const values = range.getValues();
    const links = [];
    const collections = [];
    let config = {};

    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const type = row[0];

        if (type === 'LINK') {
            links.push({
                id: row[1],
                title: row[2],
                url: row[3],
                description: row[4],
                tags: row[5] ? row[5].toString().split(',').map(t => t.trim()) : [],
                favicon: row[6],
                collectionId: row[8] || null,
                isFavorite: row[9] === true || row[9] === 'TRUE',
                isPrivate: row[10] === true || row[10] === 'TRUE',
                clickCount: Number(row[11]) || 0,
                createdAt: row[13],
                updatedAt: row[14]
            });
        } else if (type === 'COLLECTION') {
            collections.push({
                id: row[1],
                name: row[2],
                description: row[4],
                icon: row[6],
                color: row[7],
                linkCount: Number(row[12]) || 0,
                createdAt: row[13],
                parentId: row[8] || null,
                isPrivate: row[10] === true || row[10] === 'TRUE'
            });
        } else if (type === 'CONFIG') {
            try {
                config = JSON.parse(row[2]);
            } catch (e) { }
        }
    }

    return createJsonResponse(true, null, null, { links, collections, config });
}

/**
 * Save data by mapping properties to columns
 */
function saveUserData(sheet, links, collections, config) {
    if (!Array.isArray(links) || !Array.isArray(collections)) {
        return createJsonResponse(false, 'Invalid data format');
    }

    // Clear all (from row 2 down)
    if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, SCHEMA.length).clearContent();
    }

    const rows = [];
    const now = new Date().toISOString();

    // Map Config
    if (config) {
        const configRow = new Array(SCHEMA.length).fill('');
        configRow[0] = 'CONFIG';
        configRow[2] = JSON.stringify(config);
        configRow[13] = now;
        rows.push(configRow);
    }

    // Map Collections
    collections.forEach(c => {
        const row = new Array(SCHEMA.length).fill('');
        row[0] = 'COLLECTION';
        row[1] = c.id;
        row[2] = c.name;
        row[4] = c.description;
        row[6] = c.icon;
        row[7] = c.color;
        row[8] = c.parentId || null;
        row[10] = c.isPrivate;
        row[12] = c.linkCount;
        row[13] = c.createdAt;
        rows.push(row);
    });

    // Map Links
    links.forEach(l => {
        const row = new Array(SCHEMA.length).fill('');
        row[0] = 'LINK';
        row[1] = l.id;
        row[2] = l.title;
        row[3] = l.url;
        row[4] = l.description;
        row[5] = Array.isArray(l.tags) ? l.tags.join(', ') : '';
        row[6] = l.favicon;
        row[8] = l.collectionId;
        row[9] = l.isFavorite;
        row[10] = l.isPrivate;
        row[11] = l.clickCount;
        row[13] = l.createdAt;
        row[14] = l.updatedAt;
        rows.push(row);
    });

    if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, SCHEMA.length).setValues(rows);
    }

    return createJsonResponse(true, 'Database updated successfully');
}

/**
 * Standard Multi-User Helpers
 */
function ensureUserSheet(ss, email) {
    const sanitizedEmail = email.replace(/[\\\/\[\]\?\*:]/g, '_').substring(0, 50);
    const sheetName = 'data_' + sanitizedEmail;
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(SCHEMA);
        sheet.getRange(1, 1, 1, SCHEMA.length).setFontWeight('bold').setBackground('#f3f3f3');
        sheet.setFrozenRows(1);
    }
    return sheet;
}

/**
 * Update user email and rename their data sheet
 */
function updateEmail(ss, data) {
    const oldEmail = data.oldEmail || data.email;
    const { newEmail } = data;
    if (!oldEmail || !newEmail) return createJsonResponse(false, 'Missing email information');

    const usersSheet = ensureMasterUsersSheet(ss);
    const usersData = usersSheet.getDataRange().getValues();
    let userRowIndex = -1;

    // Check if new email already exists and find old email row
    for (let i = 1; i < usersData.length; i++) {
        if (usersData[i][1] === newEmail) return createJsonResponse(false, 'Brand new email is already in use by another account');
        if (usersData[i][1] === oldEmail) userRowIndex = i + 1;
    }

    if (userRowIndex === -1) return createJsonResponse(false, 'Original user not found');

    // Update the master sheet
    usersSheet.getRange(userRowIndex, 2).setValue(newEmail);

    // Sanitize names for sheet renaming
    const oldSanitized = oldEmail.replace(/[\\\/\[\]\?\*:]/g, '_').substring(0, 50);
    const newSanitized = newEmail.replace(/[\\\/\[\]\?\*:]/g, '_').substring(0, 50);

    const oldSheetName = 'data_' + oldSanitized;
    const newSheetName = 'data_' + newSanitized;

    const oldSheet = ss.getSheetByName(oldSheetName);
    if (oldSheet) {
        oldSheet.setName(newSheetName);
    } else {
        // Create new if somehow missing
        ensureUserSheet(ss, newEmail);
    }

    return createJsonResponse(true, 'Email updated successfully');
}

/**
 * Update user profile details (name, avatar)
 */
function updateProfile(ss, data) {
    const { email, name, avatar } = data;
    if (!email) return createJsonResponse(false, 'User email required');

    const usersSheet = ensureMasterUsersSheet(ss);
    const usersData = usersSheet.getDataRange().getValues();
    const headers = usersData[0];
    let userRowIndex = -1;

    for (let i = 1; i < usersData.length; i++) {
        if (usersData[i][1] === email) {
            userRowIndex = i + 1;
            break;
        }
    }

    if (userRowIndex === -1) return createJsonResponse(false, 'User not found');

    // Update Name
    if (name) usersSheet.getRange(userRowIndex, 1).setValue(name);

    // Update Avatar (Handle column dynamic creation)
    let avatarCol = headers.indexOf('avatar') + 1;
    if (avatarCol === 0) {
        avatarCol = headers.length + 1;
        usersSheet.getRange(1, avatarCol).setValue('avatar').setFontWeight('bold');
    }
    if (avatar) usersSheet.getRange(userRowIndex, avatarCol).setValue(avatar);

    return createJsonResponse(true, 'Profile updated successfully');
}

/**
 * Request a 6-digit OTP for password reset
 */
function requestResetCode(ss, data) {
    const { email } = data;
    if (!email) return createJsonResponse(false, 'Email required');

    const sheet = ensureMasterUsersSheet(ss);
    const usersData = sheet.getDataRange().getValues();
    const headers = usersData[0];
    let userRowIndex = -1;

    for (let i = 1; i < usersData.length; i++) {
        if (usersData[i][1].toLowerCase() === email.toLowerCase()) {
            userRowIndex = i + 1;
            break;
        }
    }

    if (userRowIndex === -1) return createJsonResponse(false, 'Email not registered');

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(new Date().getTime() + 15 * 60000).toISOString(); // 15 mins

    // Ensure columns exist
    let codeCol = headers.indexOf('resetCode') + 1;
    let expiryCol = headers.indexOf('resetExpiry') + 1;

    if (codeCol === 0) {
        codeCol = headers.length + 1;
        sheet.getRange(1, codeCol).setValue('resetCode').setFontWeight('bold');
        expiryCol = headers.length + 2;
        sheet.getRange(1, expiryCol).setValue('resetExpiry').setFontWeight('bold');
    }

    sheet.getRange(userRowIndex, codeCol).setValue(code);
    sheet.getRange(userRowIndex, expiryCol).setValue(expiry);

    // Send Email
    try {
        MailApp.sendEmail({
            to: email,
            subject: 'SaveLinks - Password Reset Verification Code',
            htmlBody: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset for your SaveLinks account.</p>
                    <p>Your verification code is:</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6366f1; padding: 15px; background: #f0f1ff; border-radius: 8px; text-align: center; margin: 20px 0;">
                        ${code}
                    </div>
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                </div>
            `
        });
        return createJsonResponse(true, 'Verification code sent to ' + email);
    } catch (e) {
        return createJsonResponse(false, 'Failed to send email: ' + e.toString());
    }
}

/**
 * Verify OTP and reset password
 */
function resetPassword(ss, data) {
    const { email, code, newPassword } = data;
    if (!email || !code || !newPassword) return createJsonResponse(false, 'Missing required fields');

    const sheet = ensureMasterUsersSheet(ss);
    const usersData = sheet.getDataRange().getValues();
    const headers = usersData[0];
    let userRowIndex = -1;

    for (let i = 1; i < usersData.length; i++) {
        if (usersData[i][1].toLowerCase() === email.toLowerCase()) {
            userRowIndex = i + 1;
            break;
        }
    }

    if (userRowIndex === -1) return createJsonResponse(false, 'User not found');

    const codeCol = headers.indexOf('resetCode');
    const expiryCol = headers.indexOf('resetExpiry');

    if (codeCol === -1 || !usersData[userRowIndex - 1][codeCol]) {
        return createJsonResponse(false, 'No reset request found for this user');
    }

    const savedCode = usersData[userRowIndex - 1][codeCol].toString();
    const expiry = new Date(usersData[userRowIndex - 1][expiryCol]);

    if (savedCode !== code) return createJsonResponse(false, 'Invalid verification code');
    if (new Date() > expiry) return createJsonResponse(false, 'Verification code has expired');

    // Update Password
    const hashedPw = hashPassword(newPassword);
    sheet.getRange(userRowIndex, 3).setValue(hashedPw); // Column C is password

    // Clear reset data
    sheet.getRange(userRowIndex, codeCol + 1).setValue('');
    sheet.getRange(userRowIndex, expiryCol + 1).setValue('');

    return createJsonResponse(true, 'Password has been reset successfully');
}

function register(ss, data) {
    const sheet = ensureMasterUsersSheet(ss);
    const { name, email, password } = data;
    if (!name || !email || !password) return createJsonResponse(false, 'Missing fields');

    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) if (rows[i][1] === email) return createJsonResponse(false, 'Email exists');

    const hashedPw = hashPassword(password);
    sheet.appendRow([name, email, hashedPw, new Date().toISOString()]);
    ensureUserSheet(ss, email);
    return createJsonResponse(true, 'Welcome!', { id: email, name, email });
}

function login(ss, data) {
    const sheet = ensureMasterUsersSheet(ss);
    const { email, password } = data;
    const hashedInput = hashPassword(password);
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const avatarCol = headers.indexOf('avatar');

    for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === email && rows[i][2] === hashedInput) {
            const user = { id: email, name: rows[i][0], email: rows[i][1] };
            if (avatarCol !== -1 && rows[i][avatarCol]) {
                user.avatar = rows[i][avatarCol];
            }
            return createJsonResponse(true, 'Success', user);
        }
    }
    return createJsonResponse(false, 'Invalid credentials');
}

function ensureMasterUsersSheet(ss) {
    let sheet = ss.getSheetByName(USERS_SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(USERS_SHEET_NAME);
        sheet.appendRow(['name', 'email', 'password', 'createdAt', 'avatar']);
        sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }
    return sheet;
}

function hashPassword(password) {
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
    return digest.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function createJsonResponse(success, message, user, data) {
    const res = { success };
    if (message) res.message = message;
    if (user) res.user = user;
    if (data) res.data = data;
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
    return ContentService.createTextOutput('SaveLinks API v1.2: Column Mode active').setMimeType(ContentService.MimeType.TEXT);
}
