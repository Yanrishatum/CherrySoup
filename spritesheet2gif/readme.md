# Spritesheet to Gif
Well, it's fairly simple. Input PNG with spritesheet, output animated gif.

## Usage
1. Run app
2. Select input spritesheet PNG
3. Set parameters
4. Select output GIF path.

## Restrictions
* Spritesheet should be in PNG format.
* Spritesheet should not contain more than 256 colors. Including transparency.
*  No gaps.

## Building from source

1. Requires:  
`format` with `format.gif.Writer` (as of time writing this haxelib version does not contains gif Writer)  
`linc_dialogs` - find it [here](https://github.com/snowkit/linc_dialogs).
2. Just run `neko.hxml` or `cpp.hxml` to produce executables.