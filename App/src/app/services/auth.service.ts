import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/data.models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private userSubject = new BehaviorSubject<User | null>(null);
    public user$ = this.userSubject.asObservable();

    private STORAGE_KEY = 'gift_tracker_user';

    constructor() {
        this.init();
    }

    private init() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            this.userSubject.next(JSON.parse(stored));
        }
    }

    async login(provider: 'google' | 'apple') {
        if (provider === 'google') {
            console.warn('Firebase Auth pending implementation');
            // Mock behavior or throw error until Firebase is ready
            throw new Error('Switching to Firebase. Please wait for the new update.');
        } else {
            console.warn('Apple Auth not yet implemented');
        }
    }

    async logout() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.userSubject.next(null);
    }

    isAuthenticated(): boolean {
        return !!this.userSubject.value;
    }
}
