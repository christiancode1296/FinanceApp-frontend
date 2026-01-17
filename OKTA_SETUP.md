# Okta Setup-Anleitung - Behebung des "access_denied" Fehlers

## Problem
Sie erhalten den Fehler: "Die Richtlinienauswertung ist für diese Anforderung fehlgeschlagen"

Dies bedeutet, dass die **Access Policy** in Ihrem Okta Authorization Server den Authorization Code Flow nicht erlaubt.

## Lösung: Schritt-für-Schritt Anleitung

### 1. Gehen Sie zu Security → API → Authorization Servers

1. Öffnen Sie Ihr Okta Developer Dashboard: https://integrator-7219975-admin.okta.com
2. Klicken Sie im linken Menü auf **Security** → **API**
3. Klicken Sie auf **Authorization Servers**
4. Klicken Sie auf **default**

### 2. Überprüfen Sie die Access Policies

1. Klicken Sie auf den Tab **Access Policies**
2. **Falls KEINE Policy existiert:**
   - Klicken Sie auf **Add New Access Policy**
   - Name: `Default Policy`
   - Description: `Default access policy for all clients`
   - Assign to: **All clients**
   - Klicken Sie auf **Create Policy**

3. **Falls eine Policy existiert:**
   - Klicken Sie auf die Policy
   - Überprüfen Sie die Rules

### 3. Erstellen oder Bearbeiten Sie eine Access Policy Rule

1. Innerhalb der Policy klicken Sie auf **Add Rule** (oder bearbeiten Sie die existierende Rule)
2. Konfigurieren Sie folgende Einstellungen:

   **Rule Name:**
   ```
   Default Rule
   ```

   **IF Grant type is:**
   - ✅ **Authorization Code**
   - ✅ **Refresh Token** (optional, aber empfohlen)
   - ❌ Implicit (kann deaktiviert bleiben)

   **AND User is:**
   - Wählen Sie: **Any user assigned to the application**
   
   **AND Scopes requested:**
   - Wählen Sie: **Any scopes**
   - ODER spezifisch: `openid`, `profile`, `email`

   **THEN Access token lifetime is:**
   - Lassen Sie den Standard: `1 hour`

   **AND Refresh token lifetime is:**
   - Lassen Sie den Standard: `Unlimited` oder `7 days`

3. Klicken Sie auf **Create Rule**

### 4. Überprüfen Sie die Application Settings

1. Gehen Sie zu **Applications** → **Applications**
2. Klicken Sie auf Ihre Application (Client ID: `0oaz2z1rjnImBxsOA697`)

**Stellen Sie sicher:**

- **Application type:** Single-Page Application (SPA)

- **Grant types:**
  - ✅ Authorization Code
  - ✅ Refresh Token (optional)

- **Sign-in redirect URIs:**
  ```
  http://localhost:8081/login/callback
  ```

- **Sign-out redirect URIs:**
  ```
  http://localhost:8081/login
  ```

- **Assignments:**
  - Stellen Sie sicher, dass mindestens ein User oder eine Group zugewiesen ist
  - Oder: Enable "Allow everyone in your organization to access"

### 5. Trusted Origins (Wichtig!)

1. Gehen Sie zu **Security** → **API** → **Trusted Origins**
2. Klicken Sie auf **Add Origin**

**Konfiguration:**
- **Name:** `Localhost Development`
- **Origin URL:** `http://localhost:8081`
- **Type:** Wählen Sie BEIDE:
  - ✅ CORS
  - ✅ Redirect

3. Klicken Sie auf **Save**

### 6. Testen Sie die Konfiguration

1. Starten Sie Ihre Anwendung neu (falls noch nicht geschehen)
2. Öffnen Sie: http://localhost:8081/login
3. Öffnen Sie die Browser-Konsole (F12)
4. Klicken Sie auf "Mit Okta anmelden"
5. Sie sollten jetzt zur Okta-Login-Seite weitergeleitet werden

## Häufige Probleme

### Problem: "access_denied" - Fehlercode: access_denied
**Lösung:** Die Access Policy erlaubt den Authorization Code Flow nicht
→ Folgen Sie Schritt 3 oben

### Problem: "invalid_client" 
**Lösung:** Die Client ID oder das Secret ist falsch
→ Überprüfen Sie die .env Datei

### Problem: "redirect_uri_mismatch"
**Lösung:** Die Redirect URI in der Anwendung stimmt nicht mit Okta überein
→ Überprüfen Sie Schritt 4

### Problem: CORS-Fehler in der Browser-Konsole
**Lösung:** Trusted Origin fehlt
→ Folgen Sie Schritt 5

## Debug-Informationen

Wenn Sie die Anwendung öffnen, sollten Sie in der Browser-Konsole sehen:

```
=== Okta Configuration ===
Issuer: https://integrator-7219975.okta.com/oauth2/default
ClientId: 0oaz2z1rjnImBxsOA697
RedirectUri: http://localhost:8081/login/callback
==========================
✅ OktaAuth erfolgreich initialisiert
```

Beim Klick auf "Mit Okta anmelden":
```
🔄 Starte Login-Redirect...
✅ Redirect gestartet
```

## Weitere Hilfe

Wenn es immer noch nicht funktioniert, überprüfen Sie:

1. **Okta System Log:**
   - Reports → System Log
   - Filtern Sie nach Ihrer Application
   - Hier sehen Sie genau, warum der Zugriff verweigert wurde

2. **Browser-Konsole:**
   - Suchen Sie nach detaillierten Fehlermeldungen
   - Screenshot machen und analysieren

3. **Network Tab:**
   - Öffnen Sie F12 → Network
   - Filtern Sie nach "authorize" oder "token"
   - Überprüfen Sie die Request/Response Details

