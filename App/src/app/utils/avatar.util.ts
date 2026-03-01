// 16 Premium gradients designed for dark mode interfaces with white text
export const PREMIUM_AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #f43f5e, #fb7185)', // Rose
    'linear-gradient(135deg, #8b5cf6, #a78bfa)', // Violet
    'linear-gradient(135deg, #3b82f6, #60a5fa)', // Blue
    'linear-gradient(135deg, #10b981, #34d399)', // Emerald
    'linear-gradient(135deg, #f59e0b, #fbbf24)', // Amber
    'linear-gradient(135deg, #14b8a6, #2dd4bf)', // Teal
    'linear-gradient(135deg, #ec4899, #f472b6)', // Pink
    'linear-gradient(135deg, #6366f1, #818cf8)', // Indigo
    'linear-gradient(135deg, #ea580c, #f97316)', // Orange
    'linear-gradient(135deg, #06b6d4, #22d3ee)', // Cyan
    'linear-gradient(135deg, #84cc16, #a3e635)', // Lime
    'linear-gradient(135deg, #d946ef, #e879f9)', // Fuchsia
    'linear-gradient(135deg, #0ea5e9, #38bdf8)', // Light Blue  
    'linear-gradient(135deg, #b45309, #d97706)', // Amber Dark
    'linear-gradient(135deg, #4338ca, #4f46e5)', // Indigo Dark
    'linear-gradient(135deg, #be123c, #e11d48)'  // Rose Dark
];

/**
 * Deterministically generates an avatar gradient based on the person's name string hashes.
 * It will always map the same name to the exact same gradient.
 */
export function getAvatarColorFromName(name: string): string {
    if (!name || name.trim() === '') {
        return PREMIUM_AVATAR_GRADIENTS[0];
    }

    const trimmedName = name.trim();
    let hash = 0;

    // Calculate string hash code
    for (let i = 0; i < trimmedName.length; i++) {
        const char = trimmedName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Return positive absolute value mod the length of array
    const index = Math.abs(hash) % PREMIUM_AVATAR_GRADIENTS.length;
    return PREMIUM_AVATAR_GRADIENTS[index];
}
