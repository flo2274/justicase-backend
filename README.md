# JustiCase Backend

Dies ist das Backend für die JustiCase-Anwendung, entwickelt mit Node.js, Express, Prisma und MySQL.

## Projektstruktur

- `app.js`: Hauptkonfigurationsdatei für Express.
- `server.js`: Startet den Server.
- `src/controllers`: Enthält Controller für Authentifizierung, Benutzer und Fälle.
- `src/middleware`: Enthält Middleware für Fehlerbehandlung und Prisma.
- `src/routes`: Definiert die Routen für Authentifizierung, Benutzer und Fälle.
- `src/services`: Enthält Dienstdateien, z.B. für Authentifizierung.
- `src/utils`: Nützliche Hilfsfunktionen.
- `schema.prisma`: Prisma-Schema für die Datenbank.

## Installation

1. Repository klonen:
    ```bash
    git clone <repository-url>
    ```

2. Abhängigkeiten installieren:
    ```bash
    npm install
    ```

3. `.env` Datei erstellen und die erforderlichen Umgebungsvariablen einfügen. Siehe `.env.template` für das Format.
    ##Beispiel .env Datei
    Erstellen Sie eine .env Datei im Stammverzeichnis und fügen Sie die folgenden Umgebungsvariablen hinzu:
    ```bash
    DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
    JWT_SECRET=IhrGeheimesJWTSecret
    ```

4. Datenbank-Seed ausführen:
    ```bash
    node src/prisma/seed.js
    ```

5. Datenbankschema migrieren:
    ```bash
    npx prisma migrate dev
    ```

## Start des Servers

Server im Entwicklungsmodus starten:
```bash
npm run dev
```
Der Server wird unter http://localhost:3000 laufen.



