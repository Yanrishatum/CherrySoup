package;

import format.tmx.Reader;
import format.tmx.Tools;
import format.tmx.Data;
import sys.FileSystem;
import sys.io.File;
import haxe.io.Path;
import sys.io.FileOutput;

class BinaryTmx
{
  
  private static var outputPath:String;
  
  public static function main():Void
  {
    var args:Array<String> = Sys.args();
    if (args.indexOf("-o") != -1)
    {
      var idx:Int = args.indexOf("-o");
      var data:Array<String> = args.splice(idx, 2);
      outputPath = data[1];
    }
    
    if (args.length < 1)
    {
      Sys.println("Please, specify the input path.");
    }
    
    if (outputPath == null) outputPath = ".";
    for (source in args)
    {
      trace(source);
      if (FileSystem.isDirectory(source))
      {
        processDirectory(source, ".");
      }
      else if (Path.extension(source).toLowerCase() == "tmx")
      {
        processTmx(source, ".");
      }
    }
  }
  
  private static function processDirectory(path:String, localPath:String):Void
  {
    var dir:Array<String> = FileSystem.readDirectory(path);
    for (file in dir)
    {
      var newPath:String = Path.join([path, file]);
      var newLoc:String = Path.join([localPath, file]);
      if (FileSystem.isDirectory(newPath)) processDirectory(newPath, newLoc);
      else if (Path.extension(file).toLowerCase() == "tmx")
      {
        processTmx(newPath, newLoc);
      }
    }
  }
  
  private static function processTmx(path:String, localPath:String):Void
  {
    var tmx:TmxMap = new Reader(Xml.parse(File.getContent(path))).read();
    var outpath:String = Path.join([outputPath, localPath]);
    if (!FileSystem.exists(Path.directory(outpath))) FileSystem.createDirectory(Path.directory(outpath));
    
    var output:FileOutput = File.write(Path.withoutExtension(outpath) + ".tmb");
    
    inline function writeInt(value:Null<Int>, def:Int):Void
    {
      if (value == null) output.writeInt32(def);
      else output.writeInt32(value);
    }
    
    inline function writeEnum(value:EnumValue, def:Int):Void
    {
      
      if (value == null) output.writeByte(def);
      else output.writeByte(value.getIndex());
    }
    
    inline function writeFloat(value:Null<Float>, def:Float):Void
    {
      if (value == null) output.writeFloat(def);
      else output.writeFloat(value);
    }
    
    // Null-terminated strings
    inline function writeString(value:String):Void
    {
      if(value != null)
        output.writeString(value);
      output.writeByte(0);
    }
    
    inline function alignData():Void
    {
      // var skipSize:Int = 4 - (output.tell() % 4);
      // if (skipSize != 4)
      // {
      //   while(skipSize-- > 0) output.writeByte(0);
      // }
    }
    
    inline function writeProperties(props:Map<String, String>):Void
    {
      if (props == null) output.writeInt32(0);
      else
      {
        var count:Int = Lambda.count(props);
        
        output.writeInt32(count);
        for (key in props.keys())
        {
          writeString(key);
          writeString(props[key]);
          count--;
        }
        alignData();
      }
    }
    
    inline function writeData(data:TmxData):Void
    {
      
    }
    
    inline function writeImage(image:TmxImage):Void
    {
      writeString(image.source);
      alignData();
      // TODO: transparent
      // TODO: format
      writeInt(image.width, 0);
      writeInt(image.height, 0);
      // TODO: width/height null-safety
      if (image.data == null) output.writeInt32(0);
      else
      {
        output.writeInt32(1);
        writeData(image.data);
      }
    }
    
    // <map>
    output.writeInt32(1); // Version
    output.writeByte(tmx.orientation.getIndex());
    writeEnum(tmx.renderOrder, RightDown.getIndex());
    
    output.writeInt32(tmx.width);
    output.writeInt32(tmx.height);
    output.writeInt32(tmx.tileWidth);
    output.writeInt32(tmx.tileHeight);
    
    writeInt(tmx.hexSideLength, 0);
    writeEnum(tmx.staggerAxis, 0);
    writeEnum(tmx.staggerIndex, 0);
    
    writeInt(tmx.backgroundColor, 0);
    writeInt(tmx.nextObjectId, 0);
    
    // -> <properties>
    writeProperties(tmx.properties);
    
    // -> <tileset>
    output.writeInt32(tmx.tilesets.length);
    
    for (tset in tmx.tilesets)
    {
      writeInt(tset.firstGID, 1);
      if (tset.source != null)
      {
        output.writeByte(1);
        writeString(tset.source);
        alignData();
      }
      else
      {
        output.writeByte(0);
        writeString(tset.name);
        alignData();
        writeInt(tset.tileWidth, tmx.tileWidth);
        writeInt(tset.tileHeight, tmx.tileHeight);
        writeInt(tset.spacing, 0);
        writeInt(tset.margin, 0);
        output.writeInt32(tset.tileCount);
        output.writeInt32(tset.columns);
        if (tset.tileOffset == null)
        {
          output.writeInt32(0);
          output.writeInt32(0);
        }
        else
        {
          output.writeInt32(tset.tileOffset.x);
          output.writeInt32(tset.tileOffset.y);
        }
        
        writeProperties(tset.properties);
        
        writeImage(tset.image);
      }
    }
    
    // <layer>
    output.writeInt32(tmx.layers.length);
    
    inline function writeBaseLayer(l:TmxBaseLayer)
    {
      writeString(l.name);
      alignData();
      writeFloat(l.opacity, 1);
      output.writeInt32(l.visible ? 1 : 0);
      writeInt(l.offsetX, 0);
      writeInt(l.offsetY, 0);
      writeProperties(l.properties);
    }
    
    for (layer in tmx.layers)
    {
      switch (layer)
      {
        case TmxLayer.ImageLayer(ilayer):
          // TODO: ImageLayer
          output.writeInt32(2);
        case TmxLayer.ObjectGroup(group):
          output.writeInt32(1);
          writeBaseLayer(group);
          // TODO: color
          // TODO: drawOrder
          output.writeInt32(group.objects.length);
          for (obj in group.objects)
          {
            output.writeInt32(obj.id);
            writeString(obj.name);
            writeString(obj.type);
            alignData();
            output.writeFloat(obj.x);
            output.writeFloat(obj.y);
            // visible
            // rotation
            // width/height
            switch (obj.objectType)
            {
              case TmxObjectType.Tile(gid):
                output.writeInt32(1);
                output.writeInt32(gid);
              default: output.writeInt32(0); // Ignore
            }
            writeProperties(obj.properties);
            output.writeInt16(obj.flippedHorizontally ? 1 : 0);
            output.writeInt16(obj.flippedVertically ? 1 : 0);
          }
        case TmxLayer.TileLayer(tlayer):
          // Schema:
          //  LayerID:Int32
          //  BaseLayer
          //  TileCount:Int32
          //    Tile:Int32
          output.writeInt32(0);
          writeBaseLayer(tlayer);
          output.writeInt32(tlayer.data.tiles.length);
          for (tile in tlayer.data.tiles)
          {
            output.writeInt32(tile.gid);
          }
      }
    }
  }
  
}