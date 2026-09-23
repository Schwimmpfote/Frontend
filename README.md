# Produktionsverwaltung – Frontend

Dieses Projekt stellt das Angular-Frontend einer Anwendung zur Erfassung und Auswertung von Produktions- und Verkaufsdaten dar.

Die Anwendung ermöglicht es, Arbeitsprozesse und Performance-Daten zu erfassen sowie die gespeicherten Daten über verschiedene Zeiträume auszuwerten.

## Funktionen

Das Frontend besteht aus drei zentralen Bereichen:

- **Arbeitsprozess**
  - Erfassung eines ausgeführten Arbeitsschritts
  - Auswahl eines Arbeitsschritts aus den vom Backend bereitgestellten Arbeitsschritten
  - Erfassung der Arbeitsdauer
  - Erfassung der bearbeiteten Menge
  - Auswahl des zugehörigen Tages
  - Speicherung des Arbeitsprozesses über die REST-API

- **Performance**
  - Erfassung von Produktionsmengen
  - Erfassung von Verkaufsmengen
  - Auswahl zwischen den Kategorien `Production` und `Sale`
  - Zuordnung eines Datensatzes zu einem bestimmten Tag
  - Speicherung über die REST-API

- **Evaluation**
  - Auswertung der Produktions- und Verkaufsdaten
  - Tagesauswertung
  - Wochenauswertung
  - Monatsauswertung
  - Jahresauswertung
  - Benutzerdefinierter Zeitraum
  - Zusammenfassung von Produktion, Verkauf und Differenz
  - Auswertung nach Arbeitsschritt
  - Tagesübersicht

---

## Technologie

Das Frontend basiert auf:

- Angular
- TypeScript
- HTML
- CSS
- Angular Reactive Forms
- Angular Router
- Angular HttpClient
- RxJS

Die Anwendung verwendet Standalone Components und Lazy Loading über den Angular Router.

---

## Projektstruktur

Eine vereinfachte Struktur des Frontends sieht folgendermaßen aus:

```text
src/
├── app/
│   ├── evaluation/
│   │   ├── evaluation.component.ts
│   │   ├── evaluation.html
│   │   └── evaluation.css
│   │
│   ├── performance-record/
│   │   ├── performance-record.component.ts
│   │   ├── performance-record.html
│   │   └── performance-record.css
│   │
│   ├── workprocess/
│   │   ├── workprocess.component.ts
│   │   ├── workprocess.html
│   │   └── workprocess.css
│   │
│   ├── services/
│   │   ├── performance-api.service.ts
│   │   └── production-api.service.ts
│   │
│   ├── models/
│   │   ├── evaluation.ts
│   │   ├── performance-record.ts
│   │   └── workprocess.ts
│   │
│   ├── shared/
│   │   └── utils/
│   │       └── date.util.ts
│   │
│   ├── app.ts
│   ├── app.html
│   ├── app.css
│   └── app.routes.ts
│
└── ...
```

Die tatsächliche Angular-Projektstruktur kann je nach verwendeter Angular-Version und Projektkonfiguration leicht abweichen.

---

## Navigation

Die Anwendung besitzt drei Hauptrouten.

| Route | Funktion |
|---|---|
| `/workprocess` | Arbeitsprozesse erfassen |
| `/performance_record` | Performance-Daten erfassen |
| `/evaluation` | Produktionsdaten auswerten |

Beim Aufruf der Root-Route `/` wird automatisch auf `/evaluation` weitergeleitet.

Die Routing-Konfiguration verwendet Lazy Loading:

```typescript
{
  path: 'workprocess',
  loadComponent: () =>
    import('./workprocess/workprocess.component')
      .then(m => m.WorkprocessComponent)
}
```

Dadurch werden die einzelnen Komponenten erst geladen, wenn die entsprechende Route aufgerufen wird.

---

## Arbeitsprozess erfassen

