import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Contact, Gift } from '../models/data.models';

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

    constructor() {
        this.init();
    }

    private init() {
        // Load data from Storage (Mock for now)
        const storedContacts = localStorage.getItem(this.CONTACTS_KEY);
        const storedGifts = localStorage.getItem(this.GIFTS_KEY);

        if (storedContacts) {
            this.contactsSubject.next(JSON.parse(storedContacts));
        } else {
            this.seedData();
        }

        if (storedGifts) {
            this.giftsSubject.next(JSON.parse(storedGifts));
        }
    }

    private seedData() {
        const mockContacts: Contact[] = [
            { id: '1', name: 'Sarah Johnson', initials: 'SJ', avatarColor: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }, // Indigo -> Violet
            { id: '2', name: 'Mike Chen', initials: 'MC', avatarColor: 'linear-gradient(135deg, #14b8a6, #2dd4bf)' }, // Teal -> Cyan
            { id: '3', name: 'Emma Lee', initials: 'EL', avatarColor: 'linear-gradient(135deg, #f43f5e, #fb7185)' }  // Rose -> Pink
        ];
        this.saveContacts(mockContacts);
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

    private saveContacts(contacts: Contact[]) {
        localStorage.setItem(this.CONTACTS_KEY, JSON.stringify(contacts));
        this.contactsSubject.next(contacts);
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

    private saveGifts(gifts: Gift[]) {
        localStorage.setItem(this.GIFTS_KEY, JSON.stringify(gifts));
        this.giftsSubject.next(gifts);
    }
}
