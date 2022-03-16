// add on document load listener
window.addEventListener('load', function () {
    const canvas = document.getElementById('canvas');

    // check compatibility
    if (!canvas.getContext) {
        alert("Your browser doesn't support canvas.");
        return
    }
    const context = canvas.getContext('2d');

    // on context click event
    canvas.onclick = function (ev) {
        console.log('canvas onclick caught', ev.offsetX, ':', ev.offsetY);
        socket.emit('click', [ev.offsetX, ev.offsetY], function (points) {
            console.log('contour points:', points);
            drawContour(context, points, 'static/media/testpic.jpg')
        });
    }
    drawPicture(context, 'static/media/testpic_contours.jpg');
});
