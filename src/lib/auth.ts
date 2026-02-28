export async function fetchFromAppsScript(data: any) {
    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Auth API Error:', error);
        throw error;
    }
}

/**
 * Fetch links and collections for a specific user
 */
export async function getUserData(email: string) {
    return await fetchFromAppsScript({ action: 'getData', email });
}

/**
 * Save links and collections for a specific user
 */
export async function saveUserData(email: string, links: any[], collections: any[], config?: any) {
    return await fetchFromAppsScript({ action: 'saveData', email, links, collections, config });
}
/**
 * Request a password reset code
 */
export async function requestPasswordReset(email: string) {
    return await fetchFromAppsScript({ action: 'requestResetCode', email });
}

/**
 * Verify code and reset password
 */
export async function verifyAndResetPassword(email: string, code: string, newPassword: string) {
    return await fetchFromAppsScript({ action: 'resetPassword', email, code, newPassword });
}
