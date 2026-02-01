import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { User } from '../models/data.models';
import { Auth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, user, authState, User as FirebaseUser } from '@angular/fire/auth';
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
        // Handle Redirect Result (useful for error handling)
        getRedirectResult(this.auth).then((result) => {
            if (result) {
                console.log('Redirect Login Success:', result.user);
            }
        }).catch((error) => {
            console.error('Redirect Login Error:', error);
        });

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
                await signInWithRedirect(this.auth, provider);
                // Redirect will happen, code execution stops here usually
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
