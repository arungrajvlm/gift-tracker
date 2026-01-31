
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, search, person, helpCircle, logOutOutline, close, menu, construct } from 'ionicons/icons';
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
  // pagination state
  allFilteredContacts: Contact[] = [];
  displayedContacts: Contact[] = [];
  isLoading = true;

  searchTerm$ = new BehaviorSubject<string>('');
  searchTerm = '';
  isMenuOpen = false;

  private pageSize = 20;
  private currentPage = 0;

  constructor(
    private giftService: GiftService,
    private authService: AuthService,
    public router: Router
  ) {
    addIcons({ add, search, person, helpCircle, logOutOutline, close, menu, construct });

    // Combine contacts and search term for filtering
    combineLatest([
      this.giftService.getContactsWithLastGift(),
      this.searchTerm$.pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
    ]).subscribe(([contacts, term]) => {
      this.isLoading = true;
      const lowerTerm = term.toLowerCase();

      this.allFilteredContacts = contacts.filter(contact => {
        const matchesName = contact.name.toLowerCase().includes(lowerTerm);
        const matchesGift = contact.lastGift?.item.toLowerCase().includes(lowerTerm);
        return matchesName || matchesGift;
      }).sort((a, b) => a.name.localeCompare(b.name));

      // Reset pagination
      this.currentPage = 0;
      this.updateDisplayedContacts();

      setTimeout(() => {
        this.isLoading = false;
      }, 500);
    });
  }

  private updateDisplayedContacts() {
    const start = 0;
    const end = (this.currentPage + 1) * this.pageSize;
    this.displayedContacts = this.allFilteredContacts.slice(start, end);
  }

  loadData(event: any) {
    setTimeout(() => {
      this.currentPage++;
      this.updateDisplayedContacts();
      event.target.complete();

      if (this.displayedContacts.length >= this.allFilteredContacts.length) {
        event.target.disabled = true;
      }
    }, 500);
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

  seedData() {
    if (confirm('This will add 7000 records. App might lag. Continue?')) {
      this.giftService.seedHighVolumeData();
      this.isMenuOpen = false;
    }
  }
}
