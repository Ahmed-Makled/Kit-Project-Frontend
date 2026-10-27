export interface Column {
  Name: string;
  Title: string;
  Sortable: boolean;
  Selectable: boolean;
  IsHidden?: boolean;
  Annotation?: string;
  Percentage?: boolean;
  IsVisible?: boolean;
}
