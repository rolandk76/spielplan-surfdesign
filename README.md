<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Spielplan – Forge Deployment (PHP + MySQL)

Dieses Repository ist für das Hosting auf Laravel Forge vorbereitet. Es enthält eine minimale PHP-App unter `public/` mit einer MySQL-Verbindung sowie ein MySQL-Schema, das aus einem PostgreSQL-Dump konvertiert wurde.

## Struktur

- `public/index.php` – Einstiegspunkt der App (Document Root auf Forge auf `public/` setzen)
- `mysql_schema.sql` – MySQL-Schema (Tabellen `tournaments`, `users`)
- `neon_backup.sql` – ursprünglicher PostgreSQL-Dump (Quelle)
- `.env.example` – Beispiel-Umgebungsvariablen für die Datenbank

## Voraussetzungen

- PHP (Forge-Server), empfohlen PHP 8.2 oder 8.3
- MySQL 8.0+

## Deployment auf Forge

1. Repository verbinden: `rolandk76/spielplan-surfdesign`, Branch `main`.
2. Site erstellen: Typ „PHP“, Document Root: `public`.
3. Environment anlegen: `.env` basierend auf `.env.example` mit deinen DB-Zugangsdaten.
4. (Optional) SSL via Let’s Encrypt aktivieren.

## Datenbank einrichten

1. Auf Forge eine MySQL-Datenbank + Benutzer erstellen (z. B. DB `spielplan`, User `forge`).
2. Schema importieren:
   ```bash
   mysql -u <user> -p -h <host> -P 3306 <db_name> < mysql_schema.sql
   ```
3. (Optional) Daten migrieren: Der bereitgestellte PostgreSQL-Dump `neon_backup.sql` enthält Daten. Für einen direkten Import in MySQL müssen die INSERTs konvertiert werden (JSON bleibt, Timestamps ohne Zeitzone, UUIDs als `CHAR(36)`). Falls gewünscht, können wir ein konvertiertes `mysql_data.sql` erzeugen.

## Lokales Testen

1. `.env` anlegen (siehe `.env.example`).
2. Einen lokalen MySQL-Server bereitstellen und `mysql_schema.sql` importieren.
3. Einen PHP-Server starten (z. B. Symfony/PHP built-in):
   ```bash
   php -S 127.0.0.1:8000 -t public
   ```
4. Öffne `http://127.0.0.1:8000` – die Startseite zeigt die DB-Verbindung und listet optional `tournaments`.

## Hinweise zur Konvertierung (PostgreSQL → MySQL)

- `jsonb` → `JSON`
- `timestamp with time zone` → `DATETIME(6)` (Zeitzonenanteil entfernen)
- `uuid` → `CHAR(36)`
- `DEFAULT now()` → `CURRENT_TIMESTAMP(6)`
- Schema-Präfixe (`public.`) und Typ-Casts (`::jsonb`) wurden entfernt.

Wenn du die Daten aus `neon_backup.sql` in MySQL benötigst, sag Bescheid – ich generiere ein passendes `mysql_data.sql` und liefere die Import-Befehle mit.
