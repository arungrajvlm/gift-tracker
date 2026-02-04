import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { arrowBack, logoGithub, globe, book } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';

@Component({
    selector: 'app-about',
    templateUrl: './about.page.html',
    styleUrls: ['./about.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule]
})
export class AboutPage implements OnInit {
    appInfo: any;

    constructor(private navCtrl: NavController, private router: Router) {
        addIcons({ arrowBack, logoGithub, globe, book });
    }

    async ngOnInit() {
        try {
            this.appInfo = await App.getInfo();
        } catch (e) {
            console.warn('Could not get app info', e);
            this.appInfo = { version: '-.-.-', build: '0' }; // Fallback
        }
    }

    goBack() {
        this.navCtrl.back();
    }

    openGithub() {
        window.open('https://github.com/arungrajvlm/gift-tracker', '_blank');
    }

    openTutorial() {
        this.router.navigate(['/tutorial']);
    }
}
