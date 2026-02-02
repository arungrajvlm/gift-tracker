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

    constructor(
        private authService: AuthService,
        private router: Router,
        private alertController: AlertController
    ) { }

    async login(provider: 'google' | 'apple') {
        try {
            await this.authService.login(provider);
            this.router.navigate(['/home'], { replaceUrl: true });
        } catch (error: any) {
            console.error('Login failed', error);

            const alert = await this.alertController.create({
                header: 'Sign In Failed',
                message: 'Could not sign in with Google. Please check your network or configuration. ' + (error.error?.message || error.message || JSON.stringify(error)),
                buttons: ['OK']
            });
            await alert.present();
        }
    }



}
