import { IonLabel, IonSegment, IonSegmentButton } from "@ionic/react";
import type { DbSection } from "./dbRemove";

export const SectionTabs: React.FC<{
  section: DbSection;
  onChange: (s: DbSection) => void;
}> = ({ section, onChange }) => (
  <IonSegment value={section} onIonChange={(e) => onChange(String(e.detail.value) as DbSection)} scrollable>
    <IonSegmentButton value="genres">
      <IonLabel>Genres</IonLabel>
    </IonSegmentButton>
    <IonSegmentButton value="words">
      <IonLabel>Words</IonLabel>
    </IonSegmentButton>
    <IonSegmentButton value="artists">
      <IonLabel>Artists</IonLabel>
    </IonSegmentButton>
    <IonSegmentButton value="patterns">
      <IonLabel>Patterns</IonLabel>
    </IonSegmentButton>
    <IonSegmentButton value="moods">
      <IonLabel>Moods</IonLabel>
    </IonSegmentButton>
  </IonSegment>
);
