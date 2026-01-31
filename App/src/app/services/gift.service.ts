import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Contact, Gift } from '../models/data.models';
import { Storage } from '@ionic/storage-angular';

@Injectable({
    providedIn: 'root'
})
export class GiftService {
    private contactsSubject = new BehaviorSubject<Contact[]>([]);
    public contacts$ = this.contactsSubject.asObservable();

    private giftsSubject = new BehaviorSubject<Gift[]>([]);
    public gifts$ = this.giftsSubject.asObservable();

    private readonly CONTACTS_KEY = 'ionic_demo_contacts';
    private readonly GIFTS_KEY = 'ionic_demo_gifts';

    constructor(private storage: Storage) {
        this.init();
    }

    private async init() {
        const storage = await this.storage.create();
        this.storage = storage;

        // Load data from Storage
        const storedContacts = await this.storage.get(this.CONTACTS_KEY);
        const storedGifts = await this.storage.get(this.GIFTS_KEY);

        if (storedContacts) {
            this.contactsSubject.next(JSON.parse(storedContacts));
        }

        if (storedGifts) {
            this.giftsSubject.next(JSON.parse(storedGifts));
        }
    }

    // --- Contacts ---

    getContactsWithLastGift(): Observable<Contact[]> {
        return this.gifts$.pipe(
            map(gifts => {
                const contacts = this.contactsSubject.value;
                return contacts.map(contact => {
                    const contactGifts = gifts
                        .filter(g => g.contactId === contact.id)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    const last = contactGifts[0];
                    return {
                        ...contact,
                        lastGift: last ? { type: last.type, item: last.item, date: last.date } : undefined
                    };
                });
            })
        );
    }

    getContact(id: string): Contact | undefined {
        return this.contactsSubject.value.find(c => c.id === id);
    }

    addContact(contact: Omit<Contact, 'id'>): string {
        const id = Date.now().toString();
        const newContact = { ...contact, id };
        const current = this.contactsSubject.value;

        this.saveContacts([...current, newContact]);
        return id;
    }

    private async saveContacts(contacts: Contact[]) {
        await this.storage.set(this.CONTACTS_KEY, JSON.stringify(contacts));
        this.contactsSubject.next(contacts);
    }

    updateContactName(id: string, name: string) {
        const contacts = this.contactsSubject.value;
        const contactIndex = contacts.findIndex(c => c.id === id);
        if (contactIndex > -1) {
            // Update name and regenerate initials
            const updatedContact = { ...contacts[contactIndex], name, initials: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() };
            contacts[contactIndex] = updatedContact;
            this.saveContacts(contacts);
        }
    }

    // --- Gifts ---

    getGiftsForContact(contactId: string): Observable<Gift[]> {
        return this.gifts$.pipe(
            map(gifts => gifts
                .filter(g => g.contactId === contactId)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Oldest first
            )
        );
    }

    addGift(gift: Omit<Gift, 'id'>) {
        const id = Date.now().toString();
        const newGift = { ...gift, id };
        const current = this.giftsSubject.value;

        this.saveGifts([...current, newGift]);
    }

    private async saveGifts(gifts: Gift[]) {
        await this.storage.set(this.GIFTS_KEY, JSON.stringify(gifts));
        this.giftsSubject.next(gifts);
    }
    private generateId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async seedHighVolumeData() {
        console.log('Starting seed...');
        const firstNames = [
            'അരുൺ', 'വിപിൻ', 'രാഹുൽ', 'അഞ്ജലി', 'ദിവ്യ', 'രമ്യ', 'സന്ദീപ്',
            'നിതിൻ', 'കാവ്യ', 'ലക്ഷ്മി', 'ശരത്', 'അശ്വിൻ', 'മഞ്ജു', 'ബിജു',
            'സുരേഷ്', 'രമേശ്', 'പ്രിയ', 'സ്നേഹ', 'അഖിൽ', 'വിഷ്ണു'
        ];

        const lastNames = [
            'നായർ', 'മേനോൻ', 'പിള്ള', 'വാര്യർ', 'കുമാർ', 'രാജ്',
            'വർമ്മ', 'ദേവി', 'നമ്പ്യാർ', 'കുറുപ്പ്', 'മാത്യു', 'ജോസഫ്'
        ];

        const gifts = ['Plex', 'Netflix', 'Lunch', 'Coffee', 'Book', 'Shirt', 'Watch', 'Pen', 'Cake'];

        const newContacts: Contact[] = [];
        const newGifts: Gift[] = [];

        // Generate 7000 contacts
        for (let i = 0; i < 7000; i++) {
            const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const fullName = `${fName} ${lName} ${i}`; // Add index to ensure uniqueness if needed

            const cid = this.generateId();

            // Random Gradient
            const colors = [['#6366f1', '#8b5cf6'], ['#14b8a6', '#2dd4bf'], ['#f43f5e', '#fb7185'], ['#f59e0b', '#fbbf24'], ['#10b981', '#34d399']];
            const rand = colors[Math.floor(Math.random() * colors.length)];
            const avatarColor = `linear-gradient(135deg, ${rand[0]}, ${rand[1]})`;

            // Simple initial logic for Malayalam (take first char)
            const initials = fName.substring(0, 1);

            newContacts.push({
                id: cid,
                name: fullName,
                initials: initials,
                avatarColor
            });

            // Add 2 gifts per person
            for (let j = 0; j < 2; j++) {
                newGifts.push({
                    id: this.generateId(),
                    contactId: cid,
                    type: Math.random() > 0.5 ? 'given' : 'received',
                    item: gifts[Math.floor(Math.random() * gifts.length)],
                    date: new Date().toISOString(),
                    price: Math.floor(Math.random() * 100)
                });
            }
        }

        // Batch update
        const currentContacts = this.contactsSubject.value;
        const currentGifts = this.giftsSubject.value;

        const allContacts = [...currentContacts, ...newContacts];
        const allGifts = [...currentGifts, ...newGifts];

        try {
            await this.saveContacts(allContacts);
            await this.saveGifts(allGifts);
            console.log(`Seeded ${newContacts.length} contacts and ${newGifts.length} gifts.`);
            alert('Seeding Complete! Check console/performance.');
        } catch (e) {
            console.error('Storage Error', e);
            alert('Failed to seed: Storage Error');
        }
    }
}
