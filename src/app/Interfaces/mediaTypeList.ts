export interface MediaTypeList {
  id?: any;
  name: string;
  count: any;
  value?: any;
  selected?: boolean;
  options?: MediaTypeList[];
}

export class MediaTypeNode {
  id?: any;
  name: string;
  count: any;
  selected?: boolean;
  children?: MediaTypeNode[];
  digital: string;
}
