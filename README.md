# JustiCase Backend

Dies ist das Backend für die Justicase-Anwendung, entwickelt mit Node.js, Express, Prisma und MySQL.


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

1. Repository klonen oder Datei öffnen

2. Abhängigkeiten installieren:
    ```bash
    npm install
    ```

3. Datenbank erstellen

4. `.env` Datei erstellen und die erforderlichen Umgebungsvariablen einfügen. Siehe `.env.template` für das Format.

4. Datenbankschema migrieren:
    ```bash
    npx prisma migrate dev
    ```

5. (Optional) Datenbank-Seed ausführen um sie mit Beispiel Nutzern zu füllen:
    ```bash
    node src/prisma/seed.js
    ```


## Start des Servers

Server im Entwicklungsmodus starten:
```bash
npm run dev
```
Der Server wird unter http://localhost:3000 laufen.


## Beispiel Nutzer

Mit den folgenden Beispiel Daten kann sich eingeloggt werden, nachdem der Seed ausgeführt wurde. Man kann aber auch einfach neue Nutzer registrieren.

- Email: eve@example.com

- Passwort: password123