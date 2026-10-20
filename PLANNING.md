# 🔐 Projekt-Spezifikation & Implementierungsplan: Zahlenschloss-Simulation & Mini-Game

## 📌 1. Projektübersicht & Kernziel
- **Verzeichnis:** `project__zahlenschloss/`
- **Ziel:** Eine hochmoderne, interaktive Web-Simulation, die basierend auf den Erkenntnissen aus [`thoughts.md`](file:///Users/ralf/Library/CloudStorage/OneDrive-Pers%C3%B6nlich/RALF/Programmierung/ANTIGRAVITY/project__zahlenschloss/thoughts.md) und dem dialektischen Stresstest demonstriert und erlebbar macht, wie menschliche Bequemlichkeits- und Schließgewohnheiten den Suchraum eines 5-stelligen Zahlenschlosses von 100.000 Kombinationen auf einen Bruchteil zusammenschmelzen lassen.
- **Fokus & Haltung:** Die App dient als spielerisches, visuell packendes Werkzeug für technisch-mathematisch Interessierte (Ingenieure, Kollegen, Schüler), um **Kombinatorik, Informationstheorie (Entropie-Leck) und Heuristiken** ohne trockene Theorie greifbar zu machen. Gamification unterstützt das mathematische Verständnis, ohne es zu verwässern.

---

## 🔬 2. Modell-Annahmen & Mathematisches Fundament (State)

### 2.1 Reales Nutzungsszenario (Schließzyklus)
- **Zyklus:** Der Nutzer öffnet das Schloss mit der echten Kombination. Nach der Nutzung (z. B. Fahrrad abstellen, Spind schließen) wird das Schloss eingerastet. Aus Bequemlichkeit oder Eile verdreht der Nutzer das Schloss **direkt ausgehend von der echten Kombination** nur minimal (meist 1–2 Räder um $\pm 1$).
- **Kein Random-Walk-Drift:** Da bei jedem Schließvorgang wieder die geheime Kombination als Ausgangspunkt dient, bleibt der statistische Schwerpunkt stabil auf der wahren Kombination zentriert.

### 2.2 Ring-Topologie ($\mathbb{Z}_{10}$)
- Die Zylinder sind zyklisch (auf `9` folgt `0`). Eine Verstellung von `0` nach `9` ist ein Bequemlichkeitsschritt von $-1$.
- Das Frequenz-Histogramm erfasst Ziffernhäufigkeiten direkt; die Abstandsmetrik berücksichtigt den Ring-Abstand $d(a, b) = \min(|a-b|, 10-|a-b|)$.

### 2.3 Inter-Wheel-Kovarianzen (Motorische Kopplung)
- **Daumen-Wisch-Effekt:** Häufig werden zwei benachbarte Räder gleichzeitig mit einer Daumenbewegung verstellt (z. B. Rad 4 & 5).
- **Positions-Bias:** Die äußeren Räder (vor allem Rad 5 bzw. Rad 1) werden signifikant häufiger verstellt als die mittleren Räder.

### 2.4 Störfaktoren & Rauschen (Noise-Parameter)
- Einstellbarer Störfaktor (0–30 %): Simuliert unvorhersehbare Einflüsse (z. B. versehentliches Weitdrehen, Schloss in Tasche verdreht, Dritte haben am Schloss gedreht).
- Zeigt live, ab wie vielen Beobachtungen $N$ die Heuristik das Rauschen statistisch herausfiltert.

### 2.5 Informationstheorie & Entropie
- **Ausgangsentropie:** $H_0 = \log_2(100.000) \approx 16{,}61 \text{ Bit}$.
- **Restentropie nach $N$ Beobachtungen:** $H(S_{\text{red}}) = \log_2(|S_{\text{red}}|)$.
- **Entropie-Leck-Barometer:** Zeigt exakt an, wie viele Bits an Geheimhaltung durch Bequemlichkeit verloren gegangen sind.

---

## 🏗️ 3. Architektur & Dateistruktur (State)
- **Plattform:** Standalone Web-App (`HTML5`, modernes `CSS3`, Vanilla `ES6+ JavaScript`, `Web Audio API`).
- **Dateien in `project__zahlenschloss/`:**
  - `index.html`: Semantisches Layout, Modus-Umschalter, Schloss-Stage, Heuristik- & Entropie-Panels, Modal für Annahmen & Formeln.
  - `style.css`: Cyber-Labor Dark Mode, 3D-Zylinder-Effekte, Flow-Graph, Responsive Grid.
  - `sound.js`: Web-Audio-Synthesizer für taktile Klicks, Rasten und Schlossöffnen (mit Mute-Schalter).
  - `app.js`: Modell-Logik, Störfaktor-Simulation, Frequenz- & Kovarianz-Analyse, Sankey-Flussbaum und Mini-Game Loop.
  - `PLANNING.md`: Diese Spezifikationsdatei.

---

## 🎮 4. Interaktions-Komponenten & Features (State)

### A. Globale Schlosstyp-Architektur (3, 4, 5 Ziffern)
- **Zylinder-Wahlschalter im Header (`[3 Ziffern] [4 Ziffern] [5 Ziffern]`):**
  - Passt den gesamten mathematischen Suchraum ($10^3 = 1.000$, $10^4 = 10.000$, $10^5 = 100.000$) und den reduzierten Top-3 Raum ($3^3 = 27$, $3^4 = 81$, $3^5 = 243$) dynamisch an.
  - Skaliert das physische 3D-Zahlenschloss (Bügelbreite 180px, 230px, 280px), die Heatmap ($D\times 10$) und die Daumen-Wisch-Kopplung (Rad $D-1$ und $D$).
  - Passt die Untertitel der 6 Verhaltens-Presets proportional an die Zylinderanzahl an.

### B. Interaktives Labor (Reines Simulations- & Analyse-Dashboard)
- **Feste Gegenüberstellung (Top-3 vs. Top-1):**
  - Top-k Regler entfernt. Klarer Fokus auf Sofortversuch ($k=1$) vs. 15-Minuten-Eingrenzung ($k=3$).
- **Ultra-Kompaktes Side-by-Side Monte-Carlo Raster:**
  - Zwei 92×92px Miniatur-LED-Raster nebeneinander (1fr 1fr) mit 7×7px Dots ohne Emoji-Überlauf für direkten visuellen Vergleich.
- **Interaktive 90 %-Benchmark-Leiste:**
  - 6 farbcodierte Risikokarten (`rank-vulnerable`, `rank-moderate`, `rank-hard`, `rank-secure`) mit Klick-Aktivierung des Presets.
- **Custom Instant Tooltip-System:**
  - Latenzfreie (0 ms) Hover-Bubbles mit Cyber-Glow; vollständige Umgehung des trägen macOS-WindowServer Delays.

### C. Mini-Game ("Hacker-Challenge")
- **Side-by-Side Layout:**
  - 3D-Zahlenschloss **links**, Frequenz-Heatmap ($D\times 10$) **rechts direkt daneben**.
  - Darunter: Top 3 Bayes'sche Heuristik-Empfehlungen und zweispaltiges Spionage-Log.
- **Kumulativer Beobachtungs-Slider ($N=1$ bis $30$):**
  - Startet immer strikt bei $N=1$.
- **Kompaktes Sieges-Modal & Game Over:**
  - Bei Erfolg: Animiertes Modal mit verbrauchten Versuchen ("Geknackt im 2. Versuch"), Sound und Ziel-Code.
  - Bei 5 Fehlversuchen: Status rot ("Schloss gesperrt"), Code im Header aufgedeckt.

### D. Praxis-Decoder ("Real-Example Audit" - 3. Modus)
- **Eingabe realer Schließzustände:**
  - Großes Textfeld zum zeilenweisen Einfügen echter Schloss-Beobachtungen (automatische Filterung auf $D$ Ziffern).
  - Schnellade-Buttons für Testbeispiele ("Fauler Nutzer", "Moderat").
- **Forensische Bayes'sche Auswertung:**
  - Top 3 rekonstruierte Original-Codes mit Verbund-Wahrscheinlichkeit und 1-Klick-Kopieren.
  - Verhaltensmuster-Diagnose (Erkennung starrer Zylinder vs. Wisch-Räder).
  - Top-10 Prioritätsliste zum schrittweisen manuellen Testen am Schloss.
  - Mini-Heatmap der tatsächlichen Frequenzen.

---

## 📜 5. Ereignis- & Entscheidungsprotokoll (Event-Log)
- **2026-10-20 (Meilenstein 8):** 6-stufiges Verhaltensmodell im 2x3 Raster, Top-3 Heuristik-Empfehlungen mit Bayes-Konfidenz, Slider-Start bei N=1.
- **2026-10-20 (Meilenstein 9 - Grill-Me):**
  - Steuerungs-Grid auf 480px verbreitert (keine abgeschnittenen Presets).
  - Monte-Carlo 100-Schlösser im Side-by-Side Grid.
  - Interaktive 90 %-Benchmark-Leiste (6 Risikokarten für $N_{90\%}$ mit Preset-Schnellwahl).
  - Multi-Digit Schloss-Architektur für 3, 4 und 5 Ziffern.
- **2026-10-20 (Meilenstein 10):**
  - Top-k Regler entfernt (Feste didaktische Pole: Top-1 vs. Top-3).
  - 3. Modus "Praxis-Decoder (Real-Example Audit)" vollständig implementiert.
  - Ultra-kompaktes MCS-Dashboard (92×92px Miniatur-LED-Dots, Inline-Kartenlayout).
  - Custom Instant CSS/DOM Tooltip-System (0 ms Latenz, macOS Cocoa Delay eliminiert).
