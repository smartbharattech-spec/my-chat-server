export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });

export function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width, height, rotation) {
    const rotRad = getRadianAngle(rotation);

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

/**
 * @param {HTMLImageElement|string} image - Image File url or HTMLImageElement
 * @param {Object} pixelCrop - pixelCrop Object { x, y, width, height }
 * @param {number} rotation - optional rotation parameter
 */
export default async function getCroppedImg(
    image,
    pixelCrop,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
) {
    let loadedImage = image;
    if (typeof image === 'string') {
        loadedImage = await createImage(image);
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return null;
    }

    const rotRad = getRadianAngle(rotation);

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        loadedImage.naturalWidth || loadedImage.width,
        loadedImage.naturalHeight || loadedImage.height,
        rotation
    );

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-(loadedImage.naturalWidth || loadedImage.width) / 2, -(loadedImage.naturalHeight || loadedImage.height) / 2);

    // draw rotated image
    ctx.drawImage(loadedImage, 0, 0);

    // SCALING LOGIC:
    // We must scale the 'pixelCrop' (which is relative to the visual/rendered size of the image)
    // to the 'natural' size of the image which is what is drawn on the canvas.
    const scaleX = (loadedImage.naturalWidth || loadedImage.width) / loadedImage.width;
    const scaleY = (loadedImage.naturalHeight || loadedImage.height) / loadedImage.height;

    const scaledX = pixelCrop.x * scaleX;
    const scaledY = pixelCrop.y * scaleY;
    const scaledWidth = pixelCrop.width * scaleX;
    const scaledHeight = pixelCrop.height * scaleY;

    // croppedAreaPixels values are bounding box relative
    // extract the cropped image using these values
    const data = ctx.getImageData(
        scaledX,
        scaledY,
        scaledWidth,
        scaledHeight
    );

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    // paste generated rotate image at the top left corner
    ctx.putImageData(data, 0, 0);

    // As a blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((file) => {
            if (file) {
                resolve(file);
            } else {
                reject(new Error("Canvas is empty"));
            }
        }, "image/jpeg");
    });
}
