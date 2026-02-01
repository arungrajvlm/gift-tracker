import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { gift } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs/operators';
import { Auth, authState } from '@angular/fire/auth';
import { inject } from '@angular/core';

@Component({
    selector: 'app-splash',
    templateUrl: './splash.page.html',
    styleUrls: ['./splash.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule]
})
export class SplashPage implements OnInit {
    private auth: Auth = inject(Auth);

    constructor(private navCtrl: NavController) {
        addIcons({ gift });
    }

    ngOnInit() {
        // Check auth state with a minimum delay to show the logo
        setTimeout(() => {
            authState(this.auth).pipe(take(1)).subscribe(user => {
                if (user) {
                    this.navCtrl.navigateRoot('/home', { animated: true, animationDirection: 'forward' });
                } else {
                    this.navCtrl.navigateRoot('/login', { animated: true, animationDirection: 'forward' });
                }
            });
        }, 1500); // 1.5s splash screen
    }
}
