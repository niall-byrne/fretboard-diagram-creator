/* Main */

/* Initialize diagram */

const svg = document.getElementById("fretboard");

const persistence = new Persistence();
const fretboard = new Fretboard({
    svg,
    persistence,
});
const controls = new Controls({
    fretboard,
    persistence,
});
const image = new Image({ controls, svg });

controls.refresh();

/* Register controls */

for (const colourButton of controls.controllers.colourControls) {
    colourButton.addEventListener("click", (event) =>
        controls.actionChangeColor(event)
    );
}
controls.controllers.deleteControl.addEventListener("click", () =>
    controls.actionDeleteNote()
);

controls.controllers.enharmonicControl.addEventListener("click", () =>
    controls.actionToggleEnharmonic()
);
controls.controllers.visibilityToggleControl.addEventListener("click", () =>
    controls.actionToggleVisibility()
);
controls.controllers.saveControl.addEventListener("click", () =>
    image.download()
);
controls.controllers.resetControl.addEventListener("click", () =>
    controls.actionResetDiagram()
);

controls.controllers.fretStartControl.addEventListener("input", (event) =>
    controls.actionChangeFretWindow({ start: parseInt(event.target.value) - 1 })
);
controls.controllers.fretEndControl.addEventListener("input", (event) =>
    controls.actionChangeFretWindow({ end: parseInt(event.target.value) })
);

controls.controllers.fretWidthControl.addEventListener("input", (event) => {
    controls.actionChangeFretSize({ width: parseInt(event.target.value) });
});
controls.controllers.fretHeightControl.addEventListener("input", (event) => {
    controls.actionChangeFretSize({ height: parseInt(event.target.value) });
});

/* Original Key Bindings */

document.addEventListener("keydown", (event) => {
    if (!persistence.state.selected || !event.code) {
        return;
    }
    const selected = persistence.state.selected;
    switch (event.code) {
        case "Backspace":
        case "Delete":
            controls.actionDeleteNote();
            break;
        case "KeyB":
            fretboard.updateNote(selected, { color: "blue" });
            break;
        case "KeyD":
            fretboard.updateNote(selected, { color: "black" });
            break;
        case "KeyG":
            fretboard.updateNote(selected, { color: "green" });
            break;
        case "KeyW":
            fretboard.updateNote(selected, { color: "white" });
            break;
        case "KeyR":
            fretboard.updateNote(selected, { color: "red" });
            break;
    }
});
