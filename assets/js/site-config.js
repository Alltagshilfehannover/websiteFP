/* =========================================================================
   Frontend-Konfiguration – hier die Supabase-Werte eintragen.
   (Direkt bearbeitbar, die Seite muss dafür NICHT neu gebaut werden.)

   Ein Supabase-Projekt bedient mehrere Websites. Jede Website hat einen
   eigenen SITE_KEY – daran erkennt die Datenbank, woher eine Anfrage kommt.
   Die erlaubten Schlüssel stehen in der Tabelle "websites":
       hannover  ·  braunschweig  ·  fensterputz
   >>> Bei jeder Website denselben SITE_KEY wie in der Datenbank eintragen. <<<

   Der anon-/public-Key darf öffentlich im Frontend stehen – das ist bei
   Supabase so vorgesehen. Die Sicherheit kommt aus Row Level Security:
   Mit diesem Key kann man NUR neue Einträge anlegen, aber KEINE lesen.
   >>> Den service_role-Key NIEMALS hier eintragen! <<<

   Solange SUPABASE_URL/-KEY leer sind, öffnet das Kontaktformular
   ersatzweise das E-Mail-Programm (mailto) und die Statistik bleibt aus.
   Einrichtung Schritt für Schritt: Supabase-Websites/ANLEITUNG.md
   ========================================================================= */
window.SITE_CONFIG = {
  /* --- Diese Website ------------------------------------------------- */
  SITE_KEY:          'fensterputz',      // Schlüssel dieser Website (siehe oben)

  /* --- Verbindung (für alle drei Websites identisch) ------------------ */
  SUPABASE_URL:      'https://klulpfmdwynuctiukpwy.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdWxwZm1kd3ludWN0aXVrcHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNzM3MjAsImV4cCI6MjEwMTk0OTcyMH0.cuQQ0I_dqLXb3eUn7Qc2UDysqaOke2xgQmYsSH9GV-g',

  /* --- Tabellen (nicht ändern) ---------------------------------------- */
  CONTACT_TABLE:     'kontaktanfragen',
  BEWERBUNG_TABLE:   'bewerbungen',
  BEWERBUNG_BUCKET:  'bewerbungen',
  TRACK_TABLE:       'seitenaufrufe',

  /* --- Ausweichweg, wenn Supabase nicht eingerichtet ist --------------- */
  FALLBACK_EMAIL:    'info@fensterputz-service.de'
};
