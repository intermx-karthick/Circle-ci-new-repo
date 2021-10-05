import {Component, Input, OnDestroy, OnInit, Inject} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {CommonService} from '@shared/services/common.service';
import {WorkSpaceService} from '@shared/services/work-space.service';
import {WorkSpaceDataService} from '@shared/services/work-space-data.service';
import {takeWhile} from 'rxjs/operators';
import { MatSnackBarConfig } from '@angular/material/snack-bar/snack-bar-config';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-explore-save-package',
  templateUrl: './explore-save-package.component.html',
  styleUrls: ['./explore-save-package.component.less']
})
export class ExploreSavePackageComponent implements OnInit, OnDestroy {
  workspaceForm: FormGroup;
  multiInventoryPackagesForm: FormGroup;
  editInventories = [];
  inventoryPackages: any = [];
  failedPackages = [];
  currentPackage: any;
  editPackage = false;
  savePackageFromTabular = false;
  editPackageTabular = false;
  private unSubscribe = true;
  selectedPackage: any = {};
  inventories: any = [];
  from: any = '';
  type: any = '';
  addedPackage = '';
  clientId = '';
  constructor(
    private fb: FormBuilder,
    private _cService: CommonService,
    private workSpaceService: WorkSpaceService,
    private workSpaceDataService: WorkSpaceDataService,
    private matSnackBar: MatSnackBar,
    // private loaderService: LoaderService,
    // public dialog: MatDialog,
    public dialogRef: MatDialogRef<ExploreSavePackageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
    ) { }
  ngOnInit() {
    // TODO : Inventory set component doesn't need to care about selected or not, we should just pass the selected array only.
    // TODO : Refactor this
    this.inventories = this.data.inventories.filter(place => place.selected);
    /*if (this.inventories.length > 2000) {
      this.dialogRef.close();
      swal('Warning', 'Inventory Sets are limited to 2000 units', 'warning');
    }*/
    this.from = this.data.from;
    this.type = this.data.type;
    this.clientId = this.data.clientId;
    if (this.type === 'edit') {
      this.selectedPackage = this.data.package;
    }
    this.workspaceForm = this.fb.group({
      'name': ['', [Validators.required]],
      'name_key': [''],
      'id': [''],
      'description': [''],
    }, {validator: this.checkUniqueName('name')});
    this.initializeForm();
    this.workSpaceService
      .getExplorePackages()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(packages => {
        this.inventoryPackages = packages['packages'] || [];
        this.initializeForm();
      });
      if (this.type === 'edit') {
        this.editPackages(this.selectedPackage, this.data.saveFromFilter);
      }
  }
  initializeForm() {
    this.multiInventoryPackagesForm = this.fb.group({
      package: this.buildPackages()
    });
  }
  ngOnDestroy() {
    this.unSubscribe = false;
  }
  buildPackages() {
    this.inventoryPackages.map((inventoryPackage) => inventoryPackage.selected = false);
    const arr = this.inventoryPackages.map(inventoryPackage => {
      return this.fb.control(inventoryPackage.selected);
    });
    return this.fb.array(arr);
  }
  get packages() {
    return this.multiInventoryPackagesForm.get('package');
  }
  checkUniqueName(name: string) {
    return (group: FormGroup) => {
      const packages = this.inventoryPackages;
      const nameInput = group.controls[name];
      const nameKeyInput = group.controls['name_key'];
      if (packages.length > 0 && (nameKeyInput.value === '' || nameInput.value !== nameKeyInput.value)) {
        const p = packages.filter(function(value) {
          if (value.name != null) {
            return ((value.name).toLowerCase() === (nameInput.value).toLowerCase());
          }
        });
        if (p.length > 0) {
          return nameInput.setErrors({uniqueName: true});
        } else {
          return nameInput.setErrors(null);
        }
      }
    };
  }
  onSubmit(formGroup) {
    this._cService.validateFormGroup(formGroup);
    formGroup.controls.name.setValue(formGroup.value.name.trim());
    (!formGroup.value.name) ? formGroup.controls.name.setErrors({required: true}) : '';
    if (formGroup.valid) {
      if (!(formGroup.value.name_key !== '' && formGroup.value.name_key != null)) {
        this.updateInventory();
      }
     this.submitDataToServer(formGroup.value);
    }
  }
  public editPackages(p, saveFromFilter = false) {
    this.editPackage = true;
    this.workspaceForm.patchValue({
      name: p.name,
      name_key: p.name,
      description: p.description,
      id: p['_id']
    });
    if (saveFromFilter) {
      this.editInventories[0] = p.inventory;
    } else {
      this.updateInventory();
    }
  }
  /**
   * This method is to update the inventory units in the package
   * @param editExisting Set True if updating existing inventory package
   * @param inventoryPackage Pass the package while updating existing packages
   * @param position This is the position of selected package to keep track when API fails
   */
  updateInventory(editExisting = false, inventoryPackage = {}, position = 0) {
    const selected = [];
    if (this.from === 'tabular') {
      // TODO : Need to handle custom inventory from tabular view in future
      this.inventories.map(place => {
        const index = selected.findIndex(placeData => placeData.id === place.fid);
        if (index === -1) {
          selected.push({'id': place.fid, 'type': 'geopathPanel'});
        }
      });
    } else if (this.from === 'scenarios') {
      this.inventories.map(place => {
        const index = selected.findIndex(placeData => placeData.id === place.sid && placeData.type === place.type);
        if (index === -1) {
          selected.push({'id': place.sid, 'type': place.type});
        }
      });
    }else if (this.from === 'newWorkspace') {
      this.inventories.map(place => {
          selected.push({'id': place['spot_id'], 'type': 'geopathPanel'});
      });
    } else {
      this.inventories.map(place => {
        const index = selected.findIndex(placeData => (placeData.id === place.fid && placeData.type === place.type));
        if (index === -1) {
          selected.push({'id': place.fid, 'type': place.type});
        }
      });
    }

    if (editExisting) {
      selected.map((inventory) => {
        if (inventoryPackage['inventory'].findIndex(option => (option.id === inventory.id && option.type === inventory.type)) === -1) {
          inventoryPackage['inventory'].push(inventory);
        }
      });
      setTimeout(() => {
        this.editInventories[position] = inventoryPackage['inventory'];
        return inventoryPackage['inventory'];
      }, 500);
    } else {
      this.editInventories[position] = selected;
    }
  }

