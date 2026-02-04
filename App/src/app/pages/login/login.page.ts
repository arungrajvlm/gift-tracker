import { Component, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    imports: [IonicModule, CommonModule, RouterModule]
})
export class LoginPage {
    public isDev = isDevMode();
    public isLoading = false;

    constructor(
        private authService: AuthService,
        private router: Router,
        private alertController: AlertController
    ) { }

    async login(provider: 'google' | 'apple') {
        if (!navigator.onLine) {
            const alert = await this.alertController.create({
                header: 'No Internet Connection',
                message: 'Please check your internet settings and try again.',
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        this.isLoading = true;
        try {
            await this.authService.login(provider);
            this.router.navigate(['/welcome'], { replaceUrl: true });
        } catch (error: any) {
            console.error('Login failed', error);

            let message = 'An unexpected error occurred. Please try again.';

            // Map common Firebase errors to user-friendly messages
            if (error.code === 'auth/popup-closed-by-user' || error.message?.includes('closed')) {
                message = 'Sign-in cancelled.';
            } else if (error.code === 'auth/network-request-failed') {
                message = 'Network error. Please check your connection.';
            } else if (error.code === 'auth/invalid-credential') {
                message = 'Invalid credentials. Please try again.';
            } else if (error.message) {
                // Fallback to error message if present but cleaner
                message = error.message.replace('Firebase:', '').trim();
            }

            const alert = await this.alertController.create({
                header: 'Sign In Failed',
                message: message,
                buttons: ['OK']
            });
            await alert.present();
        } finally {
            this.isLoading = false;
        }
    }



}