Unter `/workprocess` können Produktionsprozesse erfasst werden.

Der Benutzer wählt zunächst einen Arbeitsschritt aus. Die verfügbaren Arbeitsschritte werden beim Laden der Komponente vom Backend abgefragt.

Anschließend können folgende Werte eingegeben werden:

- Arbeitsschritt
- Dauer
- Menge
- Tag

Die Dauer wird im Frontend über ein `time`-Feld im Format `HH:mm` eingegeben.

Beispiel:

```text
02:30
```

entspricht:

```text
150 Minuten
```

Vor dem Absenden wird die Dauer in Minuten umgerechnet:

```typescript
private durationToMinutes(
  duration: string
): number {

  const [
    hours,
    minutes
  ] =
    duration
      .split(':')
      .map(Number);

  return hours * 60 + minutes;
}
```

Das Backend erhält somit eine numerische Dauer.

---

## Performance erfassen

Unter `/performance_record` können Produktions- und Verkaufszahlen gespeichert werden.

Es stehen zwei Kategorien zur Verfügung:

```typescript
export type PerformanceCategory =
  | 'Sale'
  | 'Production';
```

In der Benutzeroberfläche werden diese Werte als:

- Verkauf
- Produktion

angezeigt.

Ein Performance-Datensatz enthält:

```typescript
export interface PerformanceRecordInsert {
  category: PerformanceCategory;
  amount: number;
  day: string;
  ignore: boolean;
}
```

Beispiel für einen Datensatz:

```json
{
  "category": "Production",
  "amount": 100,
  "day": "2026-09-22",
  "ignore": false
}
```

---

## Evaluation

Die Evaluation befindet sich unter:

```text
/evaluation
```

Sie bietet fünf verschiedene Auswertungsmodi:

- Tag
- Woche
- Monat
- Jahr
- Zeitraum

### Tag

Bei der Tagesauswertung wird das ausgewählte Datum direkt als Start- und Enddatum verwendet.

Beispiel:

```text
from = 2026-09-22
to   = 2026-09-22
```

### Woche

Die Wochenauswertung verwendet eine Montag-bis-Sonntag-Woche.

Beispiel:

```text
Montag:    2026-09-21
Sonntag:   2026-09-27
```

Wird beispielsweise ein Mittwoch ausgewählt, wird automatisch die gesamte Woche ermittelt, in der dieser Mittwoch liegt.

### Monat

Bei der Monatsauswertung werden automatisch der erste und letzte Tag des ausgewählten Monats bestimmt.

Beispiel:

```text
September 2026

from = 2026-09-01
to   = 2026-09-30
```

### Jahr

Die Jahresauswertung umfasst den vollständigen Kalenderzeitraum des ausgewählten Jahres.

Beispiel:

```text
from = 2026-01-01
to   = 2026-12-31
```

### Benutzerdefinierter Zeitraum

Im benutzerdefinierten Modus können Start- und Enddatum unabhängig voneinander festgelegt werden.

Das Startdatum darf nicht nach dem Enddatum liegen.

```typescript
if (from > to) {

  this.errorMessage =
    'Das Startdatum darf nicht nach dem Enddatum liegen.';

  return;
}
```

Erst nach dem Absenden des Formulars wird die Auswertung vom Backend angefordert.

---

## Auswertungsdaten

Die API liefert ein vollständiges `Evaluation`-Objekt.

```typescript
export interface Evaluation {
  daily: EvaluationDay[];

  weekly: EvaluationPeriod;
  monthly: EvaluationPeriod;
  yearly: EvaluationPeriod;

  worksteps: EvaluationWorkstep[];

  employees: EvaluationEmployeeWorkstep[];
}
```

### Tagesdaten

Ein einzelner Tag wird durch folgende Struktur repräsentiert:

```typescript
export interface EvaluationDay {
  day: string;
  production: number;
  sale: number;
  difference: number;
}
```

Die Differenz entspricht:

