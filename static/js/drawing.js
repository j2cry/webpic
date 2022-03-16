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
