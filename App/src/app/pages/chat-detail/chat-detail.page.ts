import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonContent, NavController, AlertController, ActionSheetController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, arrowDownOutline, giftOutline, send, arrowUp, arrowDown, pencil, trash, close } from 'ionicons/icons';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { GiftService } from '../../services/gift.service';
import { Contact, Gift } from '../../models/data.models';
import { Observable, switchMap, tap } from 'rxjs';

@Component({
    selector: 'app-chat-detail',
    templateUrl: './chat-detail.page.html',
    styleUrls: ['./chat-detail.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class ChatDetailPage implements OnInit {
    @ViewChild(IonContent) content!: IonContent;

    contact: Contact | undefined;
    gifts$: Observable<Gift[]> | undefined;

    // Modal & Form State
    isModalOpen = false;
    newGiftItem = '';
    newGiftType: 'given' | 'received' = 'given';
    newGiftPrice: number | null = null;
    newGiftNote = '';
    newGiftDate = new Date().toISOString();
    editingGiftId: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private giftService: GiftService,
        private navCtrl: NavController,
        private alertCtrl: AlertController,
        private actionSheetCtrl: ActionSheetController
    ) {
        addIcons({ arrowBack, arrowUp, arrowDown, pencil, trash, close });
    }

    goBack() {
        this.navCtrl.back();
    }

    async editName() {
        if (!this.contact) return;

        const alert = await this.alertCtrl.create({
            header: 'Edit Name',
            inputs: [
                {
                    name: 'name',
                    type: 'text',
                    value: this.contact.name,
                    placeholder: 'Enter name'
                }
            ],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: 'Save',
                    handler: (data) => {
                        if (data.name && data.name.trim() !== '') {
                            this.giftService.updateContactName(this.contact!.id, data.name);
                            // Refresh local contact reference
                            this.contact = this.giftService.getContact(this.contact!.id);
                        }
                    }
                }
            ],
            cssClass: 'custom-alert'
        });

        await alert.present();
    }

    async deletePerson() {
        if (!this.contact) return;

        const alert = await this.alertCtrl.create({
            header: 'Delete Person',
            message: 'Are you sure you want to delete this person and all their history? This cannot be undone.',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: () => {
                        this.giftService.deleteContact(this.contact!.id);
                        this.navCtrl.navigateBack('/home');
                    }
                }
            ]
        });

        await alert.present();
    }

    onGiftClick(gift: Gift) {
        this.openEditModal(gift);
    }

    openEditModal(gift: Gift) {
        this.editingGiftId = gift.id;
        this.newGiftItem = gift.item;
        this.newGiftType = gift.type;
        this.newGiftPrice = gift.price || null;
        this.newGiftNote = gift.note || '';
        this.newGiftDate = gift.date;
        this.isModalOpen = true;
    }

    async confirmDeleteGift(gift: Gift) {
        const alert = await this.alertCtrl.create({
            header: 'Delete Gift',
            message: 'Are you sure you want to delete this gift?',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: () => {
                        this.giftService.deleteGift(gift.id);
                    }
                }
            ]
        });
        await alert.present();
    }

    openModal(type: 'given' | 'received') {
        this.editingGiftId = null; // Reset edit mode
        this.newGiftType = type;
        this.newGiftItem = '';
        this.newGiftPrice = null;
        this.newGiftNote = '';
        this.newGiftDate = new Date().toISOString();
        this.isModalOpen = true;
    }

    // ... ngOnInit and scroll ...

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.contact = this.giftService.getContact(id);
                this.gifts$ = this.giftService.getGiftsForContact(id).pipe(
                    tap(() => this.scrollToBottom())
                );
            }
        });
    }

    scrollToBottom() {
        setTimeout(() => {
            this.content?.scrollToBottom(300);
        }, 100);
    }

    async deleteGiftFromModal() {
        if (!this.editingGiftId) return;

        const alert = await this.alertCtrl.create({
            header: 'Delete Gift',
            message: 'Are you sure you want to delete this gift?',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: () => {
                        if (this.editingGiftId) {
                            this.giftService.deleteGift(this.editingGiftId);
                            this.isModalOpen = false;
                            this.editingGiftId = null;
                        }
                    }
                }
            ]
        });
        await alert.present();
    }

    addGift() {
        if (!this.newGiftItem.trim() || !this.contact) return;

        if (this.editingGiftId) {
            // Update existing
            this.giftService.updateGift({
                id: this.editingGiftId,
                contactId: this.contact.id,
                item: this.newGiftItem,
                type: this.newGiftType,
                date: this.newGiftDate,
                price: this.newGiftPrice || undefined,
                note: this.newGiftNote || undefined
            });
        } else {
            // Create new
            this.giftService.addGift({
                contactId: this.contact.id,
                item: this.newGiftItem,
                type: this.newGiftType,
                date: this.newGiftDate,
                price: this.newGiftPrice || undefined,
                note: this.newGiftNote || undefined
            });
        }

        // Reset and Close
        this.newGiftItem = '';
        this.newGiftPrice = null;
        this.newGiftNote = '';
        this.editingGiftId = null;
        this.isModalOpen = false;

        this.scrollToBottom();
    }

    trackByGiftId(index: number, gift: Gift): string {
        return gift.id;
    }
}
