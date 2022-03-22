function drawPicture(canvas, sourceImage, filters) {
    return new Promise((resolve, reject) => {
        // TODO: add pre-scaling if size is more than required
        canvas.width = sourceImage.width;
        canvas.height = sourceImage.height;
        canvas.getContext('2d').drawImage(sourceImage, 0, 0);
        // apply filters
        if (filters !== undefined) {
            // parse parameters
            let contoursOnly = filters['checkBlankBack'];

            // init images
            let originalImage = cv.imread(canvas);
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
            cv.imshow(canvas, contoursOnly ? contoursImage : originalImage);

            // resolve
            resolve([contours, hierarchy])
            // delete images
            originalImage.delete();
            filteredImage.delete();
            contoursImage.delete();
        } else {
            reject();
        }
    })
}

function fillContour(canvas, sourceImage, contour) {
    let context = canvas.getContext('2d');
    let pattern = context.createPattern(sourceImage, 'repeat');
    context.save();
    context.beginPath();
    context.fillStyle = pattern;

    context.moveTo(contour.data32S[0], contour.data32S[1]);
    for (let i = 2; i < contour.data32S.length; i += 2) {
        context.lineTo(contour.data32S[i], contour.data32S[i + 1])
    }

    context.closePath();
    context.fill();
    context.restore();
}
