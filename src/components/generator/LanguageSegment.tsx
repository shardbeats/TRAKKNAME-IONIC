import { IonLabel, IonSegment, IonSegmentButton } from "@ionic/react";

export interface LanguageSegmentProps {
  language: string;
  onChange: (v: "en" | "es") => void;
}

/** EN/ES switch (pool follows language — handled in the state hook). */
export const LanguageSegment: React.FC<LanguageSegmentProps> = ({ language, onChange }) => (
  <IonSegment value={language} onIonChange={(e) => onChange(String(e.detail.value) as "en" | "es")}>
    <IonSegmentButton value="en">
      <IonLabel>English</IonLabel>
    </IonSegmentButton>
    <IonSegmentButton value="es">
      <IonLabel>Spanish</IonLabel>
    </IonSegmentButton>
  </IonSegment>
);
