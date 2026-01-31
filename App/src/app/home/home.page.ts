
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, search, person, helpCircle, logOutOutline, close, menu } from 'ionicons/icons';
import { Router, RouterModule } from '@angular/router';
import { GiftService } from '../services/gift.service';
import { AuthService } from '../services/auth.service';
import { Contact } from '../models/data.models';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HighlightPipe } from '../pipes/highlight.pipe';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, HighlightPipe]
})
export class HomePage implements OnInit {
  contacts: Contact[] = [];
  searchTerm$ = new BehaviorSubject<string>('');
  filteredContacts$: Observable<Contact[]> | undefined;
  searchTerm = '';
  isMenuOpen = false;

  constructor(
    private giftService: GiftService,
    private authService: AuthService,
    public router: Router
  ) {
    addIcons({ add, search, person, helpCircle, logOutOutline, close, menu });

    // Combine contacts and search term for filtering
    this.filteredContacts$ = combineLatest([
      this.giftService.getContactsWithLastGift(),
      this.searchTerm$.pipe(
        debounceTime(300), // Performance: Wait 300ms
        distinctUntilChanged() // Performance: Ignore identical emissions
      )
    ]).pipe(
      map(([contacts, term]) => {
        const lowerTerm = term.toLowerCase();
        return contacts.filter(contact => {
          const matchesName = contact.name.toLowerCase().includes(lowerTerm);
          const matchesGift = contact.lastGift?.item.toLowerCase().includes(lowerTerm);
          return matchesName || matchesGift;
        });
      })
    );
  }

  ngOnInit() { }

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    this.searchTerm$.next(this.searchTerm);
  }

  addContact() {
    this.router.navigate(['/add-contact']);
  }

  openChat(id: string) {
    this.router.navigate(['/detail', id]);
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
