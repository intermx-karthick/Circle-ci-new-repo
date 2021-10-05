export enum Patterns {
  NUMERIC = '^[0-9,-]*(.[0-9]*)$',
  EXT_PATTERN = '^[0-9-+]*$',
  COMMA_SEPARATED_NUMBER = '^[0-9,]*$',
  DECIMAL_NUMBER = '^[0-9]*(.[0-9]*)$'
}

export const AppRegularExp = Object.seal({
  DECIMAL: new RegExp(/^[0-9.]+$/g), // use this only for directive,
  CSV: /(\.csv)$/,
  PDF: /(\.pdf)$/,
  ZIP: /(\.zip)$/,
  XLS: /(\.xls)$/
});
