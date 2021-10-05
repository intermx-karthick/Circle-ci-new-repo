import { Injectable, Injector } from '@angular/core';
import createAuth0Client from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { from, of, Observable, BehaviorSubject, throwError, forkJoin, EMPTY, Subscription, timer } from 'rxjs';
import { tap, catchError, concatMap, shareReplay, mergeMap, map, filter, mapTo, switchMap, finalize } from 'rxjs/operators';
import { HttpUrlEncodingCodec } from '@angular/common/http';
import { Router } from '@angular/router';
import { GetTokenSilentlyOptions, IdToken } from '@auth0/auth0-spa-js/src/global';

import { environment } from 'environments/environment';
import { AuthenticationService, TargetAudienceService, TitleService } from '@shared/services';
import { AppConfig } from '../app-config.service';
import { ThemeService } from '../shared/services/theme.service';
import { CommonService } from '../shared/services/common.service';
import { Auth0ClientOptions } from '@auth0/auth0-spa-js/dist/typings/global';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  auth0ClientOptions: Auth0ClientOptions = {} as Auth0ClientOptions;

  // Create an observable of Auth0 instance of client
  auth0Client$ = (
    this.themeService.getThemeSettingsFromAPI().pipe(
      mergeMap((res: any) => {

        this.apikey = res.apiKey;
        this.origin = res.domain;
        this.logoUrl = res.domain + res.logo.full_logo;
        this.primaryColor = res['color_sets']['primary']['base'];
        this.titleOnLogin = res['productName'];
        this.connection = res.auth0.connections;
        this.backgroundImage = res.domain + res['background']['bg_image'];
        if (res && res.publicSite) {
          this.titleService.updateTitle('Public');
          if (this.router.url !== '/user/public' && !this.router.url.includes('callback')) {
            this.router.navigate(['/user/public']);
          }
        }

        this.themeService.generateColorTheme();
        localStorage.setItem('apiKey', res.apiKey);
        this.config.envSettings['API_KEY'] = res.apiKey;

        this.auth0ClientOptions = {
          domain: res.auth0.domain.split('//')?.[1] ?? res.auth0.domain,
          client_id: res.auth0.clientId,
          redirect_uri: `${window.location.origin}/callback`,
          cacheLocation: 'localstorage',
          useRefreshTokens: true
        };

        this.handleThemeSettingsAPIResponse(res);

        return from(
          createAuth0Client(this.auth0ClientOptions)
        ) as Observable<Auth0Client>;
      })
    )
  ).pipe(
    shareReplay(1), // Every subscription receives the same shared value
    catchError(err => throwError(err))
  );

  // Define observables for SDK methods that return promises by default
  // For each Auth0 SDK method, first ensure the client instance is ready
  // concatMap: Using the client instance, call SDK method; SDK returns a promise
  // from: Convert that resulting promise into an observable
  isAuthenticated$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.isAuthenticated())),
    tap(res => this.loggedIn = res)
  );

  handleRedirectCallback$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => {
      return from(client.handleRedirectCallback());
    })
  );
  // Create subject and public observable of user profile data
  private userProfileSubject$ = new BehaviorSubject<any>(null);
  userProfile$ = this.userProfileSubject$.asObservable();
  // Create a local property for login status
  loggedIn: boolean = null;
  logoUrl: any;
  primaryColor: any;
  titleOnLogin: any;
  connection: any;
  backgroundImage: any;
  codec = new HttpUrlEncodingCodec();
  apikey: any;
  origin: any;
  allowedConnections: any;
  private refreshSubscription: Subscription;
  private requestInQueue = 0;

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private titleService: TitleService,
    public authentication: AuthenticationService,
    private trargetAudienceService: TargetAudienceService,
    private config: AppConfig,
    private matSnackBar: MatSnackBar,
    private commonService: CommonService
  ) {
    // On initial load, check authentication state with authorization server
    // Set up local auth streams if user is already authenticated
    this.localAuthSetup();
    // Handle redirect from Auth0 login
    this.handleAuthCallback();
    this.handleErrorCallback();
  }

  // When calling, options can be passed if desired
  // https://auth0.github.io/auth0-spa-js/classes/auth0client.html#getuser
  getUser$(options?): Observable<any> {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) => from(client.getUser(options))),
      tap(user => this.userProfileSubject$.next(user))
    );
  }

  localAuthSetup() {

    // This should only be called on app initialization
    // Set up local authentication streams
    const checkAuth$ = this.isAuthenticated$.pipe(
      concatMap((loggedIn: boolean) => {
        if (loggedIn) {
          // If authenticated, get user and set in app
          // NOTE: you could pass options here if needed
          return this.getIdToken$().pipe(
            map((idToken: any) => {
              if (!idToken) {
                return false;
              }
              this.authentication.token = idToken?.__raw;
              this.authentication.nonce = idToken?.nonce;
              return true;
            })
          );
        }

        // If not authenticated, return stream that emits 'false'
        return of(loggedIn);
      }),
      filter((loggedIn) => loggedIn)
    );

    checkAuth$.subscribe((loggedIn) => {
      this.scheduleRenewal();
    });
  }

  login(redirectPath: string = '/') {
    // A desired redirect path can be passed to login method
    // (e.g., from a route guard)
    // Ensure Auth0 client instance exists
    if (this.connection !== 'email') {
      const URLparams = decodeURIComponent(window.location.search);
      if (URLparams) {
        const connection = URLparams.split('?')[1];
        const isCon = connection.split('=');
        if (isCon[0] === 'connection') {
          if (this.allowedConnections.indexOf(isCon[1]) !== -1) {
            this.connection = isCon[1];
          }
        }
      }
      this.auth0Client$.subscribe((client: Auth0Client) => {
        // Call method to log in
        client.loginWithRedirect({
          redirect_uri: `${window.location.origin}/callback`,
          theme: JSON.stringify({
            icon: this.logoUrl,
            primaryColor: this.primaryColor,
            title: this.titleOnLogin,
            apiURL: this.config.envSettings['API_ENDPOINT_V2'],
            apiKey: this.apikey,
            origin: this.origin,
            envisProd: environment.production,
            backgroundImage: this.backgroundImage,
            connection: this.connection
          }),
          connection: this.connection,
          appState: { target: redirectPath }
        });
      });
    } else {
      this.auth0Client$.subscribe((client: Auth0Client) => {
        // Call method to log in
        client.loginWithRedirect({
          redirect_uri: `${window.location.origin}/callback`,
          theme: JSON.stringify({
            icon: this.logoUrl,
            primaryColor: this.primaryColor,
            title: this.titleOnLogin,
            apiURL: this.config.envSettings['API_ENDPOINT_V2'],
            apiKey: this.apikey,
            envisProd: environment.production,
            origin: this.origin,
            backgroundImage: this.backgroundImage,
            connection: this.connection
          }),
          appState: { target: redirectPath }
        });
      });
    }
  }

  logout() {
    this.authentication.token = null;
    this.authentication.nonce = null;
    // Ensure Auth0 client instance exists
    this.auth0Client$.subscribe((client: Auth0Client) => {
      // Call method to log out
      client.logout({
        client_id: this.auth0ClientOptions?.client_id,
        returnTo: `${window.location.origin}`
      });
    });
  }

  getTokenSilently$(options?): Observable<string> {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) => from(client.getTokenSilently(options)))
    );
  }

  getIdToken$(options?): Observable<IdToken> {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) => from(client.getIdTokenClaims()))
    );
  }

  private handleThemeSettingsAPIResponse(res) {
    this.logoUrl = res.domain + res.logo.full_logo;
    this.primaryColor = res['color_sets']['primary']['base'];
    this.titleOnLogin = res['productName'];
    this.connection = res.auth0.connections;
    this.allowedConnections = res.auth0.allowedConnections;
    this.backgroundImage = res.domain + res['background']['bg_image'];
    if (res && res.publicSite) {
      this.titleService.updateTitle('Public');
      if (this.router.url !== '/user/public' && !this.router.url.includes('callback')) {
        this.router.navigate(['/user/public']);
        return of(false);
      }
    }

    this.themeService.generateColorTheme();
    localStorage.setItem('apiKey', res.apiKey);
    this.config.envSettings['API_KEY'] = res.apiKey;

    this.auth0ClientOptions = {
      domain: res.auth0.domain.split('//')?.[1] ?? res.auth0.domain,
      client_id: res.auth0.clientId,
      cacheLocation: 'localstorage',
      redirect_uri: `${window.location.origin}/callback`,
      useRefreshTokens: true
    };
  }

  private handleAuthCallback() {
    // Call when app reloads after user logs in with Auth0
    const params = window.location.search;
    const userdata = this.authentication.getUserData();
    const module_access = localStorage.getItem('module_access');
    const themeSettings = JSON.parse(localStorage.getItem('themeSettings'));
    if (params.includes('code=') && params.includes('state=')) {
      let targetRoute: string; // Path to redirect to after login processsed
      const authComplete$ = this.handleRedirectCallback$.pipe(
        // Have client, now call method to handle auth callback redirect
        tap(cbRes => {
          // Get and set target redirect route from callback results
          targetRoute = cbRes.appState && cbRes.appState.target ? cbRes.appState.target : '/';
        }),
        mergeMap((res) => {
          // Redirect callback complete; get user and login status
          return this.postAuth0LoginAPIs();
        }),
        catchError((err=>{
          console.log('Auth Callback handling Error', err);
          this.showsAlertMessage(err?.message);
          this.logout();
          return of(err)
        }))
      );

      // Subscribe to authentication completion observable
      // Response will be an array of user and login status
      authComplete$.subscribe(([user, layers]) => {
        this.handlePostAuth0LoginAPIsResponse(user, layers);
      });
    } else if ((!themeSettings || !themeSettings['publicSite']) && (userdata === null || module_access === null)) {
      this.logout();
    }
  }

  /**
   * @description
   *  Setting the auth jwt token in memory and validating the user.
   *  then setting the user details from v2/user/details api.
   */
  private postAuth0LoginAPIs() {
    const theme = JSON.parse(localStorage.getItem('themeSettings'));

    return this.getIdToken$().pipe(
      mergeMap(idToken => {
        this.authentication.token = idToken.__raw;
        this.authentication.nonce = idToken.nonce;
        return this.authentication.validateAuth0TokenFromApigee().pipe(
          mergeMap(validationRes => {
            if (validationRes?.id) {
              return forkJoin([
                this.authentication.getUserDetailsUsingAuth0Token(),
                this.authentication.getLayersInfo(theme._id)
                // this.authentication.getUserPreference()
              ]);
            } else {
              this.logout();
              return throwError('Invalid user');
            }
          }),
          catchError(err => {
            this.logout();
            return of(err);
          }),
        );
      })
    );
  }

  /**
   * @description
   *  To handle the response of postAuth0LoginAPIs
   * @param user
   * @param layers
   */
  private handlePostAuth0LoginAPIsResponse(user, layers) {
    if (!user) {
      this.showsAlertMessage('Invalid User');
      this.logout();
      return
    }

    if (user) {
      const flag = this.authentication.setUserData(user, layers.layers);
      if (!flag) {
        this.logout();
      }
      // Redirect to target route after callback processing
      setTimeout(() => {
        const themeSettings = JSON.parse(localStorage.getItem('themeSettings'));
        const user_preferences = {};
        user_preferences['measures_release'] = Number(themeSettings['measuresRelease']);
        this.commonService.setUserPreferences(user_preferences);
        this.trargetAudienceService.getDefaultAudience(true)
          .subscribe();
      }, 300);
      this.router.navigateByUrl('/');
    }

  }

  private handleErrorCallback() {
    // Call when app reloads after user logs in with Auth0
    const params = window.location.search;
    if (params.includes('error=') && params.includes('error_description=')) {
      const errorMessage = params?.split('&error_description=')?.[1].split?.('&')?.[0];
      this.showsAlertMessage(this.codec.decodeValue(errorMessage));
      this.logout();
    }
  }

  private showsAlertMessage(msg) {
    const config = this.getSnackBarConfig();
    this.matSnackBar.open(msg, 'close', {
      ...config
    });
  }

  private getSnackBarConfig(): MatSnackBarConfig {
    return {
      duration: 10000,
    };
  }

  private scheduleRenewal() {
    if (this.refreshSubscription) {
      this.refreshSubscription = null;
    }

    const source = this.auth0Client$.pipe(
      filter((client) => !!client),
      concatMap((client) =>
        forkJoin([
          of(client),
          from(client.isAuthenticated()),
          from(client.getIdTokenClaims())
        ])
      ),
      filter(([client, isAuthenticated, idToken]) => !!isAuthenticated),
      concatMap(([client, isAuthenticated, idToken]) => {
        const expiresAt = idToken.exp ?? 0;
        const now = Date.now();

        // Use the delay in a timer to
        // run the refresh at the proper time
        const refreshAt = (expiresAt * 1000) - 1000 * 60; // Refresh 60 seconds before expiry
        return timer(Math.max(1, refreshAt - now)).pipe(
          mapTo(client)
        );
      }),
      filter((_) => this.requestInQueue === 0),
      concatMap((client) => {
        this.requestInQueue++;
        return from(checkSession.call(client, { nonce: createRandomString() }))
      }),
      filter((idToken) => !!idToken),
      finalize(() => this.requestInQueue--)
    );

    this.refreshSubscription = source.subscribe((idToken: IdToken) => {
      this.setUpSession(idToken);
    });
  }

  private removeSchedule() {
    this.refreshSubscription?.unsubscribe?.();
  }

  private setUpSession(idToken: IdToken) {
    this.authentication.token = idToken.__raw;
    this.authentication.nonce = idToken.nonce ?? '';
    this.removeSchedule();
    this.scheduleRenewal();
  }
}

function checkSession(options?: GetTokenSilentlyOptions) {
  return from(this.getTokenSilently(options)).pipe(
    concatMap((token) => this.getIdTokenClaims())
  );
}

export const createRandomString = () => {
  const charset =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.';
  let random = '';
  const randomValues = Array.from(
    getCrypto().getRandomValues(new Uint8Array(43))
  );
  randomValues.forEach(v => (random += charset[v % charset.length]));
  return random;
};


export const getCrypto = () => {
  //ie 11.x uses msCrypto
  return <Crypto>(window.crypto || (<any>window).msCrypto);
};

