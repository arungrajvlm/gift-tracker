import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { GiftService } from '../../services/gift.service';

@Component({
    selector: 'app-add-contact',
    templateUrl: './add-contact.page.html',
    styleUrls: ['./add-contact.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule]
})
export class AddContactPage {
    name = '';
    initialGiftItem = '';
    initialGiftType: 'given' | 'received' = 'given';

    constructor(
        private giftService: GiftService,
        private navCtrl: NavController
    ) { }

    save() {
        if (!this.name.trim()) return;

        const initials = this.name.substring(0, 2).toUpperCase();
        const gradients = [
            'linear-gradient(135deg, #FF6B6B, #EE5D5D)',
            'linear-gradient(135deg, #4ADE80, #22C55E)',
            'linear-gradient(135deg, #F472B6, #DB2777)',
            'linear-gradient(135deg, #60A5FA, #3B82F6)',
            'linear-gradient(135deg, #FBBF24, #D97706)'
        ];
        const avatarColor = gradients[Math.floor(Math.random() * gradients.length)];

        const id = this.giftService.addContact({
            name: this.name,
            initials,
            avatarColor
        });

        if (this.initialGiftItem.trim()) {
            this.giftService.addGift({
                contactId: id,
                item: this.initialGiftItem,
                type: this.initialGiftType,
                date: new Date().toISOString(),
                note: 'Initial entry'
            });
        }

        // Navigate to Detail, replacing current view so Back goes to Home
        this.navCtrl.navigateForward(['/detail', id], { animated: true });
    }

    cancel() {
        this.navCtrl.back();
    }
}
