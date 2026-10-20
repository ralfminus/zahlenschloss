# 📜 Projekt-Historie & Entscheidungs-Log: Zahlenschloss-Simulation

Dieses Dokument protokolliert chronologisch alle Anforderungen, Weichenstellungen, Architektur-Entscheidungen und iterativen Verfeinerungen inklusive der jeweiligen Begründungen.

---

## 📌 [2026-10-20] Meilenstein 1: Projekt-Initialisierung & Basis-Modell
- **Ausgangspunkt:** Analyse der theoretischen Notiz [`thoughts.md`](file:///Users/ralf/Library/CloudStorage/OneDrive-Pers%C3%B6nlich/RALF/Programmierung/ANTIGRAVITY/project__zahlenschloss/thoughts.md).
- **Kernhypothese:** Wenn Nutzer ein 5-stelliges Zahlenschloss nach dem Schließen nur minimal verdrehen (z. B. 1–2 Räder um $\pm 1$), genügen 15 Beobachtungen, um den Suchraum von 100.000 auf 162 Kombinationen (Top-3 Heuristik) zu reduzieren.
- **Entscheidung (Tech-Stack):** Standalone Web-App (`HTML5`, `modernes CSS`, `Vanilla JS`, `Web Audio API`).
  - *Begründung:* Maximale Portabilität, sofortiger Start per Doppelklick ohne `npm`, `node` oder Server-Setup, 100 % offlinefähig.
- **Entscheidung (Architektur):** Trennung in zwei Hauptmodi:
  1. *Labor-Modus (Sandbox):* Zur statistischen Analyse und Konfiguration von Verhaltensmustern.
  2. *Mini-Game ("Hacker-Challenge"):* Spielerischer Ansatz, um in 5 Versuchen ein unbekanntes Schloss anhand abgefangener Schließzustände zu knacken.

---

## 📌 [2026-10-20] Meilenstein 2: Sparring-Stresstest & Physikalische Schärfung
- **Aktion:** Durchführung eines dialektischen Stresstests (`/sparring-stresstest`) zur Aufdeckung impliziter Prämissen und Schwachstellen.
- **Wesentliche Erkenntnisse & Beschlüsse:**
  1. *Schließzyklus & Zentrierung:* Der Random-Walk-Drift wurde gestrichen, da der reale physische Schließzyklus immer von der wahren Kombination ausgeht (Aufschließen $\rightarrow$ Fahren $\rightarrow$ Abschließen von Soll-Kombination $\rightarrow$ minimales Verdrehen).
  2. *Ring-Topologie ($\mathbb{Z}_{10}$):* Das Zahlenschloss ist ein Ring (auf `9` folgt `0`). Die Heuristik muss zyklische Distanzen `min(|a-b|, 10-|a-b|)` berücksichtigen, damit Ränder physikalisch korrekt zusammenhängen.
  3. *Motorische Kopplung:* Der Daumen-Wisch-Effekt (Rad 4 und 5 drehen gemeinsam) und die Bevorzugung der Außenräder wurden als Verhaltensparameter integriert.
  4. *Störfaktor-Rauschen (Noise):* Einführung eines Reglers für zufällige Störungen (0–40 %), um reale Unregelmäßigkeiten (Taschenabrieb, Fremdverstellung) abzubilden.
  5. *Wissens-Transparenz:* Einführung des Modals `🔬 Annahmen & Physik` im Header, damit Besucher und Kollegen die physikalischen Grundlagen nachvollziehen können.

---

## 📌 [2026-10-20] Meilenstein 3: Erste Implementierung & Prototyp
- **Erstellte Komponenten:**
  - `sound.js`: Prozeduraler Web-Audio-Synthesizer für mechanische Klicks, Einrasten und Aufspringen (keine externen Audio-Dateien).
  - `style.css`: Cyber-Labor Dark Theme mit 3D-Zylindern und animiertem Schlossbügel.
  - `app.js`: Modell-Logik, Sankey-Flussbaum, $P(\text{Erfolg})$-Kurve und Spiel-Loop.
- **Erste Validierung:**
  - Grundfunktionalität gegeben, aber visuelle Überfrachtung im Labor durch parallele Schloss- und Pfadbaum-Darstellung.

---

## 📌 [2026-10-20] Meilenstein 4: User-Review & Radikale Neuausrichtung (Grill-Me)
- **Problemstellung durch Nutzer-Feedback:**
  - *"Im Labormodus brauche ich kein Schloss zum Ausprobieren."*
  - *"Der Wahrscheinlichkeits-Baum gefällt mir nicht oder ist schwer verständlich. Suchraum eliminiert und Rest-Entropie können ebenfalls weg."*
  - *"Ich will im Labormodus das Einstellfenster und die Visualisierung N über Trefferquote sowie ein ausgebautes Monte-Carlo mit anschaulicher Grafik (was passiert, wie oft klappt es)."*
  - *"In der Hacker-Challenge die Pfade weglassen und stattdessen eine Heatmap (welche Zahl an den Stellen 1 bis 5 wie oft gewählt wurde) und Visualisierung der abgefangenen Zustände."*

- **Getroffene Entscheidungen & Begründungen:**
  1. **Klare Trennung der Modi:**
     - *Labor-Modus:* Reines, aufgeräumtes Simulations- und Stresstest-Dashboard. Das 3D-Schloss wurde hier komplett entfernt, um den Fokus auf die Auswertung zu legen.
     - *Hacker-Challenge:* Das 3D-Schloss steht exklusiv hier im Mittelpunkt, wo der Spieler physisch versucht, das Schloss in 5 Versuchen zu knacken.
  2. **Ersatz des Sankey-Baums durch das 100-Schlösser Monte-Carlo Raster:**
     - *Begründung:* Ein abstraktes Pfaddiagramm erzeugt kognitive Überlastung. Eine 10x10 Matrix aus 100 Mini-Schlössern, die bei Simulation live von grau auf 🔓 grün (geknackt) oder ❌ rot (fehlgeschlagen) umspringen, liefert sofort den intuitiven "Aha-Effekt" über die Erfolgsquote (z. B. `96 / 100 (96 %)`).
  3. **Visualisierung der Kurve $N$ über Trefferquote:**
     - *Begründung:* Zeigt sauber und ohne Ballast, ab welcher Beobachtungsanzahl $N$ (1 bis 50) die Trefferquote gegen 100 % konvergiert, synchronisiert mit dem aktuellen Slider-Wert.
  4. **5×10 Matrix-Heatmap in der Hacker-Challenge:**
     - *Begründung:* 5 Spalten (Stelle 1 bis 5) × 10 Zeilen (Ziffern 0 bis 9). Die Farbintensität und Ziffern-Zähler zeigen auf einen Blick die Schwerpunkte. **Interaktiver Hebel:** Ein Klick auf ein Heatmap-Feld setzt diese Ziffer direkt in das entsprechende Rad des 3D-Schlosses.
  5. **Galerie der abgefangenen Schließzustände:**
     - *Begründung:* Karten-Galerie mit auffälligem Zähler (`15 Zustände abgefangen`); Klick auf eine Karte lädt die gesamte 5-stellige Kombination direkt ins Schloss.

---

## 📌 [2026-10-20] Meilenstein 5: Doppel-Vergleich (Top-3 vs. Top-1), 4. Preset & Layout-Schliff
- **Problemstellung & User-Feedback:**
  - *"Was heißt 3 Möglichkeiten – können wir das nicht auf 1 Möglichkeit reduzieren? Ich will zwei identische Diagramme: oben auf 3 Möglichkeiten (Eingrenzung) und unten auf 1 Möglichkeit (Genau 1 Versuch mit Spitzenreiter)."*
  - *"Sollte sich die Trefferquotengrafik nicht ändern, wenn ich zwischen sehr faul, realistisch und sicher wähle?"*
  - *"Ein weiterer Knopf zwischen realistisch und sicher, bei dem alles zwischen ±0 bis ±5 vorhanden ist."*
  - *"Tooltips bei Hover über Störfaktor, Beobachtungen und Top-k."*
  - *"Hacker-Challenge: Neben dem Schloss rechts die Heatmap, unten zweispaltig die Schließzustände, ein Schieberegler von N=1 an und die 4 Verhaltens-Knöpfe direkt auf der Seite."*

- **Umgesetzte Lösungen & Begründungen:**
  1. **Doppel-Raster Monte-Carlo im Labor:**
     - *Oberes Raster (Top-3):* Zeigt die Quote der sicheren Raum-Eingrenzung auf $\le 243$ Kombinationen (z. B. 96 %).
     - *Unteres Raster (Top-1):* Zeigt die Quote, bei der der Angreifer mit *genau 1 Versuch* (Spitzenreiter-Code) direkt ins Schwarze trifft (z. B. 48 %).
     - *Didaktischer Mehrwert:* Macht den Unterschied zwischen Suchraum-Reduktion und Soforttreffer sofort begreifbar.
  2. **Doppel-Kurvengrafik:**
     - Zeichnet simultan die grüne Top-3 Kurve und die blaue Top-1 Kurve über $N=1..50$.
     - Reagiert dynamisch in Echtzeit auf alle 4 Verhaltens-Presets.
  3. **4. Preset 'Moderat / Teildrehung' (±0 bis ±5):**
     - Schließt die Lücke zwischen minimaler Faulheit ($\pm 1..2$) und vollem Chaos. Simuliert halbe Umdrehungen an 2–3 Rädern.
  4. **Interaktive Tooltips:**
     - `ⓘ`-Symbole mit Hover-Erklärungen bei allen Reglern.
  5. **Side-by-Side Challenge Layout:**
     - 3D-Schloss links, 5x10 Heatmap rechts daneben.
     - Kumulativer $N$-Slider ($N=1..30$): Das Schloss bleibt dasselbe; beim Hochschieben fließen neue Zustände ein und schärfen die Heatmap live.
     - 4 Opfer-Profil-Buttons zur Generierung neuer Ziele.
     - Zweispaltige Galerie der abgefangenen Zustände.

  6. **Automatische Live-Simulation im Labor:**
     - Sobald ein Regler (N, Störfaktor, Top-k) oder ein Preset verändert wird, führt das System die Monte-Carlo Simulation sofort automatisch aus (debounced).
     - Der manuelle Button "Monte-Carlo Durchlauf starten" entfällt; stattdessen zeigt ein Badge den "⚡ Automatische Live-Simulation"-Status an.

---

## 📌 [2026-10-20] Meilenstein 6: Mathematische Kalibrierung & Auflösung der Kurven-Diskrepanz
- **Entdeckter Widerspruch (Nutzer-Feedback):**
  - Bei `Moderat`, $N=9$ und Rauschen $10\,\%$ zeigte die mathematische Kurve fälschlicherweise nur **$6\,\%$ Trefferquote**, während das 100-Schlösser Monte-Carlo-Raster unten **$97\,\%$ geknackte Schlösser** anzeigte.
- **Ursachen-Analyse:**
  - Die Kurve wurde zuvor über eine rein künstliche Exponentialformel berechnet (`1 - Math.exp(-n/decay)` hoch 5), deren Parameter die tatsächliche Stärke des Verhaltensmodells massiv unterschätzten.
  - In der Realität werden bei `Moderat` nur 2–3 Räder verstellt, 2–3 Räder bleiben völlig unberührt, und Verstellungen von $\pm 0$ belassen das Rad ebenfalls auf der echten Ziffer. Dadurch liegt der echte Code an jedem Rad fast immer auf Platz 1 oder 2 der Häufigkeit. Die empirische Trefferquote bei $N=9$ liegt tatsächlich bei **über $95\,\%$**.
- **Lösung:**
  - Die fiktive Formel wurde durch eine **echte empirische Kalibrierung (`sampleEmpiricalCurve()`)** ersetzt. Die Kurve ermittelt ihre Stützpunkte nun direkt aus der identischen Simulations-Engine.
  - **Ergebnis:** Kurve und 100-Schlösser-Raster sind jetzt bei allen Presets und Regler-Kombinationen zu **100 % mathematisch kongruent und widerspruchsfrei**!

---

## 📌 [2026-10-20] Meilenstein 7: Fünfte Auswahlmöglichkeit (Alle 5 Räder bis zur Halbdrehung)
- **Anforderung:**
  - *"Und ich möchte noch einen fünften Knopf ... alle 5 Räder verstellt um bis zu einer halben Umdrehung. Finde einen passenden Namen und ergänze diese 5. Auswahlmöglichkeit."*
- **Namensfindung & Psychologische Einordnung:**
  - *Option A (Gewählt):* **"Halbdrehung (alle 5)"** bzw. kurz **"Halbdrehung"**
    - *Begründung:* Maximal deskriptiv, unmittelbar verständlich für Ingenieure und Nutzer. Es benennt exakt die physische Geste (eine Wischbewegung von maximal 180° über alle 5 Zylinder).
  - *Option B (Alternativ-Kandidat):* **"Gründlich"**
    - *Begründung:* Beschreibt den kognitiven Bias: Der Besitzer glaubt, sehr sicher zu handeln, weil er *jedes einzelne Rad* verdreht – beschränkt sich aber motorisch auf eine halbe Drehung.
- **Implementierte Logik & Parameter:**
  - `presetName === 'halbdrehung'`:
    - Alle 5 Räder werden einer Verstellung $\Delta \in \{\pm 0, \pm 1, \dots, \pm 5\}$ unterzogen.
    - Im Labor: Preset-Chip `Halbdrehung` mit automatischer Monte-Carlo-Simulation und Live-Kurvenkalibrierung.
    - In der Hacker-Challenge: Opfer-Profil `Halbdrehung (alle 5)`.
  - Didaktischer Mehrwert im Vergleich zu `Moderat`: Während `Moderat` (nur 2–3 Räder verstellt) noch unberührte Zylinder hinterlässt, erzeugt die 5-Rad-Halbdrehung eine deutlich breitere Streuung über den Halbkreis, was die Trefferquote bei kleinem $N$ stark dämpft und die Heuristik vor eine echte Challenge stellt.

---

## 📌 [2026-10-20] Meilenstein 8: 6-stufiges Verhaltensmodell & Top-3 Heuristik-Empfehlungen (Grill-Me Alignment)
- **Anforderungen aus dem Grill-Me Interview:**
  1. *Start bei $N=1$:* In der Hacker-Challenge startet der Beobachtungs-Slider immer strikt bei 1 Beobachtung (sowohl initial als auch bei jedem Profilwechsel).
  2. *Top-3 Heuristik-Empfehlungen mit Wahrscheinlichkeiten:* Statt nur einer Empfehlung werden 3 Empfehlungen berechnet und untereinander mit jeweiliger Trefferquoten-Konfidenz und 1-Klick-Übernahme ins Schloss dargestellt.
  3. *6 Verhaltens-Presets im 2×3 Raster:* Durchgängige, präzise Benennung und Anordnung in 2 Zeilen à 3 Buttons für Labor und Challenge.
- **Entscheidungen & Modell-Definition:**
  - **Die 6 Stufen:**
    1. `Sehr faul`: 1 Rad $\pm 1$ (Außenräder 0 und 4 bevorzugt).
    2. `Alltäglich`: 1–2 Räder $\pm 1$ bis $\pm 2$ (Alltags-Vergesslichkeit).
    3. `Moderat`: 2–3 Räder verstellt um $\pm 0$ bis $\pm 5$ (Teildrehung an Teilrädern).
    4. `Gründlich`: 3–5 Räder verstellt um $\pm 0$ bis $\pm 3$ (viele Räder, kleine Drehwinkel).
    5. `Halbdrehung`: 3–5 Räder verstellt um bis zu eine halbe Umdrehung ($\pm 0$ bis $\pm 5$).
    6. `Maximal sicher`: Alle 5 Räder pseudozufällig 0–9 verwirbelt (reines Rauschen).
  - **Mathematische Heuristik für Empfehlungen 1, 2 und 3:**
    - Frequenzanalyse je Rad mit Bayes'scher Laplace-Glättung: $P(w, d) = \frac{F_{w, d} + 0.2}{N + 2.0}$.
    - Aus den 32 Kombinationen der beiden häufigsten Ziffern je Rad wird die Verbund-Wahrscheinlichkeit $W(C) = \prod_{w=0}^4 P(w, C_w)$ berechnet.
    - Die Top 3 Kombinationen (Rang 1: Spitzenreiter, Rang 2: Alternative, Rang 3: Außenseiter) werden mit relativer Konfidenz in Prozent und animiertem Balken angezeigt.
- **Ergebnis:**
  - Maximale didaktische Transparenz. Der Spieler sieht ab der 1. Beobachtung ($N=1$), wie sich die 3 besten Thesen formieren und mit jedem Schieber-Schritt schärfen oder kippen.

---

## 📌 [2026-10-20] Meilenstein 9: 3/4/5-Zylinder-Architektur, Side-by-Side MC, 90%-Benchmark & Win-Modal (Grill-Me)
- **Problemstellung & User-Feedback:**
  1. *Einstellmenü zu schmal:* Preset-Buttons wurden abgeschnitten (`.labor-top-grid` auf 480px verbreitern).
  2. *Monte-Carlo-Raster:* Die 100 Mini-Schlösser kleiner skalieren und Top-3 vs. Top-1 nebeneinander statt untereinander anordnen.
  3. *90 %-Benchmark-Leiste:* Eine 6-Karten-Vergleichsreihe unter Monte-Carlo, die für alle 6 Verhaltens-Presets anzeigt, wie viele Beobachtungen $N$ nötig sind, um das Schloss mit max. 3 Versuchen in $\ge 90\,\%$ der Fälle zu knacken.
  4. *Multi-Digit Schloss-Architektur:* Umschalter im Header für 3, 4 und 5 Ziffern. Skaliert den mathematischen Suchraum ($10^3$, $10^4$, $10^5$), das 3D-Schloss, die Heatmap und die Presets dynamisch.
  5. *Tooltip-Audit & Begriffsklärung:* Alle fehlenden Info-Icons und Hover-Erklärungen ergänzen; Klärung von Top-$k$ und Störfaktor/Rauschen an konkreten Alltagsbeispielen.
  6. *Erfolgs-Rückmeldung:* Kompaktes Sieges-Modal mit benötigten Versuchen, dechiffriertem Code und "Nächstes Schloss"-Aktion.
- **Getroffene Entscheidungen & Implementierung:**
  1. **Multi-Digit Skalierung ($D \in \{3, 4, 5\}$):**
     - Globaler Segment-Umschalter `[3 Ziffern] [4 Ziffern] [5 Ziffern]` im Header.
     - Dynamische Generierung der Zylinder im 3D-Schloss (`render3DLock(D)`) mit angepasster Bügelbreite (180px, 230px, 280px).
     - Dynamische $D\times 10$ Heatmap mit responsiver Spaltenaufteilung.
     - Verallgemeinerte Bitmask-Kombinatorik ($2^D$ Kombinationen in $<1\,\text{ms}$) zur Bestimmung der Top 3 Empfehlungen.
     - Dynamische Anpassung der Daumen-Wisch-Kopplung (koppelt immer die letzten beiden Räder $D-1$ und $D$).
  2. **Side-by-Side Monte-Carlo Raster:**
     - 10x10 Mini-Kacheln (8x8px) im `1fr 1fr` Grid nebeneinander mit eigenständigen KPI-Badges.
  3. **Interaktive 90 %-Benchmark-Leiste:**
     - 6 dynamisch berechnete Risikokarten (`rank-vulnerable`, `rank-moderate`, `rank-hard`, `rank-secure`).
     - **Interaktiver Hebel:** Ein Klick auf eine Karte aktiviert sofort das jeweilige Verhaltens-Preset im Labor.
  4. **Kompaktes Sieges-Modal & Game-Over Logik:**
     - Bei Erfolg: Animiertes Modal mit verbrauchten Versuchen (z. B. "Geknackt im 2. Versuch"), Sound und Ziel-Code.
     - Bei 5 Fehlversuchen: Diskreter Abbruch ohne lästiges Modal – Status rot ("Schloss gesperrt"), Code im Header aufgedeckt.
  5. **Vollständiges Tooltip-Audit:**
     - Alle Regler, Presets, Heatmap- und Challenge-Elemente besitzen nun lückenlose, prägnante Hilfetexte.

---

## 📌 [2026-10-20] Meilenstein 10: Top-k Entrümpelung, Praxis-Decoder (3. Modus), Ultra-Kompaktes MCS & Instant-Tooltips
- **Problemstellungen & User-Feedback:**
  1. *Top-k Regler:* Unrealistisch und verwirrend, da Kurve und MCS fest auf Top-1 und Top-3 verankert sind. $\rightarrow$ Regler entfernen (Option A gewählt).
  2. *3. Modus (Praxis-Decoder):* Nutzer kann sein reales Schloss (3, 4, 5 Ziffern) analysieren, indem er eine Liste von beobachteten Schließzuständen in ein Textfeld einfügt. Rekonstruiert die 3 wahrscheinlichsten Codes, diagnostiziert das Verhaltensmuster und liefert die Top-10 Angriffsreihenfolge.
  3. *MCS-Größe:* Trotz Neuanordnung noch zu wuchtig. $\rightarrow$ Echtes Kompakt-Dashboard mit 92×92px Miniatur-LED-Dots, Inline-Karten und reduzierten Schriftgrößen.
  4. *Tooltip-Verzögerung / Screenshot-Phänomen:* Warum waren Tooltips erst beim Screenshot sichtbar? $\rightarrow$ Aufklärung des macOS Cocoa WindowServer 1.000 ms Delays und Implementierung eines nativen CSS/DOM-Tooltip-Systems (`data-tooltip`) mit 0 ms Reaktionszeit.
- **Getroffene Entscheidungen & Implementierung:**
  1. **Top-k Regler entfernt:**
     - `sliderTopK` und `valTopK` aus HTML und JS entfernt.
     - Didaktisch glasklare Gegenüberstellung: Sofortversuch (Top-1) vs. 15-Minuten-Eingrenzung (Top-3).
  2. **3. Modus: Praxis-Decoder (`#auditView`):**
     - Neuer Tab im Header: `🕵️ Real-Decoder (Praxis)`.
     - Großes Eingabefeld für reale Schließzustände mit automatischem Zeilen-Filter auf $D$ Ziffern.
     - Zwei Schnell-Lade-Buttons (`Fauler Nutzer`, `Moderat`) und `Leeren`.
     - Bayes'sche Auswertung:
       - Top 3 rekonstruierte Originalcodes mit Konfidenzbalken und 1-Klick-Kopieren.
       - Automatische Verhaltensmuster-Diagnose (Invarianz-Erkennung starrer Zylinder vs. volatile Wischräder).
       - Top-10 Prioritätsliste zum schrittweisen manuellen Testen am Schloss.
       - Mini-Heatmap der tatsächlichen Frequenzen.
  3. **Ultra-Kompaktes MCS-Dashboard:**
     - 10×10 Matrix auf 92×92px miniaturisiert (7×7px LED-Kacheln, kein Emoji-Textumbruch mehr).
     - Inline-Kartenlayout (`.mc-section-compact`): Mini-LED-Raster links, Titel + KPI (`96 / 100`) rechts daneben.
  4. **Custom Instant CSS-Tooltips (`data-tooltip`):**
     - `setupInstantTooltips()` transferiert alle `title`-Attribute in `data-tooltip` und löscht `title` zur Unterdrückung des trägen macOS Cocoa Delays.
     - Pure CSS `::before` und `::after` Tooltips mit 0 ms Latenz, dunklem Cyber-Look, Cyan-Glow und Pfeil.
   5. **Bugfix Heatmap & Tooltip-Positioning:**
      - Fehlendes `heatmapGrid` im DOM-Elemente-Cache `el` nachgetragen – `renderHeatmap()` rendert nun zuverlässig die dynamische Heatmap mit $D$ Spalten und aktualisiert den Titel (`3×10`, `4×10`, `5×10`).
      - Für alle Header-Elemente öffnen Tooltips nach unten (`top: calc(100% + 10px)`), sodass sie nie mehr oberhalb des Fensters abgeschnitten werden.
   6. **Duale Heuristik-Architektur: Strategie 1 (Peak / Zero-Shift) vs. Strategie 2 (Habitual Offset / Inverse Deconvolution):**
      - **Theoretisches Fundament:** Neue Sektion 5 im Modal *Modell-Annahmen & Physik* dokumentiert die Unterscheidung zwischen stochastischer Gauß-Streuung ($\mathbb{E}[\text{Beobachtung}] = \text{Code}$) und deterministischem Wischvektor $\vec{\Delta}$.
      - **Hacker-Challenge:** Strategie-Pill-Toggle (`[ 🎯 Strategie 1: Häufigkeits-Peak ]` vs. `[ 🔄 Strategie 2: Habitual Offset ]`). Bei Aktivierung von Strategie 2 diagnostiziert das System automatisch Invarianzen und Daumen-Kopplungen und berechnet rekonstruierte Zielcodes über inverse Modulo-10-Arithmetik ($(z - \Delta) \pmod{10}$, z. B. `3-1-1` $\rightarrow$ `3-3-3` bei Daumenwisch $-2$).
      - **Real-Decoder (Praxis):** Neue automatische Sektion *„🔄 Inverse Deconvolution (Habitual-Offset Rekonstruktion)“*, die bei starren Zylindern die wahrscheinlichsten echten Codes samt Plausibilität und Daumenrichtung auflistet und per Klick kopierbar macht.

---

## 📌 Aktueller Status: Alle 10 Meilensteine vollständig implementiert und validiert
- Alle Dateien ([`index.html`](file:///Users/ralf/Library/CloudStorage/OneDrive-Pers%C3%B6nlich/RALF/Programmierung/ANTIGRAVITY/project__zahlenschloss/index.html), [`style.css`](file:///Users/ralf/Library/CloudStorage/OneDrive-Pers%C3%B6nlich/RALF/Programmierung/ANTIGRAVITY/project__zahlenschloss/style.css), [`app.js`](file:///Users/ralf/Library/CloudStorage/OneDrive-Pers%C3%B6nlich/RALF/Programmierung/ANTIGRAVITY/project__zahlenschloss/app.js), [`PLANNING.md`](file:///Users/ralf/Library/CloudStorage/OneDrive-Pers%C3%B6nlich/RALF/Programmierung/ANTIGRAVITY/project__zahlenschloss/PLANNING.md), [`history.md`](file:///Users/ralf/Library/CloudStorage/OneDrive-Pers%C3%B6nlich/RALF/Programmierung/ANTIGRAVITY/project__zahlenschloss/history.md)) sind zu 100 % synchronisiert.
