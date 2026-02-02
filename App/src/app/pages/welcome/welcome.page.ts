import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { GiftService } from '../../services/gift.service';
import { Auth } from '@angular/fire/auth';

@Component({
    selector: 'app-welcome',
    templateUrl: './welcome.page.html',
    styleUrls: ['./welcome.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule]
})
export class WelcomePage implements OnInit {
    private router = inject(Router);
    private giftService = inject(GiftService);
    private auth = inject(Auth);
    private alertCtrl = inject(AlertController);

    isLoading = true;
    backupFound: { date?: string; count?: number } | null = null;
    userName: string = 'User';
    userEmail: string = '';
    userPhoto: string | null = null;

    constructor() { }

    async ngOnInit() {
        const user = this.auth.currentUser;
        this.userName = user?.displayName?.split(' ')[0] || 'User';
        this.userEmail = user?.email || 'Unknown';
        this.userPhoto = user?.photoURL || null;

        // Artificial delay for smooth UX (min 1.5s)
        const startTime = Date.now();

        // Check Backup
        const backupMetadata = await this.giftService.checkCloudBackup();

        const elapsedTime = Date.now() - startTime;
        const minDelay = 1500;

        setTimeout(() => {
            this.isLoading = false;

            if (backupMetadata && backupMetadata.exists) {
                this.backupFound = backupMetadata;
            } else {
                // New User (or no backup) -> Auto-redirect
                this.router.navigate(['/home']);
            }
        }, Math.max(0, minDelay - elapsedTime));
    }

    async restore() {
        this.isLoading = true;
        await this.giftService.restoreDataFromCloud();
        this.router.navigate(['/home']);
    }

    async startFresh() {
        if (this.backupFound) {
            const alert = await this.alertCtrl.create({
                header: 'Irreversible Action',
                message: 'If you skip restoration, your previous Cloud Backup will be permanently overwritten. <br><br><b>This cannot be undone.</b>',
                buttons: [
                    { text: 'Cancel', role: 'cancel' },
                    {
                        text: 'Start Fresh',
                        role: 'destructive',
                        handler: () => {
                            this.router.navigate(['/home']);
                        }
                    }
                ],
                cssClass: 'custom-alert'
            });
            await alert.present();
        } else {
            this.router.navigate(['/home']);
        }
    }
}
