class Fretboard {
    // The guitar fretboard

    constructor(opts) {
        this.svg = opts.svg;
        this.persistence = opts.persistence;

        this.computeDependents();
        this.data = {};
        this.draw();

        this.persistence.restore(this);
    }

    computeClassNames(elem, classes) {
        var classValues = elem.className.baseVal.split(" ");
        if ("type" in classes) {
            classValues[0] = classes.type;
        }
        if ("color" in classes) {
            classValues[1] = classes.color;
        }
        if ("visibility" in classes) {
            classValues[2] = classes.visibility;
        }
        return classValues.join(" ");
    }

    computeDependents() {
        this.persistence.state.numFrets =
            this.persistence.state.endFret - this.persistence.state.startFret;
        this.persistence.state.fretboardWidth =
            this.persistence.state.fretWidth * this.persistence.state.numFrets;
    }

    computeNoteName(fret, string) {
        const interval =
            this.persistence.consts.stringIntervals[string] + fret + 1;
        return this.persistence.consts.notes[this.persistence.state.enharmonic][
            interval % 12
        ];
    }

    createSvgElement(tag, attributes = null) {
        const elem = document.createElementNS(
            "http://www.w3.org/2000/svg",
            tag
        );
        if (typeof attributes === "object") {
            setAttributes(elem, attributes);
        }
        return elem;
    }

    draw() {
        const error = document.querySelector(".error");
        if (error) {
            return;
        }

        this.drawFrets();
        this.drawStrings();
        this.drawFretMarkers();
        this.drawNumericMarkers();
        this.drawNotes();
        this.addEditableDiv();

        // adjust diagram width to number of selected frets
        setAttributes(this.svg, {
            width:
                this.persistence.state.fretboardWidth +
                2 * this.persistence.consts.offsetX,
        });

        this.svg.addEventListener("click", () => {
            if (this.persistence.state.selected) {
                this.updateNote(this.persistence.state.selected, {
                    visibility: "visible",
                });
                this.persistence.state.selected = null;
            }
        });
    }

    drawError(message) {
        const text = this.createSvgElement("text", {
            x: 400,
            y: 140,
            class: "error",
        });
        text.innerHTML = message;
        this.svg.appendChild(text);
        setAttributes(this.svg, {
            width: 800,
        });
    }

    drawFrets() {
        var pathSegments = [
            "M " +
                this.persistence.consts.offsetX +
                " " +
                this.persistence.consts.offsetY,
        ];
        for (
            let i = this.persistence.state.startFret;
            i < this.persistence.state.endFret + 1;
            i++
        ) {
            let factor =
                (i - this.persistence.state.startFret) % 2 == 0 ? 1 : -1;
            pathSegments.push(
                "v " + factor * this.persistence.state.fretHeight
            );
            pathSegments.push(
                "m " + this.persistence.state.fretWidth + " " + 0
            );
        }
        const path = pathSegments.join(" ");

        const frets = this.createSvgElement("path", {
            class: "frets",
            d: path,
        });
        this.svg.appendChild(frets);
    }

    drawFretMarkerDouble(markerId, x, y) {
        for (let i = 0; i < 2; i++) {
            const adjustedY =
                y -
                this.persistence.consts.offsetX +
                i * this.persistence.consts.offsetX * 2;
            const marker = this.createSvgElement("g", {
                id: markerId,
                transform: "translate(" + x + "," + adjustedY + ")",
                "data-x": x,
                "data-y": adjustedY,
            });
            this.fretMarkers.appendChild(marker);
            const circle1 = this.createSvgElement("circle", {
                r: this.persistence.consts.circleRadius / 1.5,
            });
            marker.appendChild(circle1);
        }
    }

    drawFretMarkerSingle(markerId, x, y) {
        const marker = this.createSvgElement("g", {
            id: markerId,
            transform: "translate(" + x + "," + y + ")",
            "data-x": x,
            "data-y": y,
        });
        this.fretMarkers.appendChild(marker);
        const circle = this.createSvgElement("circle", {
            r: this.persistence.consts.circleRadius / 1.5,
        });
        marker.appendChild(circle);
    }

