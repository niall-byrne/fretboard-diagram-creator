class Image {
    constructor(opts) {
        this.controls = opts.controls;
        this.svg = svg;
        this.svgProperties = [
            "fill",
            "stroke",
            "stroke-width",
            "text-anchor",
            "dominant-baseline",
        ];
        this.svgLink = document.getElementById("svg-link");
    }

    download() {
        controls.actionClearSelection();
        const svgCopy = this.inlineCSS(svg);
        const svgData = svgCopy.outerHTML;
        const svgBlob = new Blob([svgData], {
            type: "image/svg+xml;charset=utf-8",
        });
        const svgUrl = URL.createObjectURL(svgBlob);
        this.svgLink.href = svgUrl;
        this.svgLink.click();
    }

    inlineCSS(svg) {
        const svgElements = document.querySelectorAll("#fretboard *");
        const clonedSVG = this.svg.cloneNode(true);
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
            for (let attr of this.svgProperties) {
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
}
