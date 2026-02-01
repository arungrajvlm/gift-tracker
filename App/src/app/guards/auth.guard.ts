import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private auth: Auth = inject(Auth);
    private router: Router = inject(Router);

    canActivate(): Observable<boolean | UrlTree> {
        return authState(this.auth).pipe(
            take(1),
            map(user => {
                if (user) {
                    return true;
                } else {
                    return this.router.createUrlTree(['/login']);
                }
            })
        );
    }
}
