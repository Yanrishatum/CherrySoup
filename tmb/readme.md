# TMB
Simple converter from .TMX tiled format to .TMB files.  
TMB states for Tile Map Binary.

## Usage
### Resource preparation
`neko BinaryTmx.n [-o outputFolder] <inputs>`  
For example:  
`neko BinaryTmx.n -o processed maps intros` will process all .tmx files in `maps` and `intros` folders and will put them into `processed` folder.
### Parsing
1. Copy `BinaryTmxReader.hx` to your project (change package if need).
2. `var map:TmxMap = BinaryTmxReader.run(inputWithTmb);`

## Compilation from source
1. Requires [`format-tiled`](https://github.com/yanrishatum/haxe-format-tiled) and [`format`](https://github.com/haxefoundation/format) libraries.
2. Just compile via `build.hxml`.

## State
* Very dirty and incomplete implementation, probably won't work with your case.
* No data alignment, therefore not usable on ARM architectures. (or any other that really dislike Floats being unaligned)

## Schema
All enums are stored as single-byte unless stated otherwise. `Unknown(value:String)` enums aren't supported.  
All `String` values are null-terminated unless stated otherwise.

### V1 schema
```haxe
// Base Structure
tmb.version:Int32; // Version of TMB file.
TmxMap.orientation:Byte;
TmxMap.renderOrder:Byte;

TmxMap.width:Int32;
TmxMap.height:Int32;
TmxMap.tileWidth:Int32;
TmxMap.tileHeight:Int32;

TmxMap.hexSideLength:Int32;
TmxMap.staggerAxis:Byte;
TmxMap.staggerIndex:Byte;

TmxMap.backgroundColor:Int32;
TmxMap.nextObjectId:Int32;

TmxMap.properties:Properties;
TmxMap.tilesets:TilesetArray;
TmxMap.layers:LayerArray;

// Properties
count:Int32;
[count times]:
  key:String;
  value:String;

// Image
TmxImage.source:String;
TmxImage.width:Int32;
TmxImage.height:Int32;
hasData:Int32;
[hasData == 1]
  // Nothing (yet) :D

// TilesetArray
count:Int32;
[count times]:
  TmxTileset.firstGID:Int32;
  isTSX:Byte;
  [isTSX == 1]:
    TmxTileset.source:String;
  [isTSX == 0]:
    TmxTileset.name:String;
    
    TmxTileset.tileWidth:Int32;
    TmxTileset.tileHeight:Int32;
    
    TmxTileset.spacing:Int32;
    TmxTileset.margin:Int32;
    TmxTileset.tileCount:Int32;
    TmxTileset.columns:Int32;
    
    TmxTileset.tileOffset.x:Int32;
    TmxTileset.tileOffset.y:Int32;
    
    TmxTileset.properties:Properties;
    
    TmxTileset.image:Image;

// LayerArray
count:Int32;
[count times]:
  layerType:Int32;
  [layerType == 0]:
    [BaseLayerData];
    tileCount:Int32;
    [tileCount times]:
      TmxTileLayer.data.tiles[i].gid:Int32;
  [layerType == 1]:
    [BaseLayerData];
    objectCount:Int32;
    [objectCount times]:
      TmxObject.id:Int32;
      
      TmxObject.name:String;
      TmxObject.type:String;
      
      TmxObject.x:Float;
      TmxObject.y:Float;
      
      objectType:Int32;
      [objectType == 0]:
        TmxObject.objectType = TmxObjectType.Rectangle;
        // No other types atm, so if it's not tile - it's rectangle.
      [objectType == 1]:
        gid:Int32;
        TmxObject.objectType = TmxObjectType.Tile(gid);
      
      TmxObject.properties:Properties;
      TmxObject.flippedHorizontally:Int16;
      TmxObject.flippedVertically:Int16;
      
  [layerType == 2]:
    // There should be ImageLayer, but it's not used in my project so not implemented.
```