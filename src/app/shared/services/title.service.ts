import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {Title} from '@angular/platform-browser';
import {BehaviorSubject} from 'rxjs';


@Injectable()
export class TitleService {
  // TODO: Please check the else case to update the default || original site name
  sitename = environment.siteName;
  public siteName: BehaviorSubject<string> = new BehaviorSubject<string>(this.sitename);
  public constructor(private titleService: Title ) {
    const themeSettings = JSON.parse(localStorage.getItem('themeSettings'));
    if (themeSettings && themeSettings['siteName']) {
      this.sitename = themeSettings['siteName'];
    }
   // titleService.setTitle(this.title);
  }
  public getTitle() {
    return this.titleService.getTitle();
  }
  public setTitle( newTitle: string) {
    newTitle = newTitle ;
    this.titleService.setTitle( newTitle );
  }
  public updateTitle( newTitle: string) {
    this.setTitle(newTitle + ' :: ' + this.sitename);
  }

  updateSiteName(value: string) {
    this.siteName.next(value);
    this.sitename = value;
    let title = this.titleService.getTitle();
    const titleArray = title.split(' :: ');
    if (titleArray[1] !== value) {
      titleArray[1] = this.sitename;
      title = titleArray.join(' :: ');
      this.titleService.setTitle(title);
    }
  }
}
