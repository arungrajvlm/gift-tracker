import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonContent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, arrowDownOutline, giftOutline, send } from 'ionicons/icons';
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
    newGiftItem = '';
    newGiftType: 'given' | 'received' = 'given';

    constructor(
        private route: ActivatedRoute,
        private giftService: GiftService
    ) {
        addIcons({ arrowBack, arrowDownOutline, giftOutline, send });
    }

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

    addGift() {
        if (!this.newGiftItem.trim() || !this.contact) return;

        this.giftService.addGift({
            contactId: this.contact.id,
            item: this.newGiftItem,
            type: this.newGiftType,
            date: new Date().toISOString()
        });

        this.newGiftItem = '';
    }
}
