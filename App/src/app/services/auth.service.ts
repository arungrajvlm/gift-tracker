import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { User } from '../models/data.models';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, user, authState, User as FirebaseUser } from '@angular/fire/auth';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth: Auth = inject(Auth);

    // Internal subject to keep compat with existing app code
    private userSubject = new BehaviorSubject<User | null>(null);
    public user$ = this.userSubject.asObservable();

    private authSubscription: Subscription;

    constructor() {
        // Subscribe to Firebase Auth State changes
        this.authSubscription = authState(this.auth).subscribe((firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const user: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email || 'User',
                    email: firebaseUser.email || '',
                    avatar: firebaseUser.photoURL || undefined
                };
                this.userSubject.next(user);
            } else {
                this.userSubject.next(null);
            }
        });
    }

    async login(provider: 'google' | 'apple') {
        if (provider === 'google') {
            try {
                const provider = new GoogleAuthProvider();
                await signInWithPopup(this.auth, provider);
                // State update handled by authState subscription
            } catch (error) {
                console.error('Firebase Login Error:', error);
                throw error;
            }
        } else {
            console.warn('Apple Auth not yet implemented');
            alert('Apple Sign-In coming soon!');
        }
    }

    async logout() {
        await signOut(this.auth);
        // userSubject will be updated by authState subscription
    }

    isAuthenticated(): boolean {
        return !!this.userSubject.value;
    }
}
