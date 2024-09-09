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
