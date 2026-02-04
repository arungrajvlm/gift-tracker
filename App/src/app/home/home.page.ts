
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, ToastController, Platform } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, search, close, menu, person, helpCircle, logOutOutline, construct, arrowUpCircle, arrowDownCircle, chevronForward, cloudDone, cloudUpload, cloudOffline, sync, book } from 'ionicons/icons';
import { Router, RouterModule } from '@angular/router';
import { GiftService } from '../services/gift.service';
import { AuthService } from '../services/auth.service';
import { Contact } from '../models/data.models';
import { Observable, combineLatest, BehaviorSubject, firstValueFrom } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HighlightPipe } from '../pipes/highlight.pipe';
import { environment } from 'src/environments/environment';
import { App } from '@capacitor/app';

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
    private toastController: ToastController,
    private cdr: ChangeDetectorRef,
    private platform: Platform
  ) {
    addIcons({ add, search, person, helpCircle, logOutOutline, close, menu, construct, arrowUpCircle, arrowDownCircle, chevronForward, cloudDone, cloudUpload, cloudOffline, sync, book });

    this.syncState$ = this.giftService.syncState$;

    // Handle android hardware back button
    this.platform.backButton.subscribeWithPriority(10, async () => {
      // If menu is open, close it
      if (this.isMenuOpen) {
        this.isMenuOpen = false;
        this.cdr.markForCheck();
        return;
      }

      // Check if there are other modals or overlays if needed (Ionic usually handles them, but priority 10 is high)
      // Minimizing app (Industry Standard for Home Screen)
      try {
        await App.minimizeApp();
      } catch (err) {
        // Fallback or browser
        console.warn('App minimization not supported', err);
      }
    });

    // Check Admin Status
    // Check Admin Status & Import Status
    this.authService.user$.subscribe(async user => {
      if (user && user.email && environment.adminEmails.includes(user.email)) {
        const imported = await this.giftService.hasImported();
        this.canSeed = !imported;
      } else {
        this.canSeed = false;
      }
      this.cdr.markForCheck();
    });

    // Sync Error Handler
    this.syncState$.pipe(
      debounceTime(1000), // Prevent rapid fires
    ).subscribe(async state => {
      if (state === 'error') {
        const toast = await this.toastController.create({
          message: 'Sync failed: Check network connection.',
          duration: 3000,
          color: 'danger',
          icon: 'cloud-offline',
          position: 'bottom'
        });
        await toast.present();
      }
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
        // Token Based Search (AND Logic)
        const tokens = lowerTerm.split(/\s+/).filter(t => t.length > 0);

        // Check if ALL tokens are present in either name OR gift
        // Note: We check tokens against the COMBINED string of Name + Gift to allow cross-field search if desired
        // Or strictly: Every token must be in (Name OR Gift).
        // Let's go with: Every token must be found in the Contact's searchable text (Name + Gift Item)

        const searchableText = (contact.name + ' ' + (contact.lastGift?.item || '')).toLowerCase();

        return tokens.every(token => searchableText.includes(token));
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


  async ngOnInit() {
    const seen = await this.giftService.checkTutorialStatus();
    if (!seen) {
      this.router.navigate(['/tutorial']);
    }
  }

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

  openTutorial() {
    this.isMenuOpen = false;
    this.router.navigate(['/tutorial']);
    this.cdr.markForCheck();
  }

  async logout() {
    // Check for unsynced changes
    const dirtyCount = await firstValueFrom(this.giftService.dirtyCount$);

    if (dirtyCount > 0) {
      const alert = await this.alertController.create({
        header: 'Unsynced Changes',
        message: `You have ${dirtyCount} unsynced changes. sync now to avoid data loss?`,
        buttons: [
          {
            text: 'Discard Changes',
            role: 'destructive',
            handler: () => {
              this.performLogout();
            }
          },
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Sync & Logout',
            handler: async () => {
              const loading = await this.loadingController.create({
                message: 'Syncing...',
                duration: 10000,
                cssClass: 'custom-loading'
              });
              await loading.present();
              try {
                await this.giftService.saveDataToCloud();
                await loading.dismiss();
                this.performLogout();
              } catch (err) {
                await loading.dismiss();
                const errorAlert = await this.alertController.create({
                  header: 'Sync Failed',
                  message: 'Could not sync data. Check your connection.',
                  buttons: ['OK']
                });
                await errorAlert.present();
              }
            }
          }
        ]
      });
      await alert.present();
      return;
    }

    this.performLogout();
  }

  async performLogout() {
    const loading = await this.loadingController.create({
      message: 'Logging out...',
      duration: 5000,
      cssClass: 'custom-loading'
    });
    await loading.present();

    try {
      await this.giftService.clearLocalData(); // Ensure old data is gone
      await this.authService.logout();
      this.isMenuOpen = false;
      this.cdr.markForCheck();
      this.router.navigate(['/login'], { replaceUrl: true });
    } finally {
      await loading.dismiss();
    }
  }

  async seedData() {
    const alert = await this.alertController.create({
      header: 'Import Data',
      message: 'This will populate the app with your custom dataset from the remote server. Continue?',
      cssClass: 'seed-alert-class',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Import',
          handler: () => {
            this.giftService.seedCustomData().then(() => {
              this.canSeed = false; // Hide immediately
              this.isMenuOpen = false;
              this.cdr.markForCheck();
            });
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
    // Check current state first

    let state = 'unknown';
    this.syncState$.subscribe(s => state = s).unsubscribe();

    if (state === 'synced') {
      const toast = await this.toastController.create({
        message: 'All data is already backed up to the cloud.',
        duration: 2000,
        position: 'top',
        color: 'success',
        icon: 'cloud-done',
        cssClass: 'custom-toast'
      });
      await toast.present();
      return;
    }

    // Show Full Screen Loader
    const loading = await this.loadingController.create({
      message: 'Backing up to Cloud...',
      spinner: 'circles',
      duration: 10000, // Timeout safety
      cssClass: 'custom-loading'
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
