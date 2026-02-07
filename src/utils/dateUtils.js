/**
 * Formats an ISO date string into a human-readable format
 * @param {string} dateString - ISO date string
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} - Formatted date
 */
export const formatDate = (dateString, includeTime = false) => {
	if (!dateString) return 'N/A';
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return dateString;

		const options = {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		};

		if (includeTime) {
			options.hour = '2-digit';
			options.minute = '2-digit';
		}

		return date.toLocaleDateString(undefined, options);
	} catch (error) {
		console.error('Error formatting date:', error);
		return dateString;
	}
};

/**
 * Returns a relative time string (e.g., "2 hours ago")
 * @param {string} dateString - ISO date string
 * @returns {string} - Relative time
 */
export const getRelativeTime = (dateString) => {
	if (!dateString) return '';
	try {
		const date = new Date(dateString);
		const now = new Date();
		const diffInSeconds = Math.floor((now - date) / 1000);

		if (diffInSeconds < 60) return 'Just now';
		if (diffInSeconds < 3600)
			return `${Math.floor(diffInSeconds / 60)}m ago`;
		if (diffInSeconds < 86400)
			return `${Math.floor(diffInSeconds / 3600)}h ago`;
		if (diffInSeconds < 604800)
			return `${Math.floor(diffInSeconds / 86400)}d ago`;

		return formatDate(dateString);
	} catch (error) {
		return '';
	}
};
