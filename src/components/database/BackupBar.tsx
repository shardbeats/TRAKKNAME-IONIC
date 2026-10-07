import { IonButton } from "@ionic/react";
import type { MemoryDb } from "../../lib/db/memory";
import { resetDb } from "../../lib/db/store";
import { downloadText, exportDatabase, importDatabase } from "../../lib/services/library";

export const BackupBar: React.FC<{
  db: MemoryDb;
  onChanged: () => void;
  toast: (m: string) => void;
}> = ({ db, onChanged, toast }) => (
  <div className="trakk-panel" style={{ marginTop: 12 }}>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <IonButton
        size="small"
        fill="outline"
        onClick={async () => {
          try {
            const how = await downloadText("trakkname-backup.json", exportDatabase(db));
            if (how === "file") toast(`Exported ${db.words.length} words`);
            else if (how === "shared") toast("Shared JSON");
            else if (how === "clipboard") toast("Copy JSON to clipboard: share unavailable");
            else toast("Export cancelled or failed");
          } catch {
            toast("Export failed");
          }
        }}
      >
        Export JSON
      </IonButton>
      <label style={{ display: "inline-flex", alignItems: "center" }}>
        <input
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (!window.confirm("Import will merge (never silently overwrite). Continue?")) return;
            try {
              importDatabase(db, await f.text());
              onChanged();
              toast("Import merged");
            } catch {
              toast("Invalid JSON");
            }
          }}
        />
        <span className="trakk-chip">Import JSON</span>
      </label>
      <IonButton
        size="small"
        fill="outline"
        color="danger"
        onClick={() => {
          if (!window.confirm("Reset database to bundled seed? Local edits will be lost.")) return;
          resetDb();
          onChanged();
        }}
      >
        Reset to seed
      </IonButton>
    </div>
    <p className="trakk-muted">Migrations never overwrite edits. Import merges by id/name.</p>
  </div>
);
