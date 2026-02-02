import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Contact, Gift } from '../models/data.models';
import { Storage } from '@ionic/storage-angular';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

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

    // --- Cloud Sync ---
    private dirtyCountSubject = new BehaviorSubject<number>(0);
    public dirtyCount$ = this.dirtyCountSubject.asObservable();

    private syncStateSubject = new BehaviorSubject<'synced' | 'modified' | 'syncing' | 'error'>('synced');
    public syncState$ = this.syncStateSubject.asObservable();

    private readonly AUTO_SYNC_THRESHOLD = 5;

    // Inject Firestore & Auth
    private firestore = inject(Firestore);
    private auth = inject(Auth);

    constructor(private storage: Storage, private http: HttpClient) {
        this.init();
    }

    // ... rest of init and basic CRUD ...

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
            this.saveContacts([], false);
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

    // --- Sync Methods ---

    async saveDataToCloud() {
        const user = this.auth.currentUser;
        if (!user) {
            console.warn('Cannot backup: No user logged in');
            return;
        }

        this.syncStateSubject.next('syncing');

        try {
            const backupData = {
                contacts: this.contactsSubject.value,
                gifts: this.giftsSubject.value,
                timestamp: new Date().toISOString(),
                device: 'android-app',
                version: '1.0'
            };

            const jsonString = JSON.stringify(backupData);
            const userDocRef = doc(this.firestore, `users/${user.uid}/backups/data`);

            // Save as a single "blob" string to save write costs (1 Write)
            await setDoc(userDocRef, {
                content: jsonString,
                updatedAt: new Date().toISOString(),
                recordCount: this.giftsSubject.value.length
            });

            this.dirtyCountSubject.next(0);
            this.syncStateSubject.next('synced');
            console.log('Backup successful');

        } catch (error) {
            console.error('Backup failed', error);
            this.syncStateSubject.next('error');
            throw error;
        }
    }

    async checkCloudBackup(): Promise<{ exists: boolean; date?: string; count?: number; version?: string } | null> {
        const user = this.auth.currentUser;
        if (!user) return null;

        try {
            const userDocRef = doc(this.firestore, `users/${user.uid}/backups/data`);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    exists: true,
                    date: data['updatedAt'],
                    count: data['recordCount'],
                    version: '1.0' // Can fetch from content if needed, but this is simpler
                };
            }
            return { exists: false };
        } catch (error) {
            console.error('Check backup failed', error);
            return null; // Treat error as no backup for safety, or handle UI side
        }
    }

    async restoreDataFromCloud() {
        const user = this.auth.currentUser;
        if (!user) return;

        this.syncStateSubject.next('syncing');

        try {
            const userDocRef = doc(this.firestore, `users/${user.uid}/backups/data`);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const content = JSON.parse(data['content']);

                if (content.contacts && content.gifts) {
                    // Restore
                    await this.saveContacts(content.contacts, false); // false = don't mark dirty
                    await this.saveGifts(content.gifts, false);
                    this.syncStateSubject.next('synced');
                    console.log('Restore successful');
                }
            } else {
                console.log('No backup found');
                this.syncStateSubject.next('synced');
            }
        } catch (error) {
            console.error('Restore failed', error);
            this.syncStateSubject.next('error');
        }
    }

    private async saveContacts(contacts: Contact[], markDirty = true) {
        await this.storage.set(this.CONTACTS_KEY, JSON.stringify(contacts));
        this.contactsSubject.next(contacts);
        if (markDirty) this.incrementDirty();
    }

    private async saveGifts(gifts: Gift[], markDirty = true) {
        await this.storage.set(this.GIFTS_KEY, JSON.stringify(gifts));
        this.giftsSubject.next(gifts);
        if (markDirty) this.incrementDirty();
    }

    private incrementDirty() {
        const current = this.dirtyCountSubject.value + 1;
        this.dirtyCountSubject.next(current);
        this.syncStateSubject.next('modified');

        if (current >= this.AUTO_SYNC_THRESHOLD) {
            console.log('Auto-Sync threshold reached. Backing up...');
            this.saveDataToCloud();
        }
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
            for (let i = 1; i <= 5; i++) {
                const key = `rcvd_amt${i}` as keyof typeof item;
                const amountStr = item[key] as string;
                if (amountStr && parseInt(amountStr) > 0) {
                    newGifts.push({
                        id: this.generateId(),
                        contactId: cid,
                        type: 'received',
                        item: amountStr,
                        price: parseInt(amountStr),
                        date: new Date().toISOString(),
                        note: item.notes
                    });
                }
            }
            for (let i = 1; i <= 5; i++) {
                const key = `paid_amt${i}` as keyof typeof item;
                const amountStr = item[key] as string;
                if (amountStr && parseInt(amountStr) > 0) {
                    newGifts.push({
                        id: this.generateId(),
                        contactId: cid,
                        type: 'given',
                        item: amountStr,
                        price: parseInt(amountStr),
                        date: new Date().toISOString(),
                        note: item.notes
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
