import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private user: any = {};
  constructor() {
  }
  public getUser() {
    return this.user;
  }
  public setUser(user) {
    this.user = user;
  }
}