```text
Produktion - Verkauf
```

### Periodensumme

Aggregierte Werte werden durch `EvaluationPeriod` dargestellt:

```typescript
export interface EvaluationPeriod {
  production: number;
  sale: number;
  difference: number;
}
```

Im Frontend werden die täglichen Werte erneut aggregiert:

```typescript
const production =
  days.reduce(
    (sum, day) =>
      sum + day.production,
    0
  );

const sale =
  days.reduce(
    (sum, day) =>
      sum + day.sale,
    0
  );
```

Anschließend wird die Differenz berechnet:

```typescript
difference: production - sale
```

---

## Filterung leerer Tage

Bevor die Tagesdaten angezeigt und aggregiert werden, entfernt das Frontend Tage, an denen weder Produktion noch Verkauf stattgefunden hat.

```typescript
evaluation.daily.filter(
  day =>
    day.production > 0 ||
    day.sale > 0
)
```

Dadurch werden Tage mit ausschließlich `0`-Werten nicht in der Tagesübersicht dargestellt.

---

## Auswertung nach Arbeitsschritt

Die Evaluation enthält zusätzlich Informationen zu den einzelnen Arbeitsschritten.

```typescript
export interface EvaluationWorkstep {
  workstep_id: number;
  name: string;
  duration: number;
  amount: number;
  duration_per_piece: number;
}
```

Angezeigt werden:

| Feld | Bedeutung |
|---|---|
| Arbeitsschritt | Name des Arbeitsschritts |
| Dauer | Gesamtdauer in Minuten |
| Menge | Bearbeitete Menge |
| Dauer / Stück | Durchschnittliche Bearbeitungszeit pro Einheit |

Der Wert `duration_per_piece` wird im Frontend auf zwei Nachkommastellen formatiert.

---

## API-Anbindung

Das Frontend kommuniziert mit einem Backend über HTTP.

Die aktuell konfigurierte Basis-URL lautet:

```text
http://127.0.0.1:8000
```

Die URL ist in den jeweiligen Services zentral hinterlegt.

---

## Performance API

Der `PerformanceApiService` stellt die Speicherung eines Performance-Datensatzes bereit.

Endpoint:

```text
POST /performance_record
```

Beispiel:

```typescript
this.http.post(
  `${this.apiUrl}/performance_record`,
  data
);
```

---

## Production API

Der `ProductionApiService` stellt mehrere Endpunkte zur Verfügung.

### Arbeitsschritte abrufen

```text
GET /worksteps
```

Implementierung:

```typescript
getWorksteps() {

  return this.http.get<Workstep[]>(
    `${this.apiUrl}/worksteps`
  );

}
```

### Arbeitsprozess speichern

```text
POST /workprocesses
```

Implementierung:

```typescript
createWorkprocess(
  data: WorkprocessInsert
) {

  return this.http.post(
    `${this.apiUrl}/workprocesses`,
    data
  );

}
```

### Evaluation abrufen

```text
GET /evaluation
```

Die benötigten Parameter sind:

```text
from
to
```

Optional kann zusätzlich ein Arbeitsschritt angegeben werden:

```text
workstep_id
```

Beispiel:

```text
GET /evaluation?from=2026-09-01&to=2026-09-30
```

Mit Arbeitsschritt:

```text
GET /evaluation?from=2026-09-01&to=2026-09-30&workstep_id=1
```

---

## Datumsverarbeitung

Für die Datumsverarbeitung existieren zentrale Hilfsfunktionen.

### `formatDate`

Konvertiert ein JavaScript-`Date`-Objekt in das Format:

```text
YYYY-MM-DD
```

Beispiel:

```typescript
formatDate(
  new Date(2026, 8, 22)
);
```

Ergebnis:

```text
2026-09-22
```

### `getToday`

Liefert das aktuelle lokale Datum:

```typescript
getToday()
```

Beispiel:

```text
2026-09-22
```

