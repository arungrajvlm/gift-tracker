import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { User } from '../models/data.models';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, user, authState, User as FirebaseUser, signInWithCredential } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

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
        // Initialize Native Google Auth (runs only on native)
        if (Capacitor.isNativePlatform()) {
            GoogleAuth.initialize();
        }

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
                if (Capacitor.isNativePlatform()) {
                    // NATIVE: Use System Google Dialog (No Chrome Tab)
                    const googleUser = await GoogleAuth.signIn();
                    const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
                    await signInWithCredential(this.auth, credential);
                } else {
                    // WEB: Use Popup
                    const provider = new GoogleAuthProvider();
                    await signInWithPopup(this.auth, provider);
                }
            } catch (error: any) {
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
        if (Capacitor.isNativePlatform()) {
            await GoogleAuth.signOut();
        }
    }

    isAuthenticated(): boolean {
        return !!this.userSubject.value;
    }
}
