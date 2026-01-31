import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule]
})
export class LoginPage {

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    async login(provider: 'google' | 'apple') {
        // Simulate async auth
        // In real app, this would call Ionic Auth / Firebase
        this.authService.login(provider);

        // Navigate home
        this.router.navigate(['/home'], { replaceUrl: true });
    }

}
