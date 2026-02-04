import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { book, arrowBack, personAdd, gift, cloudUpload, search, create, cloudDone, cloud, sync, cloudOffline, heart, arrowForward } from 'ionicons/icons';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-tutorial',
    templateUrl: './tutorial.page.html',
    styleUrls: ['./tutorial.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, RouterModule]
})
export class TutorialPage {

    constructor(private navCtrl: NavController) {
        addIcons({ book, arrowBack, personAdd, gift, cloudUpload, search, create, cloudDone, cloud, sync, cloudOffline, heart, arrowForward });
    }
}
