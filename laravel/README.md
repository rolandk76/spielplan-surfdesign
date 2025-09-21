# Spielplan App - Laravel Edition

Eine moderne, professionelle Turnier-Management-Anwendung basierend auf Laravel mit responsivem Design und vollständiger CRUD-Funktionalität.

## Features

- **Modern Dashboard** mit Live-Statistiken
- **Tournament Management** (Erstellen, Anzeigen, Bearbeiten, Löschen)
- **Automatische Spielplan-Generierung** mit Round-Robin-Algorithmus
- **Live-Tabellen-Berechnung** mit verschiedenen Punktesystemen
- **Inline Match-Ergebnis-Eingabe** ohne Page Reload
- **Responsive Design** für Desktop, Tablet und Mobile
- **Professional UI/UX** mit Tailwind CSS

## Tech Stack

- **Laravel 12** - Modern PHP Framework
- **Eloquent ORM** - Database Management
- **Blade Templates** - Server-side Rendering
- **Tailwind CSS** - Utility-first CSS Framework
- **MySQL/SQLite** - Database Support
- **UUID** - Primary Keys für bessere Skalierbarkeit

## Installation

### Voraussetzungen
- PHP 8.2+
- Composer
- MySQL/MariaDB (für Produktion) oder SQLite (für Entwicklung)

### Setup

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd spielplan-laravel
   ```

2. **Dependencies installieren**
   ```bash
   composer install
   ```

3. **Environment konfigurieren**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Database konfigurieren**
   
   **Für lokale Entwicklung (SQLite):**
   ```bash
   # .env bereits konfiguriert für SQLite
   touch database/database.sqlite
   ```
   
   **Für Produktion (MySQL):**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=spielplan
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

5. **Database Migration**
   ```bash
   php artisan migrate
   ```

6. **Development Server starten**
   ```bash
   php artisan serve
   ```

Die App ist dann verfügbar unter: `http://127.0.0.1:8000`

## Verwendung

### Dashboard
- Übersicht über alle Turniere
- Live-Statistiken (Gesamt, Diese Woche, Heute)
- Quick Actions für häufige Aufgaben

### Turnier erstellen
1. "Neues Turnier" Button klicken
2. Formular ausfüllen:
   - Turniername
   - Anzahl Teams/Felder
   - Zeitplanung (Start, Dauer, Pausen)
   - Punktesystem auswählen
   - Team- und Feldnamen eingeben
3. "Spielplan generieren" - automatische Erstellung

### Ergebnisse eingeben
1. Turnier öffnen
2. Bei einem Spiel "Bearbeiten" klicken
3. Satz-Ergebnisse eingeben
4. Speichern - Tabelle wird automatisch aktualisiert

### Erweiterte Bearbeitung
- JSON-Editor für komplexe Konfigurationen
- Vollständige Kontrolle über Einstellungen und Spiele
- Syntax-Highlighting und Validierung

## Architektur

### Models
- `Tournament` - Eloquent Model mit UUID, JSON-Casting

### Controllers
- `TournamentController` - Resource Controller mit CRUD + Match Updates

### Services
- `ScheduleService` - Business Logic für Spielplan-Generierung und Tabellen-Berechnung

### Views
- `layouts/app.blade.php` - Master Layout
- `tournaments/index.blade.php` - Dashboard
- `tournaments/create.blade.php` - Erstellungsformular
- `tournaments/show.blade.php` - Turnier-Ansicht mit Spielen und Tabelle
- `tournaments/edit.blade.php` - JSON-Editor

## Deployment

### Laravel Forge
1. Server erstellen (PHP 8.2+, MySQL)
2. Site erstellen mit Repository-Verbindung
3. Environment Variables konfigurieren
4. SSL aktivieren (Let's Encrypt)
5. Deployment-Script ausführen

### Shared Hosting
1. `composer install --no-dev --optimize-autoloader`
2. `php artisan config:cache`
3. `php artisan route:cache`
4. `php artisan view:cache`
5. Files hochladen, Document Root auf `public/` setzen

### Docker
```dockerfile
FROM php:8.2-apache
# ... weitere Konfiguration
```

## Testing

```bash
# Unit Tests
php artisan test

# Feature Tests
php artisan test --testsuite=Feature

# Coverage Report
php artisan test --coverage
```

## Performance

- **Eloquent ORM** für optimierte Database Queries
- **Blade Caching** für schnelles Template Rendering
- **Route Caching** für bessere Performance
- **Config Caching** für Produktionsumgebungen

## Security

- **CSRF Protection** für alle Forms
- **SQL Injection Prevention** durch Eloquent ORM
- **XSS Protection** durch Blade Escaping
- **Input Validation** mit Laravel Rules

## Responsive Design

- **Mobile First** Approach
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch-friendly** Interface
- **Progressive Enhancement**

## UI/UX Features

- **Smooth Animations** und Transitions
- **Loading States** für bessere UX
- **Error Handling** mit User-friendly Messages
- **Accessibility** (ARIA Labels, Keyboard Navigation)
- **Dark Mode Ready** (Tailwind CSS)

## Konfiguration

### Punktesysteme
- **Per Set**: 1 Punkt pro gewonnenem Satz
- **Match 3-2-1**: 3 Punkte für Sieg ohne Satzverlust, 2 mit Satzverlust, 1 für Niederlage mit Satzgewinn
- **Match 2-1-0**: 2 Punkte für Sieg, 1 für Unentschieden
- **Match 1-0**: 1 Punkt für Sieg

### Tiebreaker
1. Punkte
2. Satzdifferenz oder Balldifferenz
3. Direkter Vergleich
4. Teamname (alphabetisch)

## Roadmap

- [ ] **User Authentication** (Multi-Tenant)
- [ ] **Real-time Updates** (WebSockets)
- [ ] **PDF Export** für Spielpläne
- [ ] **API Endpoints** für Mobile Apps
- [ ] **Tournament Templates**
- [ ] **Statistics Dashboard**
- [ ] **Email Notifications**

## Contributing

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Changes committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request öffnen

## License

Dieses Projekt ist unter der [MIT License](LICENSE) lizenziert.

## Acknowledgments

- **Laravel Framework** - Für die solide Basis
- **Tailwind CSS** - Für das moderne Design-System
- **Heroicons** - Für die schönen Icons
