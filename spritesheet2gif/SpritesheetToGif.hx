package;

#if neko
import neko.Lib;
#elseif cpp
import cpp.Lib;
#end
import dialogs.Dialogs;
import format.gif.Writer;
import format.png.Data as PngData;
import format.png.Data.Header;
import format.png.Tools as PngTools;
import format.gif.Data;
import haxe.io.Bytes;
import haxe.io.Path;
import sys.FileSystem;
import sys.io.File;
import sys.io.FileInput;
import sys.io.FileOutput;
#if (hxcpp && static_std)
import hxcpp.StaticStd;
import hxcpp.StaticZlib;
import hxcpp.StaticRegexp;
#end

/**
 * ...
 * @author Yanrishatum
 */
class SpritesheetToGif 
{
	
	static function main() 
	{
    var args:Array<String> = Sys.args();
    var input:String = null;
    var output:String = null;
    
    if (args.length != 0)
    {
      input = args[0];
      if (args.length > 1) output = args[1];
    }
    
    if (input == null) input = Dialogs.open("Load spritesheet", [ { ext:"png", desc:"png images" } ], true); // TODO: Gif
    if (input == null) return;
    if (Path.extension(input).toLowerCase() == "png") processPNG(input, output);
    else
    {
      Sys.println("Critical error: Unknown image format. Supported: png");
    }
	}
  
  private static function processPNG(path:String, output:String):Void
  {
    var fr:FileInput = File.read(path);
    var png:PngData = new format.png.Reader(fr).read();
    fr.close();
    var header:Header = PngTools.getHeader(png);
    var pixels:Bytes = PngTools.extract32(png);
    processPixels(header.width, header.height, pixels, output);
  }
  
