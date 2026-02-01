import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { arrowBack, person, gift, statsChart, star, notifications, shieldCheckmark, chevronForward, chatbubbleEllipses } from 'ionicons/icons';
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

    constructor(
        private navCtrl: NavController,
        private giftService: GiftService,
        private authService: AuthService
    ) {
        addIcons({ arrowBack, person, gift, statsChart, star, notifications, shieldCheckmark, chevronForward, chatbubbleEllipses });
        this.user$ = this.authService.user$;

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
}
