/**
 * Gift Tracker Core Logic
 * Handles data persistence (localStorage), navigation, and shared state.
 */

const STORAGE_KEY = 'gift_tracker_data_v1';

// Initial Mock Data
const INITIAL_DATA = {
    contacts: [
        { id: 'c1', name: 'Alice Smith', avatarColor: 'linear-gradient(135deg, #FF6B6B, #EE5D5D)', initials: 'A' },
        { id: 'c2', name: 'Bob Johnson', avatarColor: 'linear-gradient(135deg, #4ADE80, #22C55E)', initials: 'B' },
        { id: 'c3', name: 'Charlie Brown', avatarColor: 'linear-gradient(135deg, #F472B6, #DB2777)', initials: 'C' },
        { id: 'c4', name: 'David Lee', avatarColor: 'linear-gradient(135deg, #60A5FA, #3B82F6)', initials: 'D' }
    ],
    gifts: [
        { id: 'g1', contactId: 'c1', type: 'given', item: 'Coffee Maker', date: '2026-01-29', note: 'Housewarming' },
        { id: 'g2', contactId: 'c2', type: 'received', item: '$100 Gift Card', date: '2026-01-24', note: 'Birthday' },
        { id: 'g3', contactId: 'c3', type: 'given', item: 'Birthday Cake', date: '2025-12-25', note: '' },
        { id: 'g4', contactId: 'c4', type: 'received', item: 'Books', date: '2025-11-30', note: 'Sci-fi collection' },
        { id: 'g5', contactId: 'c1', type: 'received', item: '$50 Wedding Gift', date: '2025-10-12', note: 'Thanks for coming to our wedding!' },
        { id: 'g6', contactId: 'c1', type: 'given', item: 'Espresso Machine', date: '2026-01-10', note: 'Happy Housewarming!' }
    ]
};

// Data Store
const Store = {
    getData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
            return INITIAL_DATA;
        }
        return JSON.parse(stored);
    },

    saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    getContacts() {
        const data = this.getData();
        const gifts = data.gifts;

        // Enrich contacts with last interaction
        return data.contacts.map(contact => {
            const contactGifts = gifts.filter(g => g.contactId === contact.id);
            // Sort by date desc
            contactGifts.sort((a, b) => new Date(b.date) - new Date(a.date));
            const lastGift = contactGifts[0];

            return {
                ...contact,
                lastGift: lastGift ? {
                    type: lastGift.type,
                    item: lastGift.item,
                    date: lastGift.date
                } : null
            };
        });
    },

    getContactDetails(id) {
        const data = this.getData();
        return data.contacts.find(c => c.id === id);
    },

    getGiftsForContact(contactId) {
        const data = this.getData();
        return data.gifts
            .filter(g => g.contactId === contactId)
            .sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest first for chat view
    },

    addGift(gift) {
        const data = this.getData();
        gift.id = 'g' + Date.now();
        data.gifts.push(gift);
        this.saveData(data);
    },

    addContact(contact) {
        const data = this.getData();
        contact.id = 'c' + Date.now();
        data.contacts.push(contact);
        this.saveData(data);
        return contact.id;
    },

    // Auth Methods
    isAuthenticated() {
        return !!localStorage.getItem('gift_tracker_user');
    },

    login(user) {
        localStorage.setItem('gift_tracker_user', JSON.stringify(user));
    },

    logout() {
        localStorage.removeItem('gift_tracker_user');
        window.location.href = 'login.html';
    },

    getUser() {
        return JSON.parse(localStorage.getItem('gift_tracker_user'));
    }
};

// Utilities
const Utils = {
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) return 'Today';
        if (diffDays <= 7) return `${diffDays}d ago`;
        if (diffDays <= 30) return `${Math.floor(diffDays / 7)}w ago`;
        if (diffDays <= 365) return `${Math.floor(diffDays / 30)}mo ago`;
        return date.toLocaleDateString();
    },

    formatDateFull(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
};
