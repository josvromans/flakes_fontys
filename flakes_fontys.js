// Copyright Jos Vromans (www.josvromans.com)

// ?seed=963326957
// ?seed=243830153

// Setup the canvas, W/H are width and height, to be used in the code, and width can be set by url param
const W = parseInt(new URLSearchParams(window.location.search).get('width') || 900*4);
RATIO=1.5126;
C.width=W;
C.height=H=W/RATIO|0;

// the scale will depend on the longest or shortest side, depending how it fits the current window
WW=window.innerWidth;
WH=window.innerHeight;
SCALE = WW/WH>RATIO?WH/H:WW/W;
C.style.width=`${W*SCALE}px`;
C.style.height=`${H*SCALE}px`;
C.style.margin='auto';

X=C.getContext('2d');
BG_COLOR = '#ddd';
X.lineJoin='round';

// these are values that define the artwork, but they will be set later
let TRIGS, HUES, DEPTH, MAX_SUBLINES, SUBLINES, EXIT_VALUE, DARKMODE, SEED, S, R;

// Pre - select palettes, these values are the hues, to be used in an HSL color string
PALETTES = [
    [96,162,5],
    [218,355,70],
    [159,256,31],
    [59,358,194],
    [18,48,59,170,134],
    [43,155,148,32,357,173],
]

// these values are based on the canvas width/height W/H, and will be used to determine the start triangles.
// You can visualize these when drawing a rectangle with point A (0,0) at top left, and point D (W,0) on top right
let CENTER = [W/2,H/2];
let w3 = W/3;
let h3= H/3;
let pA = [0,0];
let pB = [w3,0];
let pC = [w3*2,0];
let pD = [W,0];
let pE = [W,h3];
let pF = [W,H];
let pG = [w3*2,H];
let pH = [w3,H];
let pI = [0,H];
let pJ = [0,h3*2];

// parameters that can only be set by url parameters

// note that any string value converts to true. So when specifying false, don't add the parameter at all, or use the number 0.
const DRAW_SMALL_FACES = Boolean(new URLSearchParams(window.location.search).get('draw-small-faces') || false);
const IMAGE_EXTENSION = new URLSearchParams(window.location.search).get('image-extension') || 'jpeg';

//
// Helper methods
//
function hslToStr(h,s,l,a=1){return 'hsl(' + h + ',' + s + '%,' + l + '%,' + a + ')'}
function getMidpoint(a,b){return [(a[0] + b[0])/2,(a[1] + b[1])/2]}

function drawLine(a, b){
    X.beginPath();
    X.moveTo(...a);
    X.lineTo(...b);
    X.stroke();
}
function getPointOnLine(a,b,perc){  // relative to a !!, 0.10 is 10% between a and b
    let diffX = perc * (b[0] - a[0]);
    let diffY = perc * (b[1] - a[1]);
    return [diffX,diffY];
}
function randomInTriangle(a,b,c){
    let perc1 = 0.2+R()*.6;

    let maxrange = 1-perc1;
    let perc2 = R() * maxrange * .8 + maxrange*.1;

    let P1 = getPointOnLine(a,b,perc1)
    let P2 = getPointOnLine(a,c,perc2)

    return [a[0]+P1[0]+P2[0],a[1]+P1[1]+P2[1]];
}

// Function to convert an angle in radians to the range [0, 2π)
function normalizeAngle(radians){
    while (radians < 0) {
        radians += 2 * Math.PI;
    }
    while (radians >= 2 * Math.PI) {
        radians -= 2 * Math.PI;
    }
    return radians;
}
// Function to assign a clock direction to a vector (angle in radians)
function assignClockDirection(vector){
    // calculate the angle in radians of a vector with respect to the positive x-axis
    let angle = Math.atan2(vector[1], vector[0]);
    return normalizeAngle(angle);
}

class Triangle {
    constructor(a,b,center, hue){
        // IMPORTANT: designed so that the last coordinate is the center
        this.a=a;
        this.b=b;
        this.center=center;
        this.hue=hue;
        this.ab = getMidpoint(a,b);
    }
    calculateShading() {
        /*
        To create a 'depth effect', determine the shading needed on a triangle face.
        Calculate a 'light direction' based on a vector from the midpoint (of the triangle),
        to the midpoint of vertices A & B
        Calculate the angle of that vector, compared to the x axis.
        This results in an angle between 0 and 2pi (When going round the clock).

        Convert it to a lightness value (in range 0-100)
        */

        // this direction is between 0 and 2*PI
        let direction = assignClockDirection([
            this.center[0] - this.ab[0],
            this.center[1] - this.ab[1]
        ]);
        // determine 'the distance from halfway around the clock',
        let angle = Math.abs(3.1415 - direction)

        // The l value in the HSL color represents lightness, 0=black, 100=white
        // since angle is between 0 and PI, convert it
        let lValue  = angle / 3.14159 * 100  // now it is between 0 and 100
        lValue *=.68;
        lValue += 2;  // now it is between 2 and 70.

        return lValue;
    }

