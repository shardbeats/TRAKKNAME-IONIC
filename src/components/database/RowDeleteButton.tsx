import { IonButton } from "@ionic/react";
import type { DbSection } from "./dbRemove";

export const RowDeleteButton: React.FC<{
  kind: DbSection;
  id: number;
  label: string;
  onDelete: (kind: DbSection, id: number, label: string) => void;
}> = ({ kind, id, label, onDelete }) => (
  <IonButton
    slot="end"
    size="small"
    fill="clear"
    color="danger"
    onClick={() => onDelete(kind, id, label)}
  >
    Delete
  </IonButton>
);
