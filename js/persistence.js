class Persistence {
    // Manages state and persistence of state

    constructor() {
        const fretWidthInput = document.getElementById("fret-width-slider");
        const fretHeightInput = document.getElementById("fret-height-slider");

        this.consts = {
            offsetX: 40,
            offsetY: 30,
            paddingY: 20,
            stringIntervals: [24, 19, 15, 10, 5, 0],
            markers: [3, 5, 7, 9, 12, 15, 17, 19, 21],
            doubleMarkers: [12, 24],
            minStringSize: 0.2,
            maxStringSpacing: parseInt(fretHeightInput.getAttribute("max")),
            minStringSpacing: parseInt(fretHeightInput.getAttribute("min")),
            maxFretWidth: parseInt(fretWidthInput.getAttribute("max")),
            minFretWidth: parseInt(fretWidthInput.getAttribute("min")),
            circleRadius: 18,
            //  prettier-ignore
            notes: [['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'],
                  ['E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb']],
            sign: ["♯", "♭"],
        };

        this.consts.numStrings = this.consts.stringIntervals.length;

        this.initial = {
            selected: null,
            visibility: "transparent",
            startFret: 0,
            stringSpacing: parseInt(fretHeightInput.value),
            endFret: 12,
            enharmonic: 0,
            fretHeight:
                (this.consts.numStrings - 1) * parseInt(fretHeightInput.value),
            fretWidth: parseInt(fretWidthInput.value),
            notes: {},
        };

        this.reset();
    }

    clear() {
        const url = new URL(location.href);
        url.searchParams.delete("state");
        history.replaceState(null, "", url);
    }

    reset() {
        this.state = Object.assign({}, this.initial);

        // Set end fret according to viewport width
        this.state.endFret = Math.min(
            Math.floor(
                (window.innerWidth - 2 * this.consts.offsetX) /
                    this.initial.fretWidth
            ),
            12
        );
    }

    restore(fretboard) {
        const urlParams = new URLSearchParams(window.location.search);
        const state = urlParams.get("state");
        if (state) {
            const savedState = JSON.parse(atob(state));
            this.state = savedState;
            for (let key in this.state.notes) {
                if (this.state.notes.hasOwnProperty(key)) {
                    const note = document.querySelector("#" + key);
                    if (note) {
                        fretboard.updateNote(note, this.state.notes[key]);
                    }
                }
            }
            fretboard.erase();
            fretboard.draw();
        }
    }

    save() {
        const savedState = Object.assign({}, this.state);
        savedState.selected = null;
        for (let key in this.state.notes) {
            if (this.state.notes.hasOwnProperty(key)) {
                const value = this.state.notes[key];
                // don't save selections
                if (value.visibility === "selected") {
                    value.visibility = "visible";
                }
                // don't save transparent notes
                if (value.visibility === "transparent") {
                    delete this.state.notes[key];
                }
            }
        }

        const param = btoa(JSON.stringify(savedState));
        const url = new URL(location.href);
        url.searchParams.set("state", param);
        history.replaceState(null, "", url);
    }
}
