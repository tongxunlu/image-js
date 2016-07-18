import DisjointSet from 'ml-disjoint-set';

import ROIMap from './../ROIMap';

const direction4X = [-1,  0];
const direction4Y = [ 0, -1];
const neighbours4 = [null, null];

const direction8X = [-1, -1,  0,  1];
const direction8Y = [ 0, -1, -1, -1];
const neighbours8 = [null, null, null, null];

/*
Implementation of the connected-component labeling algorithm
 */
export default function createROIMapFromMask2(mask, {
    neighbours = 8
} = {}) {

    let directionX;
    let directionY;
    let neighboursList;
    if (neighbours === 8) {
        directionX = direction8X;
        directionY = direction8Y;
        neighboursList = neighbours8;
    } else if (neighbours === 4) {
        directionX = direction4X;
        directionY = direction4Y;
        neighboursList = neighbours4;
    } else {
        throw new RangeError('unsupported neighbours count: ' + neighbours);
    }

    const size = mask.size;
    const width = mask.width;
    const height = mask.height;
    const labels = new Array(size);
    const linked = new DisjointSet();

    let currentLabel = 1;
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            // true means out of background
            const index = i + j * width;
            if (mask.getBit(index)) {
                let smallestNeighbor;
                for (let k = 0; k < neighboursList.length; k++) {
                    let ii = i + directionX[k];
                    let jj = j + directionY[k];
                    if (ii >= 0 && jj >= 0 && ii < width && jj < height) {
                        let index = ii + jj * width;
                        let neighbor = mask.getBit(index);
                        if (!neighbor) {
                            neighboursList[k] = null;
                        } else {
                            neighboursList[k] = labels[index];
                            if (!smallestNeighbor || neighboursList[k].value < smallestNeighbor.value) {
                                smallestNeighbor = neighboursList[k];
                            }
                        }
                    }
                }
                if (!smallestNeighbor) {
                    labels[index] = linked.add(currentLabel++);
                } else {
                    labels[index] = smallestNeighbor;
                    for (let k = 0; k < neighboursList.length; k++) {
                        if (neighboursList[k] && neighboursList[k] !== smallestNeighbor) {
                            linked.union(smallestNeighbor, neighboursList[k]);
                        }
                    }
                }
            }
        }
    }

    const pixels = new Int16Array(size);
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            const index = i + j * width;
            if (mask.getBit(index)) {
                pixels[index] = linked.find(labels[index]).value;
            }
        }
    }

    return new ROIMap(mask, pixels, 0, currentLabel);

}