import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { book, arrowBack, personAdd, gift, cloudUpload, search, create, cloudDone, cloud, sync, cloudOffline, heart } from 'ionicons/icons';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-tutorial',
    templateUrl: './tutorial.page.html',
    styleUrls: ['./tutorial.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, RouterModule]
})
export class TutorialPage {

    constructor() {
        addIcons({ book, arrowBack, personAdd, gift, cloudUpload, search, create, cloudDone, cloud, sync, cloudOffline, heart });
    }
}