  private static function processPixels(width:Int, height:Int, pixels:Bytes, output:String):Void
  {
    Sys.println("Image size: " + width + " x " + height);
    var useFrames:Bool = readChar("Want to set frame count [1] or frame size [2]? ", ["2".code], "Frame size", ["1".code], "Frame count");
    
    var frameWidth:Int = width;
    var frameHeight:Int = height;
    
    if (useFrames)
    {
      var vertical:Bool = readChar("Spritesheet vertical (up-to-down) [V] or horizontal (left-to-right) [H]? ", ["h".code, "H".code], "Horizontal", ["v".code, "V".code], "Vertical");
      
      var frameCount:Int = Std.parseInt(readLine("Amount of frames: "));
      if (vertical)
      {
        frameHeight = Std.int(height / frameCount);
      }
      else
      {
        frameWidth = Std.int(width / frameCount);
      }
    }
    else
    {
      frameWidth = Std.parseInt(readLine("Frame width: "));
      frameHeight = Std.parseInt(readLine("Frame height: "));
    }
    Sys.println("Frame size: " + frameWidth + " x " + frameHeight);
    
    inline function secondsToCentiseconds(val:Float):Int
    {
      return Math.round(val * 100);
    }
    var askDelay:Bool = readChar("Want to write delay for each frame? [Y/N] ", ["n".code, "N".code], "No", ["y".code, "Y".code], "Yes");
    var defaultDelay:Int = 10;
    if (!askDelay)
    {
      var val:String = readLine("Specify delay between frames (default = 0.1s): ");
      if (val != "" && !Math.isNaN(Std.parseFloat(val)))
      {
        defaultDelay = secondsToCentiseconds(Std.parseFloat(val));
      }
    }
    
    Sys.println("Stand back, extraction in process.");
    
    // Get palette
    var palette:Array<Int> = new Array();
    var indexedPixels:Bytes = Bytes.alloc(width * height);
    palette.push(0);
    var i:Int = 0, j:Int = 0;
    while (i < pixels.length)
    {
      var color:Int = pixels.getInt32(i);
      if (((color & 0xff000000) >>> 24) != 0xff) color = 0;
      var idx:Int = palette.indexOf(color);
      if (idx == -1) idx = palette.push(color);
      
      indexedPixels.set(j++, idx);
      i += 4;
    }
    
    if (palette.length > 255)
    {
      Sys.println("Critical error: Palette size exceeded limit of 256 colors");
      return;
    }
    
    var palSize:Int = 256;
    if (palette.length <= 4) palSize = 4;
    else if (palette.length <= 8) palSize = 8;
    else if (palette.length <= 16) palSize = 16;
    else if (palette.length <= 32) palSize = 32;
    else if (palette.length <= 64) palSize = 64;
    else if (palette.length <= 128) palSize = 128;
    //else if (palette.length <= 256) palSize = 256;
    Sys.println("Colors: " + palette.length + "; Physical size: " + palSize);
    
    var paletteBytes:Bytes = Bytes.alloc(palSize * 3);
    i = 0;
    j = 0;
    
    while (i < palette.length)
    {
      var color:Int = palette[i];
      paletteBytes.set(j, (color & 0xff0000) >> 16); // R
      paletteBytes.set(j + 1, (color & 0xff00) >> 8); // G
      paletteBytes.set(j + 2, color & 0xff); // B
      i++;
      j += 3;
    }
    
    var gif:Data =
    {
      version:Version.GIF89a,
      logicalScreenDescriptor:
      {
        width: frameWidth,
        height: frameHeight,
        hasGlobalColorTable: true,
        colorResolution: 0,
        sorted: false,
        globalColorTableSize: palSize,
        backgroundColorIndex: 0,
        pixelAspectRatio: 1
      },
      globalColorTable:paletteBytes,
      blocks: new List<Block>()
    }
    
    var x:Int = 0;
    var y:Int = 0;
    inline function canCut():Bool
    {
      return (x + frameWidth <= width && y + frameHeight <= height);
    }
    
    gif.blocks.add(Block.BExtension(Extension.EApplicationExtension(ApplicationExtension.AENetscapeLooping(0))));
    // Because why the hell not? :D
    gif.blocks.add(Block.BExtension(Extension.EComment("Encoded by Yanrishatum, especially for Finlal.")));
    
    while (true)
    {
      if (!canCut()) break;
      
      var bytes:Bytes = Bytes.alloc(frameWidth * frameHeight);
      j = 0;
      while (j < frameHeight)
      {
        bytes.blit(j * frameWidth, indexedPixels, (y + j) * width + x, frameWidth);
        j++;
      }
      
      if (askDelay)
      {
        var delay:String = readLine("Specify delay at frame with position " + x + "-" + y + " (no value = " + (defaultDelay / 100) + "s): ");
        if (delay != "" && !Math.isNaN(Std.parseFloat(delay))) defaultDelay = secondsToCentiseconds(Std.parseFloat(delay));
      }
      gif.blocks.add(Block.BExtension(Extension.EGraphicControl( { disposalMethod:DisposalMethod.FILL_BACKGROUND, userInput:false, hasTransparentColor:true, delay:defaultDelay, transparentIndex:0 } )));
      gif.blocks.add(Block.BFrame( 
      { 
        x:0,
        y:0,
        width:frameWidth,
        height:frameHeight,
        localColorTable:false,
        interlaced: false,
        sorted: false,
        localColorTableSize: 0,
        pixels:bytes,
        colorTable:paletteBytes
      } ));
      if (!askDelay) Sys.println("Frame extracted @ " + x + "-" + y);
      x += frameWidth;
      if (!canCut())
      {
        x = 0;
        y += frameHeight;
      }
    }
    
    gif.blocks.add(Block.BEOF);
    
    if (output == null)
    {
      output = Dialogs.save("Specify output location", { ext:"gif", desc:"gif images" });
    }
    if (Path.extension(output).toLowerCase() != "gif") output += ".gif";
    
    Sys.println("Running encoder...");
    var fo:FileOutput = File.write(output);
    new Writer(fo).write(gif);
    fo.flush();
    fo.close();
    Sys.println("Done");
  }
  
  private static function readLine(msg:String):String
  {
    Sys.print(msg);
    return Sys.stdin().readLine();
  }
  
  private static function readChar(msg:String, left:Array<Int>, leftPrint:String, right:Array<Int>, rightPrint:String):Bool
  {
    Sys.print(msg);
    while (true)
    {
      var char:Int = Sys.getChar(false);
      if (left.indexOf(char) != -1)
      {
        Sys.println(leftPrint);
        return false;
      }
      if (right.indexOf(char) != -1)
      {
        Sys.println(rightPrint);
        return true;
      }
    }
  }
	
}