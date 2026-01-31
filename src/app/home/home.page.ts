import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { ellipsisVertical, add, informationCircle, logOut, close } from 'ionicons/icons';
import { Router, RouterModule } from '@angular/router';
import { GiftService } from '../services/gift.service';
import { AuthService } from '../services/auth.service';
import { Contact } from '../models/data.models';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { HighlightPipe } from '../pipes/highlight.pipe';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, FormsModule, HighlightPipe],
})
export class HomePage implements OnInit {
  searchTerm$ = new BehaviorSubject<string>('');
  filteredContacts$: Observable<Contact[]>;

  constructor(
    private giftService: GiftService,
    private authService: AuthService,
    private router: Router,
    private actionSheetCtrl: ActionSheetController
  ) {
    addIcons({ ellipsisVertical, add, informationCircle, logOut, close });
    // Combine contacts and search term for filtering
    this.filteredContacts$ = combineLatest([
      this.giftService.getContactsWithLastGift(),
      this.searchTerm$
    ]).pipe(
      map(([contacts, term]) => {
        if (!term) return contacts;
        const lower = term.toLowerCase();
        return contacts.filter(c =>
          c.name.toLowerCase().includes(lower) ||
          (c.lastGift?.item.toLowerCase().includes(lower))
        );
      })
    );
  }

  ngOnInit() { }

  handleSearch(event: any) {
    this.searchTerm$.next(event.detail.value || '');
  }

  async openProfile() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Menu',
      buttons: [
        {
          text: 'About GiftTracker',
          icon: 'information-circle',
          handler: () => {
            alert('GiftTracker v1.0\nPremium Ionic Edition');
          }
        },
        {
          text: 'Logout',
          icon: 'log-out',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login'], { replaceUrl: true });
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  addContact() {
    this.router.navigate(['/add-contact']);
  }
}
