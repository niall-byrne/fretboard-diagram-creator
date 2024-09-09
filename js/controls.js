class Controls {
    // Exposes controls directly to the web application

    constructor(opts) {
        this.persistence = opts.persistence;
        this.fretboard = opts.fretboard;

        this.gauges = {
            freightHeightGauge: document.getElementById("fret-height-value"),
            freightWidthGauge: document.getElementById("fret-width-value"),
        };

        this.controllers = {
            colourControls: document.querySelectorAll("button.color"),
            deleteControl: document.getElementById("delete-note"),
            enharmonicControl: document.getElementById("enharmonic"),
            fretEndControl: document.getElementById("end-fret"),
            fretHeightControl: document.getElementById("fret-height-slider"),
            fretStartControl: document.getElementById("start-fret"),
            fretWidthControl: document.getElementById("fret-width-slider"),
            resetControl: document.getElementById("reset"),
            saveControl: document.getElementById("save-svg"),
            visibilityToggleControl: document.getElementById("visibility"),
        };
    }

    actionChangeColor(event) {
        const selected = this.persistence.state.selected;
        if (!selected) {
            return;
        }
        this.fretboard.updateNote(selected, {
            color: event.currentTarget.getAttribute("title"),
        });
        this.persistence.save();
    }

    actionChangeFretSize(fretSize) {
        this.updateFretSize(fretSize);
        this.fretboard.computeDependents();
        this.fretboard.draw();
        this.persistence.save();
    }

    actionChangeFretWindow(fretSize) {
        this.updateFretWindow(fretSize);
        this.fretboard.computeDependents();
        this.fretboard.draw();
        this.persistence.save();
    }

    actionClearSelection() {
        const selected = this.persistence.state.selected;
        if (!selected) {
            return;
        }
        fretboard.updateNote(selected, {
            visibility: "visible",
        });
        this.persistence.state.selected = null;
    }

    actionDeleteNote() {
        const selected = this.persistence.state.selected;
        if (!selected) {
            return;
        }
        const text = selected.lastChild;
        if (text) {
            text.innerHTML = text.getAttribute("data-note");
        }
        this.fretboard.updateNote(selected, {
            color: "white",
            visibility: this.persistence.state.visibility,
        });
        this.persistence.state.selected = null;
        this.persistence.save();
    }

    actionToggleEnharmonic() {
        const untoggledEnharmonic = this.persistence.state.enharmonic;
        this.persistence.state.enharmonic = (untoggledEnharmonic + 1) % 2;
        this.controllers.enharmonicControl.innerHTML =
            this.persistence.consts.sign[untoggledEnharmonic];
        this.fretboard.erase();
        this.fretboard.draw();
        this.persistence.save();
    }

    actionToggleVisibility() {
        this.persistence.state.visibility =
            this.persistence.state.visibility === "hidden"
                ? "transparent"
                : "hidden";
        this.updateVisibillity();
        this.persistence.save();
    }

    actionResetDiagram() {
        const confirmed = window.confirm(
            "Do you really want to reset your diagram?"
        );
        if (!confirmed) {
            return;
        }

        this.actionClearSelection();

        this.data = {};
        for (let note of fretboard.notes.children) {
            // reset text
            const text = note.lastChild;
            if (text) {
                text.innerHTML = text.getAttribute("data-note");
            }
            fretboard.updateNote(note, {
                type: "note",
                color: "white",
                visibility: this.persistence.state.visibility,
            });
        }

        this.persistence.reset();

        this.refresh();

        this.persistence.clear();
    }

    refresh() {
        this.updateFretSize();
        this.updateFretWindow();
        this.updateControllers();
        this.updateVisibillity();
        this.fretboard.computeDependents();
        fretboard.draw();
    }

    updateControllers() {
        this.controllers.fretHeightControl.value =
            this.persistence.state.stringSpacing;
        this.controllers.fretWidthControl.value =
            this.persistence.state.fretWidth;
        this.controllers.fretStartControl.value =
            this.persistence.state.startFret + 1;
        this.controllers.fretEndControl.value = this.persistence.state.endFret;
        this.controllers.enharmonicControl.innerHTML =
            this.persistence.consts.sign[
                (this.persistence.state.enharmonic + 1) % 2
            ];
    }

    updateFretSize(fretSize) {
        const height =
            fretSize && "height" in fretSize
                ? fretSize.height
                : this.persistence.state.stringSpacing;
        const width =
            fretSize && "width" in fretSize
                ? fretSize.width
                : this.persistence.state.fretWidth;

        this.fretboard.erase();

        if (
            height < this.persistence.consts.minStringSpacing ||
            height > this.persistence.consts.maxStringSpacing
        ) {
            this.fretboard.drawError("Invalid fret height value!");
            return;
        }
        if (
            width < this.persistence.consts.minFretWidth ||
            width > this.persistence.consts.maxFretWidth
        ) {
            this.fretboard.drawError("Invalid fret width value!");
            return;
        }

        this.persistence.state.stringSpacing = height;
        this.persistence.state.fretHeight =
            (this.persistence.consts.numStrings - 1) *
            this.persistence.state.stringSpacing;
        this.persistence.state.fretWidth = width;

        const svgHeight =
            this.persistence.consts.offsetY * 2 +
            this.persistence.state.fretHeight +
            this.persistence.consts.paddingY;

        // Resize SVG as needed
        document
            .getElementById("fretboard")
            .setAttribute("height", `${svgHeight}px`);

        // Update Gaages
        this.gauges.freightWidthGauge.innerText =
            width - this.persistence.consts.minFretWidth;
        this.gauges.freightHeightGauge.innerText =
            height - this.persistence.consts.minStringSpacing;
    }

    updateFretWindow(fretWindow) {
        const start =
            fretWindow && "start" in fretWindow
                ? fretWindow.start
                : this.persistence.state.startFret;
        const end =
            fretWindow && "end" in fretWindow
                ? fretWindow.end
                : this.persistence.state.endFret;

        this.fretboard.erase();

        if (start < 0 || start > 22 || end < 1 || end > 22) {
            fretboard.drawError("Invalid fret value(s)!");
            return;
        }

        if (end <= start) {
            fretboard.drawError(
                "End fret must not be smaller than start fret!"
            );
            this.persistence.state.startFret = start;
            this.persistence.state.endFret = end;
            return;
        }

        if (end - start > 16) {
            fretboard.drawError(
                "Maximal number of displayable frets is 16, <br/> e.g., 1st to 16th or 4th to 19th!"
            );
            this.persistence.state.startFret = start;
            this.persistence.state.endFret = end;
            return;
        }

        this.persistence.state.startFret = start;
        this.persistence.state.endFret = end;
    }

    updateVisibillity() {
        for (let note of this.fretboard.notes.children) {
            if (
                note.className.baseVal.endsWith("visible") ||
                note.className.baseVal.endsWith("selected")
            ) {
                continue;
            }
            this.fretboard.updateNote(note, {
                visibility: this.persistence.state.visibility,
            });
        }

        for (let [_key, value] of Object.entries(this.fretboard.data)) {
            if (
                value["visibility"] === "visible" ||
                value["visibility"] === "selected"
            ) {
                continue;
            }
            value["visibility"] = this.persistence.state.visibility;
        }
    }
}