### `parseDate`

Konvertiert einen Datumsstring in ein lokales JavaScript-`Date`-Objekt.

Die einzelnen Bestandteile werden dabei explizit übergeben:

```typescript
return new Date(
  year,
  month - 1,
  day
);
```

Dadurch wird vermieden, dass ein `YYYY-MM-DD`-String unerwünscht als UTC-Datum interpretiert wird.

---

## Formulare und Validierung

Die Eingabeformulare verwenden Angular Reactive Forms.

Beispiel:

```typescript
this.fb.nonNullable.group({
  category: [
    '' as PerformanceCategory | '',
    Validators.required
  ],

  amount: [
    0,
    [
      Validators.required,
      Validators.min(0)
    ]
  ],

  day: [
    getToday(),
    Validators.required
  ]
});
```

Vor dem Absenden wird überprüft, ob das Formular gültig ist.

Bei ungültigen Eingaben werden alle Felder als berührt markiert:

```typescript
if (this.performanceRecordForm.invalid) {

  this.performanceRecordForm.markAllAsTouched();
  return;
}
```

---

## Fehlerbehandlung

API-Fehler werden abgefangen und dem Benutzer über eine Fehlermeldung angezeigt.

Bei der Evaluation wird beispielsweise `catchError` verwendet:

```typescript
catchError(error => {

  console.error(
    'Fehler beim Laden der Auswertung:',
    error
  );

  this.errorMessage =
    'Die Auswertung konnte nicht geladen werden.';

  return of(null);
})
```

Dadurch bleibt die Anwendung auch bei einem fehlgeschlagenen API-Aufruf funktionsfähig.

---

## Ladezustände

Während asynchroner API-Anfragen werden Ladezustände berücksichtigt.

Bei der Evaluation wird beispielsweise:

```typescript
loading = true;
```

gesetzt, bevor die Anfrage gestartet wird.

Nach Abschluss der Anfrage wird der Zustand über `finalize` zurückgesetzt:

```typescript
finalize(() => {

  this.loading = false;
  this.cdr.detectChanges();

})
```

Auch beim Laden der Arbeitsschritte wird zwischen einem Ladezustand und einem leeren Ergebnis unterschieden.

---

## Benutzeroberfläche

Das Frontend verwendet ein einheitliches Layout mit:

- zentral ausgerichteten Inhaltsbereichen
- Karten für Kennzahlen
- Tabellen für Detaildaten
- responsiver Navigation
- responsiven Formularen
- farblich getrennten Kennzahlen
- Lade- und Fehlermeldungen

Die Evaluation verwendet beispielsweise drei Kennzahlenkarten:

```text
┌─────────────────┐
│ Produktion      │
│       100       │
└─────────────────┘

┌─────────────────┐
│ Verkauf         │
│        80       │
└─────────────────┘

┌─────────────────┐
│ Differenz       │
│        20       │
└─────────────────┘
```

Die Farben dienen dabei ausschließlich der visuellen Unterscheidung:

- Produktion → Primärfarbe
- Verkauf → Grün
- Differenz → Orange

---

## Responsive Design

Die Komponenten passen sich an kleinere Bildschirmgrößen an.

Für die Evaluation werden beispielsweise die drei Kennzahlenkarten auf kleineren Bildschirmen untereinander angeordnet:

```css
@media (max-width: 800px) {

  .cards {
    grid-template-columns: 1fr;
  }

}
```

Auch die Navigation wird bei einer Bildschirmbreite von maximal `700px` auf mehrere Zeilen verteilt.

Tabellen können horizontal gescrollt werden, wenn die verfügbare Bildschirmbreite nicht ausreicht.

---

## Installation

Zunächst müssen die Abhängigkeiten des Angular-Projekts installiert werden.

```bash
npm install
```

Anschließend kann die Entwicklungsumgebung gestartet werden:

```bash
ng serve
```

Alternativ:

