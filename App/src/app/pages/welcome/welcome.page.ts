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
    loadingMessage = 'Checking for backups...';
    backupFound: { date?: string; count?: number } | null = null;
    userName: string = 'User';
    userEmail: string = '';
    userPhoto: string | null = null;

    constructor() { }

    async ngOnInit() {
        // Simple User Fetch
        const user = this.auth.currentUser;
        this.userName = user?.displayName?.split(' ')[0] || 'User';
        this.userEmail = user?.email || 'Unknown';
        this.userPhoto = user?.photoURL || null;

        const startTime = Date.now();
        let backupMetadata: any = null;

        try {
            backupMetadata = await this.giftService.checkCloudBackup();
        } catch (error) {
            console.error('Backup check failed (likely offline)', error);
            const alert = await this.alertCtrl.create({
                header: 'Offline Mode',
                message: 'Could not check for backups. Please check your internet connection.',
                buttons: ['OK']
            });
            await alert.present();
        }

        const elapsedTime = Date.now() - startTime;
        const minDelay = 1500;

        setTimeout(() => {
            this.isLoading = false;

            if (backupMetadata && backupMetadata.exists) {
                this.backupFound = backupMetadata;
            } else {
                // If offline or no backup, we just show "Get Started"
                console.log('No visible backup found (or offline).');
            }
        }, Math.max(0, minDelay - elapsedTime));
    }

    async restore() {
        if (!navigator.onLine) {
            const alert = await this.alertCtrl.create({
                header: 'No Internet Connection',
                message: 'Please connect to the internet to restore your backup.',
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        this.isLoading = true;
        this.loadingMessage = 'Restoring...';
        try {
            await this.giftService.restoreDataFromCloud();
            this.router.navigate(['/home'], { replaceUrl: true });
        } catch (error) {
            this.isLoading = false;
            const alert = await this.alertCtrl.create({
                header: 'Restore Failed',
                message: 'Something went wrong while restoring. Please try again.',
                buttons: ['OK']
            });
            await alert.present();
        }
    }

    async startFreshOnNoBackup() {
        this.router.navigate(['/home'], { replaceUrl: true });
    }

    async startFresh() {
        if (this.backupFound) {
            const alert = await this.alertCtrl.create({
                header: 'Irreversible Action',
                message: 'If you skip restoration, your previous Cloud Backup will be permanently overwritten. \n\nThis cannot be undone.',
                buttons: [
                    { text: 'Cancel', role: 'cancel' },
                    {
                        text: 'Start Fresh',
                        role: 'destructive',
                        handler: async () => {
                            this.isLoading = true;
                            // We still archive it for safety (support can restore), but tell user it's irreversible
                            await this.giftService.archiveRemoteBackup();
                            await this.giftService.saveContacts([], false); // Clear local
                            this.isLoading = false;
                            this.router.navigate(['/home'], { replaceUrl: true });
                        }
                    }
                ],
                cssClass: 'custom-alert'
            });
            await alert.present();
        } else {
            // No backup found, just go
            this.router.navigate(['/home'], { replaceUrl: true });
        }
    }

}
