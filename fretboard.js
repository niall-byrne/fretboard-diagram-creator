function setAttributes(elem, attrs) {
    for (var idx in attrs) {
        if (
            (idx === "styles" || idx === "style") &&
            typeof attrs[idx] === "object"
        ) {
            const styles = [];
            for (var prop in attrs[idx]) {
                styles.push(`${prop}: ${attrs[idx][prop]};`);
            }
            elem.setAttribute("style", styles.join(" "));
        } else if (idx === "html") {
            elem.innerHTML = attrs[idx];
        } else {
            elem.setAttribute(idx, attrs[idx]);
        }
    }
}

function generateClassValue(elem, classes) {
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

function createSvgElement(tag, attributes = null) {
    const elem = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (typeof attributes === "object") {
        setAttributes(elem, attributes);
    }
    return elem;
}

class Peristence {
    // Manages state and persistence of state

    constructor() {
        this.initial = {
            selected: null,
            visibility: "transparent",
            startFret: 0,
            endFret: 12,
            enharmonic: 0,
            notes: {},
        };

        this.consts = {
            offsetX: 40,
            offsetY: 30,
            stringIntervals: [24, 19, 15, 10, 5, 0],
            markers: [3, 5, 7, 9, 12, 15, 17, 19, 21],
            doubleMarkers: [12, 24],
            fretWidth: 70,
            stringSpacing: 40,
            minStringSize: 0.2,
            circleRadius: 18,
            //  prettier-ignore
            notes: [['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'],
                    ['E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb']],
            sign: ["♯", "♭"],
        };

        this.consts.numStrings = this.consts.stringIntervals.length;
        this.consts.fretHeight =
            (this.consts.numStrings - 1) * this.consts.stringSpacing;

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
                    this.consts.fretWidth
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

class Controls {
    // Exposes controls directly to the web application

    constructor(opts) {
        this.persistence = opts.persistence;
        this.fretboard = opts.fretboard;

        this.controllers = {
            colourControls: document.querySelectorAll("button.color"),
            deleteControl: document.getElementById("delete-note"),
            enharmonicControl: document.getElementById("enharmonic"),
            fretEndControl: document.getElementById("end-fret"),
            fretStartControl: document.getElementById("start-fret"),
            resetControl: document.getElementById("reset"),
            visibilityToggleControl: document.getElementById("visibility"),
        };
    }

    clearSelection() {
        const selected = this.persistence.state.selected;
        if (!selected) {
            return;
        }
        fretboard.updateNote(selected, {
            visibility: "visible",
        });
        this.persistence.state.selected = null;
    }

    deleteNote() {
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

    toggleEnharmonic() {
        const untoggledEnharmonic = this.persistence.state.enharmonic;
        this.persistence.state.enharmonic = (untoggledEnharmonic + 1) % 2;
        this.updateEnharmonic();
        this.controllers.enharmonicControl.innerHTML =
            this.persistence.consts.sign[untoggledEnharmonic];
    }

    toggleVisibility() {
        this.persistence.state.visibility =
            this.persistence.state.visibility === "hidden"
                ? "transparent"
                : "hidden";
        this.updateVisibillity();
    }

    resetDiagram() {
        const confirmed = window.confirm(
            "Do you really want to reset your diagram?"
        );
        if (!confirmed) {
            return;
        }

        this.clearSelection();

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
        this.updateFretWindow();
        this.updateControllers();
        this.updateVisibillity();
        this.persistence.clear();
    }

    updateColor(event) {
        const selected = this.persistence.state.selected;
        if (!selected) {
            return;
        }
        this.fretboard.updateNote(selected, {
            color: event.currentTarget.getAttribute("title"),
        });
        this.persistence.save();
    }

    updateControllers() {
        this.controllers.fretStartControl.value =
            this.persistence.state.startFret + 1;
        this.controllers.fretEndControl.value = this.persistence.state.endFret;
        this.controllers.enharmonicControl.innerHTML =
            this.persistence.consts.sign[
                (this.persistence.state.enharmonic + 1) % 2
            ];
    }

    updateEnharmonic() {
        this.fretboard.erase();
        this.fretboard.draw();
        this.persistence.save();
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

        this.fretboard.computeDependents();
        this.fretboard.draw();
        this.persistence.save();
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
        this.persistence.save();
    }
}

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

    computeDependents() {
        this.persistence.state.numFrets =
            this.persistence.state.endFret - this.persistence.state.startFret;
        this.persistence.state.fretboardWidth =
            this.persistence.consts.fretWidth * this.persistence.state.numFrets;
    }

    computeNoteName(fret, string) {
        const interval =
            this.persistence.consts.stringIntervals[string] + fret + 1;
        return this.persistence.consts.notes[this.persistence.state.enharmonic][
            interval % 12
        ];
    }

    draw() {
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

        document.addEventListener("keydown", (event) => {
            if (!this.persistence.state.selected || !event.code) {
                return;
            }
            const selected = this.persistence.state.selected;
            switch (event.code) {
                case "Backspace":
                case "Delete":
                    this.deleteNote();
                    break;
                case "KeyB":
                    this.updateNote(selected, { color: "blue" });
                    break;
                case "KeyD":
                    this.updateNote(selected, { color: "black" });
                    break;
                case "KeyG":
                    this.updateNote(selected, { color: "green" });
                    break;
                case "KeyW":
                    this.updateNote(selected, { color: "white" });
                    break;
                case "KeyR":
                    this.updateNote(selected, { color: "red" });
                    break;
            }
        });
    }

    drawError(message) {
        const text = createSvgElement("text", {
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
                "v " + factor * this.persistence.consts.fretHeight
            );
            pathSegments.push(
                "m " + this.persistence.consts.fretWidth + " " + 0
            );
        }
        const path = pathSegments.join(" ");

        const frets = createSvgElement("path", {
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
            const marker = createSvgElement("g", {
                id: markerId,
                transform: "translate(" + x + "," + adjustedY + ")",
                "data-x": x,
                "data-y": adjustedY,
            });
            this.fretMarkers.appendChild(marker);
            const circle1 = createSvgElement("circle", {
                r: this.persistence.consts.circleRadius / 1.5,
            });
            marker.appendChild(circle1);
        }
    }

    drawFretMarkerSingle(markerId, x, y) {
        const marker = createSvgElement("g", {
            id: markerId,
            transform: "translate(" + x + "," + y + ")",
            "data-x": x,
            "data-y": y,
        });
        this.fretMarkers.appendChild(marker);
        const circle = createSvgElement("circle", {
            r: this.persistence.consts.circleRadius / 1.5,
        });
        marker.appendChild(circle);
    }

    drawFretMarkers() {
        this.fretMarkers = createSvgElement("g", {
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
                    this.persistence.consts.fretWidth / 2 +
                    this.persistence.consts.fretWidth *
                        (relativeMarkerFretPosition - 1);
                const y =
                    this.persistence.consts.offsetY +
                    this.persistence.consts.stringSpacing * j;
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
        const markers = createSvgElement("g", {
            class: "markers",
        });
        const filteredMarkers = this.persistence.consts.markers.filter(
            (i) =>
                i > this.persistence.state.startFret &&
                i <= this.persistence.state.endFret
        );
        for (let i of filteredMarkers) {
            const marker = createSvgElement("text", {
                class: "marker",
                x:
                    this.persistence.consts.offsetX +
                    (i - 1 - this.persistence.state.startFret) *
                        this.persistence.consts.fretWidth +
                    this.persistence.consts.fretWidth / 2,
                y:
                    this.persistence.consts.offsetY +
                    this.persistence.consts.fretHeight +
                    this.persistence.consts.stringSpacing,
            });
            marker.innerHTML = i;
            markers.appendChild(marker);
        }
        this.svg.appendChild(markers);
    }

    drawStrings() {
        this.strings = createSvgElement("g", {
            class: "strings",
        });
        this.svg.appendChild(this.strings);
        for (let i = 0; i < this.persistence.consts.numStrings; i++) {
            let path =
                "M " +
                this.persistence.consts.offsetX +
                " " +
                (this.persistence.consts.offsetY +
                    i * this.persistence.consts.stringSpacing) +
                " h " +
                this.persistence.state.fretboardWidth;
            const string = createSvgElement("path", {
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
        const note = createSvgElement("g", {
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

        const circle = createSvgElement("circle", {
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
        const text = createSvgElement("text", {
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
        this.notes = createSvgElement("g", {
            class: "notes",
        });
        this.svg.appendChild(this.notes);

        // open notes (fret: -1)
        for (let j = 0; j < this.persistence.consts.numStrings; j++) {
            const noteId = `o-s${j}`;
            const x = this.persistence.consts.offsetX / 2;
            const y =
                this.persistence.consts.offsetY +
                this.persistence.consts.stringSpacing * j;
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
                    this.persistence.consts.fretWidth / 2 +
                    this.persistence.consts.fretWidth *
                        (i - this.persistence.state.startFret);
                const y =
                    this.persistence.consts.offsetY +
                    this.persistence.consts.stringSpacing * j;
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
        this.editableText = createSvgElement("foreignObject", {
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
        const classValue = generateClassValue(elem, update);
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

/* Main */

/* Initialize diagram */

const svg = document.getElementById("fretboard");

const persistence = new Peristence();
const fretboard = new Fretboard({
    svg,
    persistence,
});
const controls = new Controls({
    fretboard,
    persistence,
});

controls.updateControllers();

/* Save SVG button */

var svgButton = document.getElementById("save-svg");
const svgLink = document.getElementById("svg-link");

svgButton.addEventListener("click", () => {
    controls.clearSelection();
    const svgCopy = inlineCSS(svg);
    var svgData = svgCopy.outerHTML;
    var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    var svgUrl = URL.createObjectURL(svgBlob);
    svgLink.href = svgUrl;
    svgLink.click();
});

const PROPERTIES = [
    "fill",
    "stroke",
    "stroke-width",
    "text-anchor",
    "dominant-baseline",
];

function inlineCSS(svg) {
    const svgElements = document.querySelectorAll("#fretboard *");
    const clonedSVG = svg.cloneNode((deep = true));
    const clonedElements = clonedSVG.querySelectorAll("*");
    for (let i = 0; i < svgElements.length; i++) {
        const computedStyle = getComputedStyle(svgElements[i]);
        // remove invisible elements to reduce file size
        const opacity = computedStyle.getPropertyValue("opacity");
        if (opacity === "0") {
            clonedElements[i].remove();
            continue;
        }
        const styles = { opacity: opacity };
        for (let attr of PROPERTIES) {
            let value = computedStyle.getPropertyValue(attr);
            if (value) {
                styles[attr] = value;
            }
        }
        setAttributes(clonedElements[i], {
            styles: styles,
        });
    }
    return clonedSVG;
}

/* Register controls */

for (const colourButton of controls.controllers.colourControls) {
    colourButton.addEventListener("click", (event) =>
        controls.updateColor(event)
    );
}
controls.controllers.deleteControl.addEventListener("click", () =>
    controls.deleteNote()
);

controls.controllers.enharmonicControl.addEventListener("click", () =>
    controls.toggleEnharmonic()
);
controls.controllers.visibilityToggleControl.addEventListener("click", () =>
    controls.toggleVisibility()
);
controls.controllers.resetControl.addEventListener("click", () =>
    controls.resetDiagram()
);

controls.controllers.fretStartControl.addEventListener("input", (event) =>
    controls.updateFretWindow({ start: parseInt(event.target.value) - 1 })
);
controls.controllers.fretEndControl.addEventListener("input", (event) =>
    controls.updateFretWindow({ end: parseInt(event.target.value) })
);
