package utils;

import haxe.io.Input;
import format.tmx.Data;

class BinaryTmxReader
{
  
  private static inline function readString(i:Input):String
  {
    return i.readUntil(0);
  }
  
  private static inline function alignData(i:Input):Void
  {
    // TODO: Alignment
  }
  
  private static function readProperties(i:Input):Map<String, String>
  {
    var map:Map<String, String> = new Map();
    var count:Int = i.readInt32();
    if (count > 0)
    {
      while (count-- > 0)
      {
        map.set(readString(i), readString(i));
      }
      alignData(i);
    }
    return map;
  }
  
  private static function readImage(i:Input):TmxImage
  {
    var source:String = readString(i);
    alignData(i);
    return {
      source: source,
      width: i.readInt32(),
      height: i.readInt32(),
      data: i.readInt32() == 0 ? null : readData(i)
    };
  }
  
  private static function readData(i:Input):TmxData
  {
    return null;
  }
  
  private static function readTilesets(i:Input):Array<TmxTileset>
  {
    var count:Int = i.readInt32();
    var arr:Array<TmxTileset> = new Array();
    while (count-- > 0)
    {
      var gid:Int = i.readInt32();
      var isTSX:Bool = i.readByte() == 1;
      if (isTSX)
      {
        arr.push({
          firstGID: gid,
          source: readString(i)
        });
        alignData(i);
      }
      else
      {
        var name:String = readString(i);
        alignData(i);
        arr.push({
          tileWidth: i.readInt32(),
          tileHeight: i.readInt32(),
          spacing: i.readInt32(),
          margin: i.readInt32(),
          tileCount: i.readInt32(),
          columns: i.readInt32(),
          tileOffset: { x:i.readInt32(), y:i.readInt32() },
          properties: readProperties(i),
          image: readImage(i),
          terrainTypes: new Array<TmxTerrain>(),
          tiles: new Array<TmxTilesetTile>()
        });
      }
    }
    return arr;
  }
  
  private static function readBaseLayer(i:Input):TmxBaseLayer
  {
    var name:String = readString(i);
    alignData(i);
    
    return {
      name: name,
      opacity: i.readFloat(),
      visible: i.readInt32() == 1,
      offsetX: i.readInt32(),
      offsetY: i.readInt32(),
      properties: readProperties(i)
    };
  }
  
  private static function readLayers(i:Input):Array<TmxLayer>
  {
    var count:Int = i.readInt32();
    var arr:Array<TmxLayer> = new Array();
    while (count-- > 0)
    {
      var layerType:Int = i.readInt32();
      switch(layerType)
      {
        case 0:
          var layer:TmxTileLayer = cast readBaseLayer(i);
          arr.push(TmxLayer.TileLayer(layer));
          
          layer.data = { tiles:new Array<TmxTile>() };
          var tiles:Array<TmxTile> = layer.data.tiles;
          
          var count:Int = i.readInt32();
          while (count-- > 0)
          {
            tiles.push({ gid:i.readInt32() });
          }
        case 1:
          var layer:TmxObjectGroup = cast readBaseLayer(i);
          arr.push(TmxLayer.ObjectGroup(layer));
          
          var objects:Array<TmxObject> = layer.objects = new Array();
          
          var count:Int = i.readInt32();
          while (count-- > 0)
          {
            var id:Int = i.readInt32();
            var name:String = readString(i);
            var type:String = readString(i);
            
            alignData(i);
            var x:Float = i.readFloat();
            var y:Float = i.readFloat();
            var objType:TmxObjectType;
            switch (i.readInt32())
            {
              case 1: objType = TmxObjectType.Tile(i.readInt32());
              default: objType = TmxObjectType.Rectangle;
            }
            var props:Map<String, String> = readProperties(i);
            var flipH:Bool = i.readInt16() == 1;
            var flipV:Bool = i.readInt16() == 1;
            objects.push({
              id: id,
              name:name,
              type: type,
              x: x,
              y: y,
              objectType: objType,
              properties: props,
              flippedHorizontally: flipH,
              flippedVertically: flipV
            });
          }
        default: // Ignore
      }
    }
    return arr;
  }
  
  public static function run(i:Input):TmxMap
  {
    i.readInt32(); // Version = 1;
    return
    {
      version: "1.0", // This one is static by some reason.
      orientation: TmxOrientation.createByIndex(i.readByte()),
      renderOrder: TmxRenderOrder.createByIndex(i.readByte()),
      
      width: i.readInt32(),
      height: i.readInt32(),
      tileWidth: i.readInt32(),
      tileHeight: i.readInt32(),
      
      hexSideLength: i.readInt32(),
      staggerAxis: TmxStaggerAxis.createByIndex(i.readByte()),
      staggerIndex: TmxStaggerIndex.createByIndex(i.readByte()),
      
      backgroundColor: i.readInt32(),
      nextObjectId: i.readInt32(),
      
      properties: readProperties(i),
      
      tilesets: readTilesets(i),
      
      layers: readLayers(i)
    };
  }
}