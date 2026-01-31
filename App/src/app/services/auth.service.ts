import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/data.models';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { isPlatform } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private userSubject = new BehaviorSubject<User | null>(null);
    public user$ = this.userSubject.asObservable();

    private STORAGE_KEY = 'gift_tracker_user';

    constructor() {
        this.init();
        // Web initialization for Google Auth
        if (!isPlatform('capacitor')) {
            GoogleAuth.initialize();
        }
    }

    private init() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            this.userSubject.next(JSON.parse(stored));
        }
    }

    async login(provider: 'google' | 'apple') {
        if (provider === 'google') {
            try {
                const googleUser = await GoogleAuth.signIn();
                const user: User = {
                    id: googleUser.id,
                    name: googleUser.name || googleUser.email,
                    email: googleUser.email,
                    avatar: googleUser.imageUrl
                };

                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
                this.userSubject.next(user);
            } catch (err) {
                console.error('Google Sign-In Error:', err);
                throw err; // Propagate to component
            }
        } else {
            // Mock Apple for now
            console.warn('Apple Auth not yet implemented');
        }
    }

    async logout() {
        await GoogleAuth.signOut();
        localStorage.removeItem(this.STORAGE_KEY);
        this.userSubject.next(null);
    }

    isAuthenticated(): boolean {
        return !!this.userSubject.value;
    }
}
