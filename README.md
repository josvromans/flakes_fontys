# flakes_fontys
A digital artwork that subdivides the canvas into triangles.
A new artwork will be generated on every click, as you can try out on this web page:

[https://josvromans.github.io/flakes_fontys/index.html](https://josvromans.github.io/flakes_fontys/index.html)

ctrl+s  saves the image. The seed that is used for the current artwork will be saved in the image name.
The default extension is jpeg, and the default image width will be 3600 pixels. These values can be set by url parameters below.

## URL parameters ##

There are four options you can set in the url parameters: `width`, `seed`, `image-extension` and `draw-small-faces`

- `width`
for example: `?width=1200` will set the width to 1200 and the height will be calculated with a predefined aspect. ratio.

- `seed`
will set the seed for the PRNG (pseudo random number generator), so a specific variation can be re rendered. When the seed is not present in the url parameter, a random seed will be generated on every click, and it will be logged in the console (browser developer tools). So this means when generating random variations, you can read the value from the console if you like. Or you can simply save the image, and the seed will be included in the filename.

- `image-extension`
The default is 'jpeg', but you can add `?image-extension=png` for PNG files.

- `draw-small-faces`
By default the smallest triangle faces will not be filled with the texture. This is done to save computing time, as it is not efficient to spend much drawing time on every single tiny triangle. However, you can allow this with `?draw-small-faces=true` which might be interesting for a specific variation you like. So then you can compare how it looks with more detail in the smallest triangles.

For example, the following url will always draw the same subdivision, because it has a certain seed predefined. The image width is set to 1600 pixels, and when saving the image, a PNG file will be saved.
- [https://josvromans.github.io/flakes_fontys/index.html?image-extension=png&width=1600&seed=963326957](https://josvromans.github.io/flakes_fontys/index.html?image-extension=png&width=1600&seed=963326957)