    drawFretMarkers() {
        this.fretMarkers = this.createSvgElement("g", {
            class: "fretMarkers",
        });
        this.svg.appendChild(this.fretMarkers);
        for (let i = 0; i < this.persistence.consts.markers.length; i++) {
            const relativeMarkerFretPosition =
                this.persistence.consts.markers[i] -
                this.persistence.state.startFret;
            if (
                relativeMarkerFretPosition > 0 &&
                this.persistence.consts.markers[i] <=
                    this.persistence.state.endFret
            ) {
                const j = this.persistence.consts.numStrings / 2 - 0.5;
                const markerId = `fret-marker-${relativeMarkerFretPosition}`;
                const x =
                    this.persistence.consts.offsetX +
                    this.persistence.state.fretWidth / 2 +
                    this.persistence.state.fretWidth *
                        (relativeMarkerFretPosition - 1);
                const y =
                    this.persistence.consts.offsetY +
                    this.persistence.state.stringSpacing * j;
                if (
                    this.persistence.consts.doubleMarkers.includes(
                        this.persistence.consts.markers[i]
                    )
                ) {
                    this.drawFretMarkerDouble(markerId, x, y);
                } else {
                    this.drawFretMarkerSingle(markerId, x, y);
                }
            }
        }
    }

    drawNumericMarkers() {
        const markers = this.createSvgElement("g", {
            class: "markers",
        });
        const filteredMarkers = this.persistence.consts.markers.filter(
            (i) =>
                i > this.persistence.state.startFret &&
                i <= this.persistence.state.endFret
        );
        for (let i of filteredMarkers) {
            const marker = this.createSvgElement("text", {
                class: "marker",
                x:
                    this.persistence.consts.offsetX +
                    (i - 1 - this.persistence.state.startFret) *
                        this.persistence.state.fretWidth +
                    this.persistence.state.fretWidth / 2,
                y:
                    this.persistence.consts.offsetY +
                    this.persistence.state.fretHeight +
                    this.persistence.state.stringSpacing,
            });
            marker.innerHTML = i;
            markers.appendChild(marker);
        }
        this.svg.appendChild(markers);
    }

    drawStrings() {
        this.strings = this.createSvgElement("g", {
            class: "strings",
        });
        this.svg.appendChild(this.strings);
        for (let i = 0; i < this.persistence.consts.numStrings; i++) {
            let path =
                "M " +
                this.persistence.consts.offsetX +
                " " +
                (this.persistence.consts.offsetY +
                    i * this.persistence.state.stringSpacing) +
                " h " +
                this.persistence.state.fretboardWidth;
            const string = this.createSvgElement("path", {
                class: "string",
                d: path,
                styles: {
                    "stroke-width":
                        this.persistence.consts.minStringSize * (i + 1),
                },
            });
            this.strings.appendChild(string);
        }
    }

    drawNote(noteId, x, y, noteName, isOpen) {
        const note = this.createSvgElement("g", {
            id: noteId,
            transform: "translate(" + x + "," + y + ")",
            "data-x": x,
            "data-y": y,
        });
        this.notes.appendChild(note);
        note.addEventListener("click", (event) => this.noteClickHandler(event));
        note.addEventListener("dblclick", (event) =>
            this.noteDoubleClickHandler(event)
        );

        const circle = this.createSvgElement("circle", {
            r: this.persistence.consts.circleRadius,
        });
        if (isOpen) {
            setAttributes(circle, {
                // don't show circle around open notes
                stroke: "none",
            });
        }
        note.appendChild(circle);

        // compute name of note
        const text = this.createSvgElement("text", {
            "data-note": noteName,
        });
        text.innerHTML = noteName;

        note.appendChild(text);

        const update =
            noteId in this.data
                ? this.data[noteId]
                : {
                      type: "note",
                      color: "white",
                      visibility: this.persistence.state.visibility,
                  };
        this.updateNote(note, update);
    }

