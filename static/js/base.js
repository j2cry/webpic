const canvas = document.getElementById('canvas');
const socket = io();


function drawPicture(ctx, sourcePath) {
    let image = new Image();
    image.onload = function () {
        ctx.canvas.width = image.width;
        ctx.canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
    }
    image.src = sourcePath;
}

function drawContour(ctx, points, sourcePath) {
    let image = new Image();
    image.src = sourcePath;
    image.onload = function () {
        let pattern = ctx.createPattern(image, 'repeat');
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = pattern;
        ctx.moveTo(points[0][0][0], points[0][0][1])
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0][0], points[i][0][1]);
        }
        ctx.lineTo(points[0][0][0], points[0][0][1]);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}


// on document is ready
window.onload = function () {
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
}
