import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Contact, Gift } from '../models/data.models';
import { Storage } from '@ionic/storage-angular';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

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

    constructor(private storage: Storage, private http: HttpClient) {
        this.init();
    }
    // ... (rest of methods until seedCustomData)


    private async init() {
        const storage = await this.storage.create();
        this.storage = storage;

        // Load data from Storage
        const storedContacts = await this.storage.get(this.CONTACTS_KEY);
        const storedGifts = await this.storage.get(this.GIFTS_KEY);

        if (storedContacts) {
            this.contactsSubject.next(JSON.parse(storedContacts));
        } else {
            // Start fresh for new users
            this.saveContacts([]);
        }

        if (storedGifts) {
            this.giftsSubject.next(JSON.parse(storedGifts));
        }
    }

    // --- Contacts ---

    getContactsWithLastGift(): Observable<Contact[]> {
        return combineLatest([this.contacts$, this.gifts$]).pipe(
            map(([contacts, gifts]) => {
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

    deleteContact(id: string) {
        const contacts = this.contactsSubject.value.filter(c => c.id !== id);
        const gifts = this.giftsSubject.value.filter(g => g.contactId !== id);

        this.saveContacts(contacts);
        this.saveGifts(gifts);
    }

    updateContactName(id: string, name: string) {
        const contacts = this.contactsSubject.value;
        const contactIndex = contacts.findIndex(c => c.id === id);
        if (contactIndex > -1) {
            // Update name and regenerate initials
            const trimmedName = name.trim();
            const updatedContact = {
                ...contacts[contactIndex],
                name: trimmedName,
                initials: trimmedName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            };
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

    updateGift(gift: Gift) {
        const gifts = this.giftsSubject.value;
        const index = gifts.findIndex(g => g.id === gift.id);
        if (index > -1) {
            gifts[index] = gift;
            this.saveGifts(gifts);
        }
    }

    getAllGifts(): Observable<Gift[]> {
        return this.gifts$;
    }

    deleteGift(id: string) {
        const gifts = this.giftsSubject.value.filter(g => g.id !== id);
        this.saveGifts(gifts);
    }

    private async saveGifts(gifts: Gift[]) {
        await this.storage.set(this.GIFTS_KEY, JSON.stringify(gifts));
        this.giftsSubject.next(gifts);
    }
    private generateId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async seedCustomData() {
        console.log('Seeding Custom Data from Remote...');

        let response: any = null;
        try {
            response = await firstValueFrom(this.http.get<any>(environment.seedUrl));
        } catch (err: any) {
            console.error('Failed to fetch seed data', err);
            const errorMessage = err.message || JSON.stringify(err);
            const status = err.status || 'Unknown';
            alert(`Failed to download seed data.\nURL: ${environment.seedUrl}\nStatus: ${status}\nError: ${errorMessage}`);
            return;
        }

        const rawData = Array.isArray(response) ? response : (response.data || []);
        console.log(`Fetched ${rawData.length} items from remote.`);

        const newContacts: Contact[] = [];
        const newGifts: Gift[] = [];

        for (const item of rawData) {
            // Skip if name is empty
            if (!item.person_full_name || !item.person_full_name.trim()) {
                continue;
            }
            const cid = this.generateId();

            // Generate Avatar Color
            const colors = [['#6366f1', '#8b5cf6'], ['#14b8a6', '#2dd4bf'], ['#f43f5e', '#fb7185'], ['#f59e0b', '#fbbf24'], ['#10b981', '#34d399']];
            const rand = colors[Math.floor(Math.random() * colors.length)];
            const avatarColor = `linear-gradient(135deg, ${rand[0]}, ${rand[1]})`;

            // Initials
            const trimmedName = item.person_full_name.trim();
            const initials = trimmedName.substring(0, 1).toUpperCase();

            newContacts.push({
                id: cid,
                name: trimmedName,
                initials: initials,
                avatarColor
            });

            // Parse Gifts
            // Parse Gifts
            // Received
            for (let i = 1; i <= 5; i++) {
                const key = `rcvd_amt${i}` as keyof typeof item;
                const amountStr = item[key] as string;
                // Ignore if empty, null, or "000" (value is 0)
                if (amountStr && parseInt(amountStr) > 0) {
                    newGifts.push({
                        id: this.generateId(),
                        contactId: cid,
                        type: 'received',
                        item: amountStr, // Gift Name = Amount
                        price: parseInt(amountStr),
                        date: new Date().toISOString(),
                        note: item.notes // Note = JSON Note
                    });
                }
            }

            // Given (Paid)
            for (let i = 1; i <= 5; i++) {
                const key = `paid_amt${i}` as keyof typeof item;
                const amountStr = item[key] as string;
                // Ignore if empty, null, or "000" (value is 0)
                if (amountStr && parseInt(amountStr) > 0) {
                    newGifts.push({
                        id: this.generateId(),
                        contactId: cid,
                        type: 'given',
                        item: amountStr, // Gift Name = Amount
                        price: parseInt(amountStr),
                        date: new Date().toISOString(),
                        note: item.notes // Note = JSON Note
                    });
                }
            }
        }

        try {
            await this.saveContacts(newContacts);
            await this.saveGifts(newGifts);
            console.log(`Seeded ${newContacts.length} contacts and ${newGifts.length} gifts from custom JSON.`);
        } catch (e) {
            console.error('Seeding Error', e);
        }
    }
}
