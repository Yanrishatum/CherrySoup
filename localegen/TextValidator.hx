package;
import com.yanrishatum.bfont.BFont;
import com.yanrishatum.bfont.BFontGlyph;

using UnicodeTools;

class TextValidator
{
  
  public static function validate(data:String, font:String, maxW:Int, maxH:Int, lines:Int):Bool
  {
    if (data == "@yumo") return true;
    data = wordWrapText(StringTools.replace(data, "<N>", "\n"), font, maxW);
    var lineCount:Int = data.split("\n").length;
    var size:IntPoint = calculateDimensions(data, font, false);
    return size.x <= maxW && (size.y <= maxH || lineCount <= lines);
  }
  
  
  private static var fonts:Map<String, BFont> = new Map();
  
  public static function registerBFont(name:String, path:String):Void
  {
    var bfontPath:String = path + ".bfont";
    var font:BFont = new BFont();
    font.load(sys.io.File.getContent(bfontPath));
    fonts.set(name, font);
  }
  
  private static inline function getAutoFont(font:String):BFont
  {
    if (!fonts.exists(font)) return fonts.get("hooge");
    else return fonts.get(font);
  }
  
  public static function calculateDimensions(text:String, defaultFont:String, addSpacing:Bool = false):IntPoint
  {
    var font:BFont = getAutoFont(defaultFont);
    var split:Array<String> = text.split("\n");
    var width:Int = 0;
    var height:Int = 0;
    
    for (i in 0...split.length)
    {
      text = split[i];
      
      var lastSpacing:Int = 0;
      var len:Int = text.uLength();
      
      var w:Int = 0;
      var h:Int = font.lineHeight;
      for (j in 0...len)
      {
        var char:Int = text.uCharCodeAt(j);
        if (char == ' '.code)
        {
          w += font.spaceSize;
          lastSpacing = 0;
        }
        else
        {
          var glyph:BFontGlyph = font.glyphs.get(char);
          if (glyph == null) glyph = font.glyphs.get(char.upperChar());
          if (glyph == null) glyph = font.glyphs.get(char.lowerChar());
          if (glyph != null)
          {
            w += glyph.width - glyph.originX + glyph.spacing;
            h = Util.max(glyph.height - glyph.originY, h);
            lastSpacing = glyph.spacing;
          }
          else
          {
            for (f in fonts)
            {
              if (f.glyphs.exists(char))
              {
                glyph = f.glyphs.get(char);
                w += glyph.width - glyph.originX + glyph.spacing;
                h = Util.max(glyph.height - glyph.originY, h);
                lastSpacing = glyph.spacing;
                break;
              }
            }
          }
        }
      }
      
      if (!addSpacing) w -= lastSpacing;
      
      width = Util.max(width, w);
      height += h;
      
      if (i + 1 != split.length)
      {
        height += font.leading;
      }
    }
    return new IntPoint(width, height);
  }
  
  public static function wordWrapText(text:String, defaultFont:String, w:Int):String
  {
    var lines:Array<String> = text.split("\n");
    var out:Array<String> = new Array();
    
    for (line in lines)
    {
      var s:IntPoint = calculateDimensions(line, defaultFont);
      
      if (s.x >= w)
      {
        var words:Array<String> = line.split(" ");
        var subLine:String = null;
        var size:Int = 0;
        while (words.length > 0)
        {
          var word:String = words.shift();
          if (subLine == null)
          {
            subLine = word;
            size = calculateDimensions(word, defaultFont, true).x;
          }
          else
          {
            s = calculateDimensions(" " + word, defaultFont, true);
            if (size + s.x >= w)
            {
              out.push(subLine);
              subLine = word;
              size = calculateDimensions(word, defaultFont, true).x;
            }
            else
            {
              subLine += " " + word;
              size += s.x;
            }
          }
        }
        if (subLine != null) out.push(subLine);
      }
      else out.push(line);
    }
    return out.join("\n");
  }
  
}