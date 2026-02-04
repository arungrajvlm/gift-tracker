
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { GiftService } from '../../services/gift.service';
import { addIcons } from 'ionicons';
import { close, arrowUp, arrowDown, checkmarkCircle, personAdd } from 'ionicons/icons';

@Component({
    selector: 'app-add-contact',
    templateUrl: './add-contact.page.html',
    styleUrls: ['./add-contact.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule]
})
export class AddContactPage {
    name = '';
    initialGiftType: 'given' | 'received' = 'received'; // Default to Received as requested
    initialGiftItem = '';
    initialGiftDate = new Date().toISOString();
    initialGiftPrice: number | null = null;
    initialGiftNote = '';

    // Expose icons for direct binding
    closeIcon = close;
    receviedIcon = arrowDown;
    givenIcon = arrowUp;

    constructor(
        private router: Router,
        private giftService: GiftService,
        private toastCtrl: ToastController
    ) {
        addIcons({ close, arrowUp, arrowDown, checkmarkCircle, personAdd });
    }

    async save() {
        if (await this.processSave()) {
            const toast = await this.toastCtrl.create({
                message: 'Person saved successfully',
                duration: 2000,
                position: 'top', // Top makes it more visible
                color: 'success',
                icon: 'checkmark-circle',
                buttons: [{ icon: 'close', role: 'cancel' }]
            });
            await toast.present();
            this.router.navigate(['/home'], { replaceUrl: true });
        }
    }

    async saveAndNext() {
        if (await this.processSave()) {
            // Reset Form (keep type)
            this.name = '';
            this.initialGiftItem = '';
            this.initialGiftPrice = null;
            this.initialGiftNote = '';
            this.initialGiftDate = new Date().toISOString();

            // Feedback
            const toast = await this.toastCtrl.create({
                message: 'Saved! Ready for next person.',
                duration: 2000,
                position: 'top',
                color: 'success',
                icon: 'person-add',
                buttons: [{ icon: 'close', role: 'cancel' }]
            });
            await toast.present();
        }
    }

    private async processSave(): Promise<boolean> {
        if (!this.name.trim()) return false;

        // Generate random avatar gradient
        const colors = [
            ['#6366f1', '#8b5cf6'], ['#14b8a6', '#2dd4bf'], ['#f43f5e', '#fb7185'],
            ['#f59e0b', '#fbbf24'], ['#10b981', '#34d399']
        ];
        const rand = colors[Math.floor(Math.random() * colors.length)];
        const avatarColor = `linear-gradient(135deg, ${rand[0]}, ${rand[1]})`;

        const initials = this.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        // Await the new async service method
        const contactId = await this.giftService.addContact({
            name: this.name,
            initials,
            avatarColor
        });

        if (this.initialGiftItem.trim()) {
            await this.giftService.addGift({
                contactId,
                item: this.initialGiftItem,
                type: this.initialGiftType,
                date: this.initialGiftDate,
                price: this.initialGiftPrice || undefined,
                note: this.initialGiftNote || undefined
            });
        }

        return true;
    }

    cancel() {
        this.router.navigate(['/home']);
    }
}
