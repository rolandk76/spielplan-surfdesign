<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Spielplan – PHP (ohne API) + MySQL/MariaDB

Diese App läuft klassisch als PHP‑Site und spricht direkt mit MySQL/MariaDB. Keine Netlify/Vercel Functions, kein separater Node‑API‑Server nötig.

## Struktur

- `public/` – Document Root der App
  - `index.php` – Übersicht (DB‑Status, Turnierliste, Aktionen)
  - `_bootstrap.php` – .env laden und PDO‑Verbindung (`db_pdo()`)
  - `tournament_new.php` – neues Turnier anlegen
  - `tournament_view.php` – Turnier anzeigen
  - `tournament_edit.php` – Turnier bearbeiten
  - `tournament_delete.php` – Turnier löschen
- `mysql_schema.sql` – MySQL‑Schema (Tabellen `tournaments`, `users`)
- `mariadb_schema.sql` – Schema für MariaDB 10.4 (XAMPP)
- `mysql_data.sql` – Beispiel‑Daten (aus Postgres konvertiert)
- `.env.example` – Beispiel‑ENV für DB‑Zugang

React/Vite‑Dateien sind weiterhin im Repo (z. B. `App.tsx`), werden für den PHP‑Betrieb aber nicht benötigt.

## Lokale Einrichtung (XAMPP/MariaDB)

1. `.env` im Projektroot anlegen (oder vorhandene prüfen):
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=spielplan
   DB_USERNAME=root
   DB_PASSWORD=
   JWT_SECRET=dev-secret
   ```
2. Datenbank anlegen und Schema importieren (XAMPP Mac – root ohne Passwort):
   ```bash
   /Applications/XAMPP/bin/mysql -u root -h 127.0.0.1 -P 3306 -e "CREATE DATABASE IF NOT EXISTS spielplan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   /Applications/XAMPP/bin/mysql -u root -h 127.0.0.1 -P 3306 spielplan < mariadb_schema.sql
   /Applications/XAMPP/bin/mysql -u root -h 127.0.0.1 -P 3306 spielplan < mysql_data.sql  # optional
   ```
3. PHP‑Server starten (Document Root `public/`):
   ```bash
   php -S 127.0.0.1:8001 -t public
   ```
4. Öffnen: http://127.0.0.1:8001

## Deployment (z. B. Forge oder Shared Hosting)

1. Server mit PHP 8.2/8.3, MySQL/MariaDB bereitstellen.
2. Document Root auf `public/` setzen.
3. `.env` mit DB‑Zugang auf dem Server anlegen.
4. Schema importieren (`mysql_schema.sql` oder `mariadb_schema.sql` je nach Server), optional `mysql_data.sql`.

## Hinweise

- In MariaDB 10.4 wird JSON als LONGTEXT gespeichert. `mariadb_schema.sql` berücksichtigt das.
- `settings` und `matches` werden als JSON‑Strings in der DB abgelegt und in der Oberfläche angezeigt/bearbeitet.
- Möchtest du die Formular‑UI (Teams/Felder/Spielzeiten) statt JSON? Dann kann man `tournament_new.php`/`tournament_edit.php` entsprechend ausbauen.
