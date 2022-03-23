// add on document load listener
window.addEventListener('load', function () {
    const canvas = document.getElementById('canvas');
    const source = new Image();
    let contours = null;
    let hierarchy = null;

    // wait until CV is REALLY initialized
    cv.onRuntimeInitialized = function () {
        const fromIndex = window.location.href.lastIndexOf('/') + 1;
        socket.emit('get_coloring_data', window.location.href.substring(fromIndex), (data) => {
            const filters = data['filters'];
            source.onload = async function () {
                [contours, hierarchy] = await drawPicture(canvas, source, filters);
                loadingIndicator.hidden = true;
            }
            source.src = data['source'];
        })

        // on context click event
        canvas.onclick = function (ev) {
            console.log('canvas onclick caught', ev.offsetX, ':', ev.offsetY);
            // detect clicked area
            if (!contours || !hierarchy) {
                alert('Critical error!');
                return
            }

            // Note that the designations "inner" and "outer" are used here in relation to the contour, not to the point
            let outerContoursIndex = [];
            for (let i = 0; i < contours.size(); i++) {
                const ci = contours.get(i);
                // let dist = cv.pointPolygonTest(ci, new cv.Point(ev.offsetX, ev.offsetY), true);
                const dist = cv.pointPolygonTest(ci, new cv.Point(ev.offsetX, ev.offsetY), false);
                if (dist > 0)
                    outerContoursIndex.push(i);
            }
            const clickedIndex = outerContoursIndex[outerContoursIndex.length - 1];
            // collect all children of clicked contour
            let childContours = []
            for (let i = 0; i < contours.size(); i++) {
                const hi = hierarchy.intPtr(0, i);
                if (hi[3] === clickedIndex)
                    childContours.push(contours.get(i));
            }
            // console.log('children:', childContours)
            // console.log('contours', outerContoursIndex)

            // fill clicked contour
            fillContour(canvas, source, contours.get(clickedIndex), childContours);
        }
    }
});
