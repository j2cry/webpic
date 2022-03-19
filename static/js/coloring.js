// add on document load listener
window.addEventListener('load', function () {
    const canvas = document.getElementById('canvas');
    let contours = null;
    let hierarchy = null;

    // wait until CV is REALLY initialized
    cv.onRuntimeInitialized = function () {
        const fromIndex = window.location.href.lastIndexOf('/') + 1;
        socket.emit('get_coloring_data', window.location.href.substring(fromIndex), (data) => {
            const imageURL = data['source'];
            const filters = data['filters'];
            drawPicture(canvas, imageURL, filters)
                .then((value) => {
                    [contours, hierarchy] = value;
                    loadingIndicator.hidden = true;
                })
        })
    }



    // on context click event
    // canvas.onclick = function (ev) {
    //     console.log('canvas onclick caught', ev.offsetX, ':', ev.offsetY);
    //     socket.emit('click', [ev.offsetX, ev.offsetY], function (points) {
    //         console.log('contour points:', points);
    //         drawContour(context, points, 'static/media/testpic.jpg')
    //     });
    // }
    // drawPicture(context, 'static/media/testpic_contours.jpg');
});