    draw() {
        // return lValue;  //Math.random()*80 + 10
        let lValue = this.calculateShading();
        let vertices = [this.a, this.b, this.center]
        // Use the vertex indices, and get the according vertices from SCALED_VERTICES
        X.fillStyle = hslToStr(this.hue, DARKMODE?0:80, lValue);
        X.beginPath();
        X.moveTo(...this.a);
        X.lineTo(...this.b);
        X.lineTo(...this.center);
        X.closePath();
        X.fill();
        X.lineWidth=W/2000;
        X.stroke();

        // by default, draw the texture on each face. However, this can be set to false in case the
        // check for triangle area is done
        let drawTexture = true;

        if (!DRAW_SMALL_FACES){
            // this calculation can be skipped if we specifically specify to draw it all
            let triangleArea=Math.abs((
                this.a[0]*(this.b[1]-this.center[1])+
                this.b[0]*(this.center[1]-this.a[1])+
                this.center[0]*(this.a[1]-this.b[1])
            )/2);

            // do not draw the texture on triangle faces for very small triangles:
            // this saves a lot of render time. This can be approximated with less calculations
            // by using the triangle's bounding box, or simply look at the max(sidelength) being
            // under a certain threshold.
            drawTexture = triangleArea > W*H/2000;
        }
        if (drawTexture){
            X.lineWidth=W/4000;
            // stroke lines will get the same hue as the fill color, but made darker (lightness value minus 30, which is close to black)
            X.strokeStyle = hslToStr(this.hue, DARKMODE?0:80, lValue-30)
            X.globalAlpha=.6;  // makes the lines a bit softer
            drawSubLines(...vertices);
            X.globalAlpha=1;
            X.strokeStyle='#000'
        }
    }
}
function subdivide(a,b,c,depth=0){
    let center = randomInTriangle(a,b,c)

    if (depth>DEPTH || R()<EXIT_VALUE){
        // this is the last iteration to be calculated. Draw it. And return afterwards
        let hue = HUES[R()*HUES.length|0];
        TRIGS.push(new Triangle(b,c,center,hue));
        TRIGS.push(new Triangle(a,b,center,hue));
        TRIGS.push(new Triangle(c,a,center,hue));
        return
    }
    subdivide(center, a,b, depth+1)
    subdivide(center, b,c, depth+1)
    subdivide(center, c,a, depth+1)
}

// recursively draw division lines
function drawSubLines(a,b,c, iter=0){
    let inside = randomInTriangle(a,b,c);

    drawLine(a, inside)
    drawLine(b, inside)
    drawLine(c, inside)

    if (iter<MAX_SUBLINES){
        drawSubLines(a,b,inside,iter+1);
        drawSubLines(b,c,inside,iter+1);
        drawSubLines(c,a,inside,iter+1);
    }
}

function setParameters(){
    // each time when an artwork is created (after clicking on the canvas),
    // determine the parameters to use, using global variables
    // Also print the random seed to the console, so that a specific variation can be redrawn

    //  This artwork is defined by a seed, if one is provided by the url, that one will be used. Example '?seed=556432184'
    // If it is not present, a 'random' seed will be generated using the built-in random method
    SEED = new URLSearchParams(window.location.search).get('seed') || Math.random()*99999999999|0;
    console.log(`?seed=${SEED}`);
    // Add the above line to the url to re create this exact artwork.

    // PRNG (pseudo random number generator), seeded with above seed, meaning that the entire
    // artwork can be determined by the seed, it should be completely deterministic for reproducibility.
    S=Uint32Array.of(9,7,5,3);
    R=_=>(a=S[3],S[3]=S[2],S[2]=S[1],a^=a<<11,S[0]^=a^a>>>8^(S[1]=S[0])>>>19,S[0]/2**32);
    [...SEED.toString()].map(c=>R(S[0]^=c.charCodeAt()*S[3]));

    // Two 'center points', the focus points, left and right from canvas center
    C1 = [W/4,H/3*(R()+1.5)];
    C2 = [W/4*(2+R()),H/3*(R()+.5)];
    M = [W/2, H/2];
    M[1] += R()*H/8;  // add an offset to the center point

    MAX_SUBLINES=4;
    DEPTH=1 + R()*2|0;
    PALETTE_INDEX = R()*PALETTES.length|0;

    LAYOUT = R()*2|0;
    if (R()<.1){DARKMODE=true}else{DARKMODE=false}
    if (LAYOUT===0){
        EXIT_VALUE = R()*.1+0.2;
        START_TRIANGLES = [
            [pA,pB,C1],[pB, M,C1],[pB, M,C2],[pB, pC,C2],[pD, pC,C2],[C2, pE,pD],[C2, pE,pF],
            [C2, pG,pF],[C2, pG,M],[C1, pG,M],[C1, pG,pH],[C1, pI,pH],[C1, pI,pJ],[C1, pA,pJ],
        ];
    } else {
        EXIT_VALUE = [-1, .01][R()*2|0];
        DEPTH=1 + R()*4|0;
        START_TRIANGLES = [
            [pA,pD,CENTER],
            [pD,pF,CENTER],
            [pF,pI,CENTER],
            [pI,pA,CENTER],
        ]
    }
    if (R()<.1){DEPTH=6}
    if (DEPTH<4&R()<.5){MAX_SUBLINES=6}
}

function drawArtWork(){
    // (re) draw the background
    X.fillStyle=BG_COLOR;
    X.fillRect(0,0,W,H);

    setParameters();

    HUES = PALETTES[PALETTE_INDEX];
    TRIGS = [];  // reset the TRIGS

    START_TRIANGLES.forEach(t=>subdivide(t[0], t[1], t[2]))
    TRIGS.forEach(t=>t.draw())
}

drawArtWork();

//
// Save image functionality
//
function saveImage(){
    let file_name = 'Flakes_Fontys_' + SEED;
    link.setAttribute('download', file_name);
    link.setAttribute('href', C.toDataURL(`image/${IMAGE_EXTENSION}`));
    link.click();
    console.log(`Saved ${file_name}.${IMAGE_EXTENSION}`);
}
window.addEventListener('DOMContentLoaded', (event) => {
  document.onkeydown = (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveImage();
    }
  }
  C.addEventListener('click',e=>drawArtWork());
});
