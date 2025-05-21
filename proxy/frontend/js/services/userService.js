export const userService = {
    /**
     * Store user information in session storage
     * @param {Object} userData - User data to store
     */
    setUserData(userData) {
        // Only store non-sensitive user data
        const safeUserData = {
            id: userData.id,
            username: userData.username,
            avatar: userData.avatar,
            bio: userData.bio,
            has_oauth: userData.has_oauth || false,
            created_at: userData.created_at
        };

        // Store as JSON string
        sessionStorage.setItem('user_data', JSON.stringify(safeUserData));
    },

    /**
     * Get stored user data
     * @returns {Object|null} User data or null if not available
     */
    getUserData() {
        const userData = sessionStorage.getItem('user_data');
        if (!userData) return null;

        try {
            return JSON.parse(userData);
        } catch (e) {
            console.error('Failed to parse user data:', e);
            return null;
        }
    },

    /**
     * Update specific user properties
     * @param {Object} updates - Properties to update
     */
    updateUserData(updates) {
        const userData = this.getUserData() || {};
        const updatedData = { ...userData, ...updates };
        this.setUserData(updatedData);
    },

    /**
     * Clear user data from storage
     */
    clearUserData() {
        sessionStorage.removeItem('user_data');
    },

    /**
     * Check if user data is available
     * @returns {boolean} True if user data exists
     */
    hasUserData() {
        return !!this.getUserData();
    }
};
