import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { arrowBack, person, gift, statsChart, star, notifications, shieldCheckmark, chevronForward, chatbubbleEllipses, logoGoogle, construct, cloudUpload, cloudDone, personCircle } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { GiftService } from '../../services/gift.service';
import { AuthService } from '../../services/auth.service';
import { Observable, map } from 'rxjs';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule]
})
export class ProfilePage implements OnInit {
    user$: Observable<any>;
    stats$: Observable<{ given: number; received: number; totalValue: number }>;
    lastSync$: Observable<string | null>;
    public imageError = false;

    constructor(
        private navCtrl: NavController,
        private giftService: GiftService,
        private authService: AuthService,
        private toastCtrl: ToastController,
        private loadingController: LoadingController,
        private alertController: AlertController
    ) {
        addIcons({ arrowBack, person, gift, statsChart, star, notifications, shieldCheckmark, chevronForward, chatbubbleEllipses, logoGoogle, construct, cloudUpload, cloudDone, personCircle });
        this.user$ = this.authService.user$;
        this.lastSync$ = this.giftService.lastSyncTime$;

        // Calculate stats from all contacts
        this.stats$ = this.giftService.getAllGifts().pipe(
            map(gifts => {
                const given = gifts.filter(g => g.type === 'given').length;
                const received = gifts.filter(g => g.type === 'received').length;
                const totalValue = gifts.reduce((sum, g) => sum + (g.price || 0), 0);
                return { given, received, totalValue };
            })
        );
    }

    ngOnInit() { }

    goBack() {
        this.navCtrl.back();
    }

    async showComingSoon(feature: string) {
        const toast = await this.toastCtrl.create({
            message: `${feature} is coming soon!`,
            duration: 2000,
            position: 'bottom',
            color: 'medium',
            icon: 'construct'
        });
        await toast.present();
    }

    async triggerBackup() {
        const loading = await this.loadingController.create({
            message: 'Saving to Cloud...',
            spinner: 'circles',
            duration: 10000
        });
        await loading.present();

        try {
            await this.giftService.saveDataToCloud();
            const toast = await this.toastCtrl.create({
                message: 'Backup Complete! Your data is safe.',
                duration: 2000,
                position: 'bottom',
                color: 'success',
                icon: 'cloud-done'
            });
            await toast.present();
        } catch (error) {
            const alert = await this.alertController.create({
                header: 'Backup Failed',
                message: 'Could not connect to the cloud. Please check your internet.',
                buttons: ['OK']
            });
            await alert.present();
        } finally {
            await loading.dismiss();
        }
    }

    handleImageError(event: any) {
        this.imageError = true;
    }
}
