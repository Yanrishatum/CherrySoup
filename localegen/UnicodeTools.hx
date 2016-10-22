package ;
import haxe.Utf8;
import unifill.Unifill;

/**
 * ...
 * @author Yanrishatum
 */
class UnicodeTools
{
  
  private static var upperToLower:Map<Int, Int>;
  private static var lowerToUpper:Map<Int, Int>;
  
  public static function init(path:String):Void
  {
    upperToLower = createMapping(sys.io.File.getContent(haxe.io.Path.join([path, "locales/uppercase.txt"])));
    lowerToUpper = createMapping(sys.io.File.getContent(haxe.io.Path.join([path, "locales/lowercase.txt"])));
  }
  
  private static function createMapping(data:String):Map<Int, Int>
  {
    var out:Map<Int, Int> = new Map();
    
    var i:Int = 0;
    var idx:Int;
    var len:Int = data.length - 1;
    while (i < len)
    {
      idx = data.indexOf(":", i);
      var code:Int = Std.parseInt(data.substring(i, idx));
      i = idx + 1;
      idx = data.indexOf("\n", i);
      out.set(code, Std.parseInt(data.substring(i, idx)));
      i = idx + 1;
    }
    
    return out;
  }
  
  public static inline function upperChar(char:Int):Int
  {
    return lookupChar(char, lowerToUpper);
  }
  
  public static inline function lowerChar(char:Int):Int
  {
    return lookupChar(char, upperToLower);
  }
  
  public static inline function uToUpperCase(str:String):String
  {
    return lookup(str, lowerToUpper);
  }
  
  public static inline function uToLowerCase(str:String):String
  {
    return lookup(str, upperToLower);
  }
  
  public static inline function isLowCase(char:Int):Bool
  {
    return lowerToUpper.exists(char);
  }
  
  public static inline function isUpperCase(char:Int):Bool
  {
    return upperToLower.exists(char);
  }
  
  public static inline function uLength(str:String):Int
  {
    return Unifill.uLength(str);
  }
  
  public static inline function uCharAt(str:String, pos:Int):String
  {
    return Unifill.uCharAt(str, pos);
  }
  
  public static inline function uCharCodeAt(str:String, pos:Int):Int
  {
    return Unifill.uCharCodeAt(str, pos);
  }
  
  private static function lookupChar(char:Int, map:Map<Int, Int>):Int
  {
    var code:Null<Int> = map.get(char);
    return code == null ? char : code;
  }
  
  private static function lookup(str:String, map:Map<Int, Int>):String
  {
    var len:Int = Unifill.uLength(str);
    var i:Int = 0;
    var buf:StringBuf = new StringBuf();
    while (i < len)
    {
      var code:Int = Unifill.uCharCodeAt(str, i);
      var newCode:Null<Int> = map.get(code);
      if (newCode == null) Unifill.uAddChar(buf, code);
      else Unifill.uAddChar(buf, newCode);
      i++;
    }
    return buf.toString();
  }
  
}