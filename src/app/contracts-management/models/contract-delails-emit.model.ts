import { FormGroup } from "@angular/forms";
import { CreateUpdateContract } from "./create-contract.model";

export interface ContractDetailsEmit {
    form: FormGroup,
    model: CreateUpdateContract
  }