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

    // --- Cloud Sync ---

    private dirtyCountSubject = new BehaviorSubject<number>(0);
    public dirtyCount$ = this.dirtyCountSubject.asObservable();

    private syncStateSubject = new BehaviorSubject<'synced' | 'modified' | 'syncing' | 'error'>('synced');
    public syncState$ = this.syncStateSubject.asObservable();

    private readonly AUTO_SYNC_THRESHOLD = 5;

    // Inject Firestore & Auth
    private firestore = inject(Firestore);
    private auth = inject(Auth);

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

    // Helper for init to inject dependencies properly if needed or stick to constructor
}

import { inject } from '@angular/core';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

