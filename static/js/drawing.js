function drawPicture(ctx, sourcePath, filters) {
    return new Promise((resolve, reject) => {
        let image = new Image();
        image.onload = function () {
            // TODO: add pre-scaling if size is more than required
            ctx.canvas.width = image.width;
            ctx.canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            // apply filters
            if (filters !== undefined) {
                // parse parameters
                let contoursOnly = filters['checkBlankBack'];

                // init images
                let originalImage = cv.imread(ctx.canvas);
                let contoursImage = new cv.Mat(originalImage.rows, originalImage.cols, originalImage.type(), [255,255,255,255]);
                let filteredImage = new cv.Mat();
                // parse filters
                let blur = filters['rangeBlur'];
                let low = [filters['rangeB1'], filters['rangeG1'], filters['rangeR1'], 0]
                let high = [filters['rangeB2'], filters['rangeG2'], filters['rangeR2'], 255]
                low = new cv.Mat(originalImage.rows, originalImage.cols, originalImage.type(), low);
                high = new cv.Mat(originalImage.rows, originalImage.cols, originalImage.type(), high);
                // apply filters
                cv.blur(originalImage, filteredImage, new cv.Size(blur, blur));
                cv.inRange(filteredImage, low, high, filteredImage);
                // cv.cvtColor(originalImage, filteredImage, cv.COLOR_RGBA2GRAY, 0);
                low.delete();
                high.delete();
                // TODO: how to make `master` contour?

                // find contours and draw
                let contours = new cv.MatVector();
                let hierarchy = new cv.Mat();
                let color = new cv.Scalar(0, 0, 255, 255);       // TODO: add contour color selector
                cv.findContours(filteredImage, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
                for (let i = 0; i < contours.size(); i++) {
                    cv.drawContours(contoursOnly ? contoursImage : originalImage, contours, i, color, 1, cv.LINE_AA, hierarchy, 100);
                }
                contours.delete();
                hierarchy.delete();
                cv.imshow(ctx.canvas, contoursOnly ? contoursImage : originalImage);

                // resolve
                let filteredCanvas = document.createElement('canvas');
                cv.imshow(filteredCanvas, filteredImage);
                resolve(filteredCanvas.toDataURL('image/png'));
                // delete images
                originalImage.delete();
                filteredImage.delete();
                contoursImage.delete();
            } else {
                reject();
            }
        }
        image.src = sourcePath;
    })
}

function drawContour(ctx, points, sourcePath) {
    // TODO: draw contours based on filtered image downloaded from server
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
