const colorDecoder = {
    0: "white",
    1: "red",
    2: "orange",
    3: "yellow",
    4: "brown",
    5: "light_green",
    6: "green",
    7: "pink",
    8: "purple",
    9: "blue",
    A: "teal",
    B: "lime_green",
    C: "black",
    D: "dark_gray",
    E: "gray",
};

const colorEncoder = {};
Object.entries(colorDecoder).forEach(([k, v]) => {
    colorEncoder[v] = k;
});

const fretboardConstants = {
    offsetX: 40,
    offsetY: 30,
    paddingY: 20,
    stringIntervals: [24, 19, 15, 10, 5, 0],
    markers: [3, 5, 7, 9, 12, 15, 17, 19, 21],
    doubleMarkers: [12, 24],
    minStringSize: 0.2,
    circleRadius: 18,
    //  prettier-ignore
    notes: [['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'],
          ['E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb']],
    sign: ["♯", "♭"],
};
