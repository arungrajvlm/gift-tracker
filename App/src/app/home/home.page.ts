
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, search, person, helpCircle, logOutOutline, close, menu, construct, arrowUpCircle, arrowDownCircle, chevronForward, cloudDone, cloudUpload, cloudOffline, cloudSync } from 'ionicons/icons';
import { Router, RouterModule } from '@angular/router';
import { GiftService } from '../services/gift.service';
import { AuthService } from '../services/auth.service';
import { Contact } from '../models/data.models';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HighlightPipe } from '../pipes/highlight.pipe';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, HighlightPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
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

  loader: any;
  canSeed = false;

  // Sync State
  syncState$: Observable<string>;

  constructor(
    private giftService: GiftService,
    private authService: AuthService,
    public router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ add, search, person, helpCircle, logOutOutline, close, menu, construct, arrowUpCircle, arrowDownCircle, chevronForward, cloudDone, cloudUpload, cloudOffline, cloudSync });

    this.syncState$ = this.giftService.syncState$;

    // Check Admin Status
    this.authService.user$.subscribe(user => {
      if (user && user.email && environment.adminEmails.includes(user.email)) {
        this.canSeed = true;
      } else {
        this.canSeed = false;
      }
      this.cdr.markForCheck();
    });

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

      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  private updateDisplayedContacts() {
    const start = 0;
    const end = (this.currentPage + 1) * this.pageSize;
    this.displayedContacts = this.allFilteredContacts.slice(start, end);
    this.cdr.markForCheck();
  }

  loadData(event: any) {
    this.currentPage++;
    this.updateDisplayedContacts();
    event.target.complete();

    if (this.displayedContacts.length >= this.allFilteredContacts.length) {
      event.target.disabled = true;
    }
    this.cdr.markForCheck();
  }


  ngOnInit() { }

  ionViewWillLeave() {
    this.isMenuOpen = false;
    this.cdr.markForCheck();
  }

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
    this.cdr.markForCheck();
  }

  trackByContact(index: number, contact: Contact): string {
    return contact.id;
  }

  logout() {
    this.authService.logout();
    this.isMenuOpen = false;
    this.cdr.markForCheck();
    this.router.navigate(['/login']);
  }

  async seedData() {
    const alert = await this.alertController.create({
      header: 'Seed Data',
      message: 'This will populate the app with your custom dataset from the remote server. Continue?',
      cssClass: 'seed-alert-class',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Seed',
          handler: () => {
            this.giftService.seedCustomData();
            this.isMenuOpen = false;
            this.cdr.markForCheck();
          }
        }
      ]
    });
    await alert.present();
  }

  openProfile() {
    this.isMenuOpen = false;
    this.cdr.markForCheck();
    this.router.navigate(['/profile']);
  }

  openAbout() {
    this.isMenuOpen = false;
    this.cdr.markForCheck();
    this.router.navigate(['/about']);
  }

  // Sync Logic
  async triggerSync() {
    // Show Full Screen Loader
    const loading = await this.loadingController.create({
      message: 'Backing up to Cloud...',
      spinner: 'circles',
      duration: 10000 // Timeout safety
    });
    await loading.present();

    try {
      await this.giftService.saveDataToCloud();
    } catch (error) {
      // Error handled in service state
      const alert = await this.alertController.create({
        header: 'Backup Failed',
        message: 'Could not connect to the cloud. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      await loading.dismiss();
    }
  }
}