  /**
   * This method is to update selected  existing packages
   * @param formGroup Selected packages data
   */
  updateSelectedInventoryPackages(formGroup) {
    this.failedPackages = [];
    const lastSelectedPackageIndex = formGroup.value.package.lastIndexOf(true);
    this.inventoryPackages.map((inventoryPackage, index) => {
      if (formGroup.value.package[index]) {
        this.submitDataToServer({id: inventoryPackage['_id'], name: inventoryPackage.name,
          name_key: inventoryPackage.name, description: inventoryPackage.description},
           true, <any>this.updateInventory(true, inventoryPackage, index), index, lastSelectedPackageIndex );
      }
    });
  }

  /**
   * This method is to submit inventory package to server
   * @param updateExisting Set true if updating existing packages
   * @param inventories Inventory units in a set of selected package
   * @param selectedPackageIndex This is index of current package we are updating
   * @param lastSelectedPackageIndex This is index of the last package in slected packages list
   */
  submitDataToServer(inventoryPackage, updateExisting = false, inventories = [], selectedPackageIndex = 0, lastSelectedPackageIndex = 0) {
    if (inventories.length > 0) {
      this.editInventories[selectedPackageIndex] = inventories;
    }
    inventoryPackage.client_id = this.clientId;
    setTimeout(() => {
      this.workSpaceService
      .saveExplorePackage(inventoryPackage, this.editInventories[selectedPackageIndex])
      .subscribe(success => {
        if (this.type === 'add') {
          this.addedPackage = success['data']['id'];
        }
        if (this.type === 'edit') {
          this.addedPackage =  this.selectedPackage['_id'];
        }
        if(this.from !== 'newWorkspace'){
            if (updateExisting) {
              if (selectedPackageIndex === lastSelectedPackageIndex) {
                this.saveSetsToLocalStorage(updateExisting, inventoryPackage);
              }
            } else {
              this.saveSetsToLocalStorage(updateExisting, inventoryPackage);
            }
        }else{
          this.displaySuccessMessage();
        }

      },
      e => {
        let message = 'An error has occurred. Please try again later.';
        if (typeof e.error !== 'undefined' && typeof e.error.message !== 'undefined') {
          const errorCode = e?.error?.code;
          if (errorCode === 6003) {
            message = 'Please enter the inventory set name';
          } else if (errorCode === 6017) {
            message = 'Inventory Set names must be unique. Please add to existing set or use a unique name.';
          } else {
            message = e.error.message;
          }
        }

        if (updateExisting) {
          this.failedPackages.push(inventoryPackage.name);
          if (selectedPackageIndex === lastSelectedPackageIndex) {
            this.displayFinalMessageForMultiCall();
          }
        } else {
          this.showMessage(message);
        }
      });
    }, 1500);
  }

  /**
   * This method is to update packages list in local storage
   * @param updateExisting Set true if updating existing packages
   */
  saveSetsToLocalStorage(updateExisting, inventoryPackage = {}) {
    this.workSpaceService.getExplorePackages().subscribe(response => {
      let packs = [];
      if (typeof response['packages'] !== 'undefined' && response['packages'].length > 0) {
         packs = response['packages'];
      }
      this.workSpaceDataService.setPackages(packs);
      if (typeof this.selectedPackage['_id'] !== 'undefined') {
        const p = packs.find(pack => pack['_id'] === this.selectedPackage['_id']);
        if (p && typeof p['_id'] !== 'undefined') {
          this.workSpaceDataService.setSelectedPackage(p);
        }
      }
      if (updateExisting) {
        this.displayFinalMessageForMultiCall();
      } else {
        this.displaySuccessMessage();
      }
    });
  }
  /**
   * This method is to display the message after updating all selected inventory packages
   */
  displayFinalMessageForMultiCall() {
    this.dialogRef.close({addedPackage: this.addedPackage});
    this.multiInventoryPackagesForm.reset();
    if (this.failedPackages.length > 0) {
      const message = 'Updating following packages ' + this.failedPackages.join(',') + ' failed';
      this.showMessage(message);
    } else {
      this.showMessage('Your Inventory Set saved successfully.');
    }
  }

  displaySuccessMessage() {
    this.dialogRef.close({addedPackage: this.addedPackage});
    this.showMessage('Your Inventory Set saved successfully.');
  }

  showMessage(message:string){
  const config = {
      duration: 3000
    } as MatSnackBarConfig;
    this.matSnackBar.open(message, '', config);   
  }

}
