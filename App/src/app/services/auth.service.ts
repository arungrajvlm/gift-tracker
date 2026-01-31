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

    login(provider: 'google' | 'apple') {
        // Mock Login
        const mockUser: User = {
            id: 'u1',
            name: 'Arun Graj',
            email: 'arun@example.com',
            avatar: 'https://ui-avatars.com/api/?name=Arun+Graj&background=random'
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mockUser));
        this.userSubject.next(mockUser);
    }

    logout() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.userSubject.next(null);
    }

    isAuthenticated(): boolean {
        return !!this.userSubject.value;
    }
}