```bash
npm start
```

Die Anwendung ist anschließend normalerweise unter folgender Adresse erreichbar:

```text
http://localhost:4200
```

---

## Backend-Voraussetzung

Das Frontend erwartet ein laufendes Backend unter:

```text
http://127.0.0.1:8000
```

Das Backend muss mindestens folgende Endpunkte bereitstellen:

```text
GET  /worksteps
POST /workprocesses
POST /performance_record
GET  /evaluation
```

Ohne laufendes Backend können die Formulare zwar angezeigt werden, Daten können jedoch nicht erfolgreich geladen oder gespeichert werden.

---

## Entwicklung

Bei der Weiterentwicklung sollten API-Adressen möglichst nicht direkt in den Komponenten verändert werden.

Die Kommunikation mit dem Backend ist bereits über Services gekapselt:

```text
Komponente
    │
    ▼
API-Service
    │
    ▼
HTTP
    │
    ▼
Backend
```

Dadurch bleiben Komponenten wie `EvaluationComponent` oder `WorkprocessComponent` hauptsächlich für Benutzerinteraktion und Darstellung verantwortlich.

---

## Wichtige Datenmodelle

Die wichtigsten Modelle des Frontends sind:

```text
PerformanceRecordInsert
        │
        └── Performance-Datensatz


WorkprocessInsert
        │
        └── Produktions-Arbeitsprozess


Workstep
        │
        └── verfügbarer Arbeitsschritt


Evaluation
        │
        ├── daily
        ├── weekly
        ├── monthly
        ├── yearly
        ├── worksteps
        └── employees
```

---

## Aktueller Funktionsumfang

| Bereich | Funktion |
|---|---|
| Arbeitsprozess | Arbeitsschritt erfassen |
| Arbeitsprozess | Dauer erfassen |
| Arbeitsprozess | Menge erfassen |
| Arbeitsprozess | Datum erfassen |
| Performance | Produktion erfassen |
| Performance | Verkauf erfassen |
| Performance | Datum erfassen |
| Evaluation | Tagesauswertung |
| Evaluation | Wochenauswertung |
| Evaluation | Monatsauswertung |
| Evaluation | Jahresauswertung |
| Evaluation | Benutzerdefinierter Zeitraum |
| Evaluation | Produktions-/Verkaufsvergleich |
| Evaluation | Arbeitsschrittauswertung |
| Evaluation | Tagesübersicht |
| Navigation | Routing zwischen den Bereichen |
| Responsive UI | Mobile Darstellung |

---

## Hinweise zur Weiterentwicklung

Für eine produktive Umgebung sollte die aktuell fest konfigurierte API-Adresse:

```typescript
private readonly apiUrl =
  'http://127.0.0.1:8000';
```

über eine Angular-Environment-Konfiguration oder eine vergleichbare Konfigurationslösung ersetzt werden.

Beispielsweise könnte zwischen Entwicklungs- und Produktionsumgebung unterschieden werden:

```text
Development
http://127.0.0.1:8000

Production
https://api.example.com
```

---

## Zusammenfassung

Das Frontend stellt eine Angular-basierte Oberfläche zur Verwaltung und Auswertung von Produktionsdaten bereit.

Die Anwendung trennt dabei klar zwischen:

1. **Erfassung von Arbeitsprozessen**
2. **Erfassung von Produktions- und Verkaufszahlen**
3. **Auswertung der gespeicherten Daten**

Die Kommunikation mit dem Backend erfolgt über dedizierte Angular-Services. Reactive Forms übernehmen die Eingabe und Validierung der Daten, während die Routing-Konfiguration die einzelnen Funktionsbereiche voneinander trennt.

Die Evaluation ermöglicht die Betrachtung der Produktions- und Verkaufsdaten über unterschiedliche Zeiträume und stellt zusätzlich detaillierte Informationen zu Arbeitsschritten und einzelnen Tagen bereit.
