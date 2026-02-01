import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { arrowBack, logoGithub, globe } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
    selector: 'app-about',
    templateUrl: './about.page.html',
    styleUrls: ['./about.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule]
})
export class AboutPage implements OnInit {

    constructor(private navCtrl: NavController) {
        addIcons({ arrowBack, logoGithub, globe });
    }

    ngOnInit() { }

    goBack() {
        this.navCtrl.back();
    }

    openGithub() {
        window.open('https://github.com/arungrajvlm/gift-tracker', '_blank');
    }
}
