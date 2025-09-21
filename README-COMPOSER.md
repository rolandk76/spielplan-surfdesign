# Composer Integration für Spielplan Generator

## 📦 **Überblick**

Dieses Projekt verwendet Composer für PHP-Backend-Funktionalitäten und bessere Projektorganisation, obwohl es primär ein TypeScript/React-Frontend ist.

## 🚀 **Installation & Setup**

### **Voraussetzungen:**
- PHP >= 8.0
- Composer
- Node.js & npm

### **Komplettes Setup:**
```bash
# Alle Abhängigkeiten installieren
composer run setup

# Oder manuell:
composer install
npm install
```

## 🔧 **Verfügbare Composer-Kommandos**

### **Development:**
```bash
# Frontend entwickeln
composer run dev

# Tests ausführen
composer run test

# Code-Style prüfen
composer run cs-check

# Code-Style automatisch korrigieren
composer run cs-fix
```

### **Deployment:**
```bash
# Projekt bauen
composer run build

# Auf Netlify deployen
composer run deploy
```

## 📁 **PHP-Backend Struktur**

```
src/php/
├── Api/
│   └── TournamentApi.php      # Tournament API Handler
└── Utils/
    └── ScheduleGenerator.php  # Schedule Generation Utils

tests/
└── TournamentApiTest.php      # PHPUnit Tests
```

## 🏗️ **PHP-Klassen**

### **TournamentApi**
```php
use SpielplanGenerator\Api\TournamentApi;

$api = new TournamentApi();
$tournaments = $api->getTournaments($userId);
$api->saveTournaments($userId, $tournaments);
```

### **ScheduleGenerator**
```php
use SpielplanGenerator\Utils\ScheduleGenerator;

// Round-Robin generieren
$schedule = ScheduleGenerator::generateRoundRobin($teams);

// Playoff-Bracket generieren
$bracket = ScheduleGenerator::generatePlayoffBracket($teams, 'semi_final');

// Tabelle berechnen
$standings = ScheduleGenerator::calculateStandings($matches, $teams);
```

## 🧪 **Testing**

### **PHPUnit Tests ausführen:**
```bash
# Alle Tests
composer test

# Mit Coverage
vendor/bin/phpunit --coverage-html coverage-html
```

### **Test-Kategorien:**
- **TournamentApi**: CRUD-Operationen für Turniere
- **ScheduleGenerator**: Spielplan-Algorithmen
- **Validation**: Datenvalidierung

## 📊 **Code Quality**

### **PSR-12 Standard:**
```bash
# Code-Style prüfen
composer run cs-check

# Automatisch korrigieren
composer run cs-fix
```

## 🔄 **Integration mit Frontend**

### **Aktuelle Netlify Functions:**
Das Frontend nutzt bereits Netlify Functions (JavaScript). Die PHP-Klassen können als:

1. **Referenz-Implementation** für Algorithmen
2. **Alternative Backend-Option** 
3. **Testing & Validation** der Logik

### **Migration zu PHP-Backend:**
```php
// Beispiel: API-Endpoint
<?php
require 'vendor/autoload.php';

use SpielplanGenerator\Api\TournamentApi;

$api = new TournamentApi();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        echo json_encode($api->getTournaments($_GET['userId']));
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $api->saveTournaments($data['userId'], $data['tournaments']);
        break;
}
```

## 🎯 **Vorteile der Composer-Integration**

### **📦 Paket-Management:**
- **Autoloading**: PSR-4 Autoloader
- **Abhängigkeiten**: Saubere Dependency-Verwaltung
- **Versionierung**: Semantic Versioning

### **🔧 Development Tools:**
- **PHPUnit**: Automatisierte Tests
- **PHP CodeSniffer**: Code-Quality
- **Composer Scripts**: Vereinfachte Workflows

### **🏗️ Skalierbarkeit:**
- **Backend-Ready**: Einfache Migration zu PHP-Backend
- **API-Kompatibilität**: Gleiche Datenstrukturen
- **Testing**: Robuste Test-Suite

## 📈 **Nächste Schritte**

### **Erweiterte Features:**
1. **Database Integration** (MySQL/PostgreSQL)
2. **Authentication & Authorization**
3. **REST API Endpoints**
4. **WebSocket Support** für Live-Updates
5. **Export/Import** (PDF, Excel, CSV)

### **Performance Optimierung:**
1. **Caching** (Redis/Memcached)
2. **Database Indexing**
3. **API Rate Limiting**
4. **Background Jobs** (Queue System)

## 🌐 **Deployment-Optionen**

### **Aktuelle Lösung:**
- **Frontend**: Netlify (Static Hosting)
- **Backend**: Netlify Functions (JavaScript)

### **PHP-Backend Alternativen:**
- **Shared Hosting**: Standard PHP Hosting
- **VPS/Cloud**: DigitalOcean, AWS, Google Cloud
- **Docker**: Containerized Deployment
- **Kubernetes**: Scalable Container Orchestration

---

**Das Composer-Setup macht das Projekt professioneller und bereitet es für zukünftige Backend-Erweiterungen vor!** 🚀✨
