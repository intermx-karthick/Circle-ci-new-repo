import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {
  CommonService,
  LoaderService,
  ThemeService
} from '@shared/services';
import swal from 'sweetalert2';
import {environment} from '../../../environments/environment';
import {Router} from '@angular/router';

@Component({
  selector: 'theme-settings',
  templateUrl: './theme-settings.component.html',
  styleUrls: ['./theme-settings.component.less']
})
export class ThemeSettingsComponent implements OnInit {

  constructor(
    private fb: FormBuilder,
    private _cService: CommonService,
    private router: Router,
    private loader: LoaderService,
    private theme: ThemeService
  ) { }
  tsForm: FormGroup;
  themeSetting: any;
  imageValidation: any = environment.imageValidation;
  @ViewChild('fileInput') full_logo;
  /*@ViewChild('fileInput') mini_logo;
  @ViewChild('fileInput') bg_image;
  @ViewChild('fileInput') favicon_logo;*/

  ngOnInit() {
    this.tsForm = this.fb.group({
      color : this.fb.group({
        primary : '',
        secondary : '',
        highlight : '',
        button : ['']
      }),
      logo : this.fb.group({
        full_logo : '',
        mini_logo : ''
      }),
      background : this.fb.group({
        bg_image : '',
        bg_color : ''
      }),
      customize : this.fb.group({
        favicon_logo : ''
      })
    });
    this.themeSetting = this.theme.getThemeSettings();
    this.tsForm.patchValue({
      color : {
        primary : this.themeSetting['color_sets']['primary']['base'],
        secondary : this.themeSetting['color_sets']['secondary']['base'],
        highlight : this.themeSetting['color_sets']['highlight']['base'],
        button : this.themeSetting['color_sets']['primary']['base']
      },
      /*logo : {
          full_logo :this.themeSetting['logo']['full_logo'],
          mini_logo :this.themeSetting['logo']['mini_logo']
      },*/
      background : {
       // bg_image :this.themeSetting['background']['bg_image'],
        bg_color : this.themeSetting['background']['bg_color']
      },
      customize : {
        // favicon_logo : this.themeSetting['customize']['button']
        favicon_logo : this.themeSetting['color_sets']['primary']['base']
      }
    });
  }
  onSubmit(form) {
    this.loader.display(true);
    localStorage.setItem('themeSettings', JSON.stringify(this.themeSetting));
    this.theme.generateColorTheme();
    this.loader.display(false);
    swal('Changes updated successfully!!!', '', 'success');
  }
  onColorChange(val, type) {
    const obj = {
      color : {
       type : val
      }
    };
    obj['color'][type] = val;
    this.themeSetting['color_sets'][type]['base'] = val;
    this.tsForm.patchValue (obj);
  }
  onBgColorChange(val) {
    const obj = {
      background : {
       type : val
      }
    };
    obj['background']['bg_color'] = val;
    this.themeSetting['background']['bg_color'] = val;
    this.tsForm.patchValue(obj);
  }
  openFileBrowser(id) {
    document.getElementById(id).click();
  }
  onImageChange(event, id, root) {
    const self = this;
    const reader = new FileReader();
    const _URL = window.URL ;

    // let fileBrowser = this.full_logo.nativeElement;
    const file = event.target.files[0];
    const img = new Image();
    const width = this.imageValidation[id]['width'];
    const height = this.imageValidation[id]['height'];
    reader.onload = function(e) {
      const img = new Image();
      img.src = _URL.createObjectURL(event.target.files[0]);
      img.onload = function() {
        /*var width = img.width;
        var height = img.height;*/
        if ( img.width >= width && img.height >= height) {
          self.themeSetting[root][id] = e.target['result'];
        } else {
          const msg = 'Should be greater than ' + width + ' X ' + height + ' resolution';
          swal(msg, '', 'error');
        }
      };
    };
    reader.readAsDataURL(event.target.files[0]);
  }
  removeBackground() {
    this.themeSetting['background']['bg_image'] = '';
  }
  cancel() {
    this.router.navigateByUrl('/explore');
  }
}
