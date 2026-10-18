# Bride benchmarks

Wiarygodna linia bazowa wydajności Bride: serializacja HTML w C, czas
kompilacji oraz renderowanie przez zbudowany moduł WASM. Benchmarki
**mierzą i raportują — nie blokują**. Żaden próg regresji nie jest
egzekwowany; wyniki służą do porównań między commitami.

## Uruchomienie lokalne

```sh
npm run bench                              # pełne benchmarki
node benchmarks/run.mjs --quick            # mniej iteracji, szybka pętla
node benchmarks/run.mjs --only c-html-serialize
node benchmarks/run.mjs --skip emcc-build,wasm-render
```

Wymagania: Node.js, narzędzie C (`cc`/`gcc`/`clang`) — natywne suite;
dodatkowo Emscripten (`emcc`) — suite `emcc-build` i `wasm-render`, które bez
niego są pomijane z jawnym powodem w raporcie. Żadne benchmarki nie używają
sieci.

Wynik trafia do `benchmarks/results/benchmark-results.json` (katalog jest
gitignorowany). W GitHub Actions podsumowanie jest dopisywane do
`$GITHUB_STEP_SUMMARY`, a plik JSON wgrywany jako artifact workflow
`Benchmarks`.

## Co jest mierzone

| suite | case | co mierzy |
| --- | --- | --- |
| `c-html-serialize` | `html-serialize/{-O0,-O2}/nodes-{100,1000,10000}` | czas jednego `repr_html_tag()` na deterministycznym drzewie o podanej liczbie węzłów, w dwóch konfiguracjach optymalizacji |
| `native-compile` | `compile-lib-full` | pełna kompilacja wszystkich źródeł `lib/c` + archiwum `ar` (odpowiednik jednostki, którą `bride build` uruchamia przez emcc) |
| `native-compile` | `rebuild-lib-one-file` | zmiana jednego pliku źródłowego → rekompilacja tylko jego + aktualizacja archiwum |
| `emcc-build` | `emcc-build-app` | pełne `bride build` aplikacji z szablonu (emcc: biblioteka + archiwum + linkowanie `main.wasm` + skopiowanie runtime) |
| `emcc-build` | `emcc-rebuild-one-file` | zmiana `src/main.c` → `emcc -c` jednego pliku + relink `main.wasm` (flagi jak w `bin/compile.js`) |
| `wasm-render` | `wasm-render-full-page` | wielokrotne `Bride.render()` przez prawdziwy WASM: C buduje drzewo, serializuje, runtime dekoduje i zapisuje DOM |
| `wasm-render` | `wasm-render-click-update` | wielokrotne `Bride.dispatch()` — ścieżka `change()` (podmiana poddrzewa) |

Metryki pochodne (przepustowość: węzły/s, KB/s) są liczone z mierzonej
mediany i oznaczone jako pochodne — nie są osobnym pomiarem.

## Metodologia

- **Dane wejściowe**: deterministyczne drzewa CSS-owych „wersów" generowane z
  ustalonego wzorca; ta sama liczba węzłów i ten sam HTML przy każdym
  uruchomieniu (checksuma w `META`/wynikach JSON).
- **Rozgrzewka**: każdy case ma osobną fazę rozgrzewania (nie mierzoną).
- **Wiele iteracji**: domyślnie 30 (serializacja/render), 7 (pełna
  kompilacja), 15 (rebuild); `--quick` redukuje te liczby.
- **Statystyka**: mediana oraz rozrzut (p25/p75/IQR, min/max, odchylenie
  standardowe) — wszystko z surowych próbek, które są zapisane w JSON.
- **Weryfikacja wyniku**:
  - srebrne (golden) drzewo serializera porównywane z dokładnym oczekiwanym
    HTML przed pomiarem;
  - każda iteracja serializera jest hashowana i porównywana z referencją, a
    hash trafia do `volatile` sink — zdegenerowany lub usunięty przez
    optymalizację render nie przejdzie weryfikacji;
  - kompilacje muszą wyprodukować niepusty plik wynikowy;
  - renderowanie musi dać identyczny HTML (po normalizacji numeru handlera
    dispatch, który Bride nadaje nowy przy każdym `ui()`) oraz poprawny
    licznik po każdym kliknięciu.

## Ograniczenia dokładności

- **Współdzielone maszyny**: wyniki z runnerów CI mają szum (zwłaszcza
  `native-compile` mierzący czas procesów potomnych). Porównuj mediany
  z tego samego workflow/runnera, patrząc na IQR.
- **Czasy process-level** (`*-compile`, `emcc-build-app`) obejmują też
  start procesu i I/O — to celowe, bo tak samo mierzy użytkownik; w
  `wasm-render` start jest wykluczony (jeden proces, pętla w JS).
- **`wasm-render` używa atrapowego DOM** (mapa selectorów, bez prawdziwego
  parsera HTML, style engine ani layoutu) — mierzy ścieżkę
  wasm → C → serializacja → dekodowanie JS → zapis `innerHTML`, nie
  wydajność przeglądarki.
- **`rebuild-*-one-file` nie jest trybem CLI**: `bride build` nie ma trybu
  inkrementalnego i zawsze kompiluje wszystko od nowa — te case'y mierzą
  najmniejszą jednostkę przebudowy (jedna jednostka translacyjna + linkowanie
  / archiwum), którą przyszły system budowania mógłby wykorzystać.
- **`native-compile` używa gcc/clang, nie emcc** — to stabilny zamiennik
  pozwalający mierzyć kompilację bez Emscripten; poziom optymalizacji
  domyślny (bez `-O`), jak w `bride build`.
- Zegar monotoniczny (`clock_gettime` na POSIX, `QueryPerformanceCounter` na
  Windows); pomiar serializera obejmuje wyłącznie wywołanie
  `repr_html_tag()` (hash i `free` poza regionem mierzonym).

## Porównania z historią — planowane rozszerzenie

Obecnie każdy run zapisuje świeży JSON (artifact). Aby wykrywać regresje
obiektywnie:

1. zbierać wyniki z main przez dłuższy czas (workflow uruchamia się na
   pushach do main z filtrem zmian);
2. dodać krok porównujący bieżący JSON z artefaktem poprzedniego runa main
   (`actions/download-artifact` po nazwie `benchmark-results`) i raportować
   różnicę median jako informację w summary — nadal bez blokowania;
3. dopiero po ustabilizowaniu szumu rozważyć próg regresji (np. mediana
   gorsza o X% przy IQR < Y) jako `continue-on-error: true`, a potem jako
   check wymagany w branch protection.
