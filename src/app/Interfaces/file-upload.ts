export interface FileUploadConfig {
  sizeLimit?: number;  // Example 10 - 10MB
  acceptedFormats?: string[]; // Example ['csv', 'pdf']
  acceptMulitpleFiles: boolean;
  sizeValidationMessage?: string;
  formatValidationMessage?: string;
  displayFileHint?: boolean;
}