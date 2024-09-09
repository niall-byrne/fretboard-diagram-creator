class Persistence {
    // Manages state and persistence of state

    constructor() {
        const fretWidthInput = document.getElementById("fret-width-slider");
        const fretHeightInput = document.getElementById("fret-height-slider");

        this.consts = fretboardConstants;
        this.consts.maxStringSpacing = parseInt(
            fretHeightInput.getAttribute("max")
        );
        this.consts.minStringSpacing = parseInt(
            fretHeightInput.getAttribute("min")
        );
        this.consts.maxFretWidth = parseInt(fretWidthInput.getAttribute("max"));
        this.consts.minFretWidth = parseInt(fretWidthInput.getAttribute("min"));
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

    decodeNote(encodedNote) {
        const decodedNote = {
            color: colorDecoder[encodedNote.c],
            visibility: "visible",
            type: "note",
        };
        if (encodedNote.noteText) {
            decodedNote["noteText"] = encodedNote.noteText;
        }
        return decodedNote;
    }

    encodeNote(decodedNote) {
        const encodedNote = {
            c: colorEncoder[decodedNote.color],
        };
        if (decodedNote.noteText) {
            encodedNote["noteText"] = decodedNote.noteText;
        }
        return encodedNote;
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
            const restoredState = JSON.parse(atob(state));

            for (const key in restoredState) {
                if (key !== "encodedNotes") {
                    this.state[key] = restoredState[key];
                }
            }

            for (const key in restoredState.encodedNotes) {
                const note = document.querySelector("#" + key);
                const attributes = this.decodeNote(
                    restoredState.encodedNotes[key]
                );
                if (note) {
                    fretboard.updateNote(note, attributes);
                }
            }

            fretboard.erase();
            fretboard.draw();
        }
    }

    save() {
        const savedState = Object.assign({}, this.state);
        savedState.selected = null;
        delete savedState.notes;

        const encodedNotes = {};

        for (let key in this.state.notes) {
            const value = this.state.notes[key];
            if (["visible", "selected"].includes(value.visibility)) {
                encodedNotes[key] = this.encodeNote(value);
            }
        }

        savedState.encodedNotes = encodedNotes;

        const param = btoa(JSON.stringify(savedState));

        const url = new URL(location.href);
        url.searchParams.set("state", param);
        history.replaceState(null, "", url);
    }
}
