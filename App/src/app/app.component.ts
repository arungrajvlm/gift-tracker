import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, search, person, helpCircle, logOutOutline, close, menu, construct, arrowUpCircle, arrowDownCircle, chevronForward, trash, trashOutline, pencil, createOutline, arrowBack, arrowUp, arrowDown, send, giftOutline, arrowDownOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    // Register all icons globally to ensure availability
    addIcons({
      add, search, person, helpCircle, logOutOutline, close, menu, construct,
      arrowUpCircle, arrowDownCircle, chevronForward, trash, trashOutline,
      pencil, createOutline, arrowBack, arrowUp, arrowDown, send,
      giftOutline, arrowDownOutline
    });
  }
}