    drawNotes() {
        this.notes = this.createSvgElement("g", {
            class: "notes",
        });
        this.svg.appendChild(this.notes);

        // open notes (fret: -1)
        for (let j = 0; j < this.persistence.consts.numStrings; j++) {
            const noteId = `o-s${j}`;
            const x = this.persistence.consts.offsetX / 2;
            const y =
                this.persistence.consts.offsetY +
                this.persistence.state.stringSpacing * j;
            const noteName = this.computeNoteName(-1, j);
            this.drawNote(noteId, x, y, noteName, true);
        }
        // notes on fretboard
        for (
            let i = this.persistence.state.startFret;
            i < this.persistence.state.endFret;
            i++
        ) {
            for (let j = 0; j < this.persistence.consts.numStrings; j++) {
                const noteId = `f${i}-s${j}`;
                const x =
                    this.persistence.consts.offsetX +
                    this.persistence.state.fretWidth / 2 +
                    this.persistence.state.fretWidth *
                        (i - this.persistence.state.startFret);
                const y =
                    this.persistence.consts.offsetY +
                    this.persistence.state.stringSpacing * j;
                const noteName = this.computeNoteName(i, j);
                this.drawNote(noteId, x, y, noteName, false);
            }
        }
    }

    editSelectedLabel() {
        const selected = this.persistence.state.selected;
        const x = selected.getAttribute("data-x");
        const y = selected.getAttribute("data-y");
        setAttributes(this.editableText, {
            x: x - this.persistence.consts.circleRadius,
            y: y - this.persistence.consts.circleRadius + 4,
            height: 2 * this.persistence.consts.circleRadius,
            width: 2 * this.persistence.consts.circleRadius,
            class: "visible",
            styles: {
                display: "block",
            },
        });

        const selectedText = this.persistence.state.selected.lastChild;
        setAttributes(selectedText, {
            styles: {
                display: "none",
            },
        });

        this.editableText.children[0].innerHTML = selectedText.innerHTML;
        this.editableText.children[0].focus();
        // select all text in editable div
        document.execCommand("selectAll", false, null);
    }

    addEditableDiv() {
        this.editableText = this.createSvgElement("foreignObject", {
            class: "hidden",
        });
        this.editableText.addEventListener("click", (event) => {
            event.stopPropagation();
        });
        const div = document.createElement("div");
        div.setAttribute("contentEditable", "true");
        div.setAttribute("id", "editable-div");
        div.addEventListener("keydown", (event) => {
            event.stopPropagation();
            if (event.key === "Enter") {
                event.target.blur();
            }
        });
        div.addEventListener("blur", (event) => {
            if (!this.persistence.state.selected) {
                return;
            }
            const selectedText = this.persistence.state.selected.lastChild;

            var newText = this.editableText.children[0].innerText;
            // don't allow empty labels
            if (newText.trim()) {
                this.updateNote(this.persistence.state.selected, {
                    noteText: newText,
                });
                this.persistence.save();
            }

            this.editableText.children[0].innerHTML = "";
            setAttributes(selectedText, {
                styles: {
                    display: "block",
                },
            });
            setAttributes(this.editableText, {
                styles: {
                    display: "none",
                },
            });
        });
        this.editableText.appendChild(div);
        this.svg.appendChild(this.editableText);
    }

    erase() {
        this.svg.innerHTML = "";
    }

    noteClickHandler(event) {
        event.stopPropagation();
        const note = event.currentTarget;
        note.focus();
        if (this.persistence.state.selected) {
            this.updateNote(this.persistence.state.selected, {
                visibility: "visible",
            });
        }
        this.updateNote(note, {
            visibility: "selected",
        });
        this.persistence.state.selected = note;

        if (event.ctrlKey) {
            this.editSelectedLabel();
        }
        this.persistence.save();
    }

    noteDoubleClickHandler(event) {
        event.stopPropagation();
        const note = event.currentTarget;
        if (this.persistence.state.selected) {
            this.updateNote(this.persistence.state.selected, {
                visibility: "visible",
            });
        }
        this.updateNote(note, {
            visibility: "selected",
        });
        this.persistence.state.selected = note;
        this.editSelectedLabel();
    }

    updateNote(elem, update) {
        if (!(elem.id in this.data)) {
            this.data[elem.id] = {};
        }
        const classValue = this.computeClassNames(elem, update);
        elem.setAttribute("class", classValue);

        if ("noteText" in update) {
            elem.lastChild.innerHTML = update.noteText;
        }

        const noteData = this.data[elem.id];
        for (let [key, value] of Object.entries(update)) {
            noteData[key] = value;
        }
        this.persistence.state.notes[elem.id] = noteData;
    }
}
