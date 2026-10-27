export interface LookupItem {
  Id: string | number;
  Name: string;
  IsActive?: boolean;
  icon?: string;
  /** SVG asset paths for feature options that use the shared icon pattern. */
  iconSrc?: string;
  activeIconSrc?: string;
  /** Optional color class applied to the option icon (defaults to gray). */
  iconClass?: string;
  Children?: LookupItem[];
  EnrollmentId?: string | null;
  Mobile?: string;
}
