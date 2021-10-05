import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { CommonService } from '@shared/services';
import { CanExit } from '@interTypes/canExit';
import { FormGroup } from '@angular/forms';
import { ClosedInventoryFormPayload } from '@interTypes/inventory-management';

@Component({
  selector: 'app-create-inventory',
  templateUrl: './create-inventory.component.html',
  styleUrls: ['./create-inventory.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateInventoryComponent implements OnInit, CanExit {

  selectedTab = 0;
  isShowAddressFields = false;
  isForPlaceForm = true;
  enableForDigitalForm = {isValid: false};
  isExistingUpdate = false;

  tab = Object.freeze({
    GENERAL: 0,
    NAMES_AND_ATTR: 1,
    MEDIA_CLASS: 2,
    MATERIAL: 3
  });

  generalForm: FormGroup;
  nameAndAttrForm: FormGroup;
  mediaClassForm: FormGroup;
  materialForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) private dialogData,
    private dialogRef: MatDialogRef<CreateInventoryComponent, ClosedInventoryFormPayload>,
    private cService: CommonService
  ) {
  }

  ngOnInit(): void {

  }


  submitInventoryForm() {

    this.dialogRef.close({
      general: this.generalForm?.value,
      nameAndAttr: this.nameAndAttrForm?.value,
      mediaClass: this.mediaClassForm?.value,
      materialDetails: this.materialForm?.value
    });

  }

  nameAttributeFormRefChange(event) {
    if (event) {
      this.nameAndAttrForm = event;

      this.nameAndAttrForm.controls.media_class.valueChanges.subscribe(value => {
        this.isForPlaceForm = value?.name != 'Roadside';
      });

      this.nameAndAttrForm.controls.digital.valueChanges.subscribe(value=> {
        this.enableForDigitalForm = {isValid: value};
      });
    }
  }

  async canDeactivate() {
    return this.close();
  }

  /**
   * @description
   *  Opening confirmation dialog if user has any changes in the form.
   *  else close directly.
   *
   */
  async close() {

    const msg = 'You have unsaved changes. Are you sure you want to leave this page?';
    const result = await this.cService.confirmExit({ dirty: this.areFormsDirty() } as any, msg);
    if (result) {
      this.dialogRef.close();
      return true;
    }
    return false;

  }

  selectTab(tabIndex: number) {
    if (this.validateGivenTabForm(tabIndex)) {
      this.selectedTab = tabIndex;
      this.makeFormAsDirty(this.selectedTab);
    }
  }

  /**
   * @description
   *  Move to next form and make next form dirty.
   *  User only can reach others tab from first tab
   *  at initially. So need to make next form dirty.
   *
   */
  next() {
    this.selectedTab = this.selectedTab + 1;
    this.makeFormAsDirty(this.selectedTab);
  }

  back() {
    this.selectedTab = this.selectedTab - 1;
  }

  /**
   * @description
   *  Validating current form for next btn to move next form
   */
  get validateCurrentForm(): boolean {
    return this.validateGivenTabForm(this.selectedTab, true);
  }

  /**
   * @description
   *   Can submit only in material details tab and that form should be
   *  valid. Which means if all forms valid only user can reach last tab
   *  and last tab also should be valid for submit.
   */
  get canSubmit(): boolean {
    return this.selectedTab == this.tab.MATERIAL && this.materialForm?.valid;
  }

  /**
   * @description
   *    Validate the current form and allowing to move next form(by next btn)
   *  or selected form(by selecting tab header).
   *
   * Conditions list to next btn
   *   Should be selected form
   *   Form should be valid
   *   No need to validate form dirty
   *
   * Conditions list to tab validation
   *   Should be selected tab and valid for current tab
   *                     Or
   *   For non current tabs Should be valid and dirty
   *
   * @param tabIndex
   * @param isForNextBtn - this call from next btn
   */
  validateGivenTabForm(tabIndex: number, isForNextBtn = false): boolean {
    if (this.selectedTab === tabIndex && !isForNextBtn) {
      return true;
    }

    switch (tabIndex) {
      case this.tab.GENERAL:
        return (
          (isForNextBtn || this.generalForm?.dirty) &&
          this.generalForm?.valid
        );

      case this.tab.NAMES_AND_ATTR:
        return (
          (isForNextBtn || this.nameAndAttrForm?.dirty) &&
          this.nameAndAttrForm?.valid
        );

      case this.tab.MEDIA_CLASS:
        return (
          (isForNextBtn || this.mediaClassForm?.dirty) &&
          this.mediaClassForm?.valid
        );

      case this.tab.MATERIAL:
        return (
          (isForNextBtn || this.materialForm?.dirty) &&
          this.materialForm?.valid
        );

      default:
        return false;
    }
  }

  private areFormsDirty() {
    return (
      this.generalForm?.dirty ||
      this.nameAndAttrForm?.dirty ||
      this.mediaClassForm?.dirty ||
      this.materialForm?.dirty
    );
  }

  /**
   * @description
   *  Making form dirty once its respected tab visited by the user
   * either by next function.
   *
   * @param tabIndex - {@type number}
   */
  private makeFormAsDirty(tabIndex: number){
    switch (tabIndex) {
      case this.tab.GENERAL:
        this.generalForm && !this.generalForm.dirty && this.generalForm.markAsDirty();
          break;

      case this.tab.NAMES_AND_ATTR:
        this.nameAndAttrForm &&  !this.nameAndAttrForm.dirty && this.nameAndAttrForm.markAsDirty();
        break;

      case this.tab.MEDIA_CLASS:
        this.mediaClassForm &&  !this.mediaClassForm.dirty && this.mediaClassForm.markAsDirty();
        break;

      case this.tab.MATERIAL:
        this.materialForm && !this.materialForm.dirty &&  this.materialForm.markAsDirty();
        break;

      default:
        return false;
    }
  }

}
