package;

@:forward
@:forwardStatics
abstract IniFile(IniFile_impl)
{
  
  public inline function new()
  {
    this = new IniFile_impl();
  }
  
  @:arrayAccess
  public inline function get(k:String):Category
  {
    return this.categories[k];
  }
  
  @:arrayAccess
  public inline function set(k:String, v:Category):Category
  {
    return this.categories[k] = v;
  }
  
  
}

class IniFile_impl
{
  public static function load(file:String):IniFile
  {
    var out:IniFile = new IniFile();
    
    var lines = file.split("\n");
    var category:Category = new Map();
    var addDefault:Bool = true;
    for (line in lines)
    {
      line = StringTools.trim(line);
      if (line.length < 2) continue;
      if (line.charCodeAt(0) == "[".code && line.charCodeAt(line.length - 1) == "]".code)
      {
        addDefault = false;
        var name:String = line.substr(1, line.length - 2);
        if (out.categories.exists(name)) category = out.categories.get(name);
        else
        {
          out.categories.set(name, category = new Map());
        }
      }
      else
      {
        var idx = line.indexOf("=");
        if (idx != -1)
        {
          category.set(StringTools.rtrim(line.substr(0, idx)), StringTools.ltrim(line.substr(idx+1)));
        }
      }
    }
    if (addDefault) out.categories.set("default", category);
    
    return out;
  }
  
  public var categories:Map<String, Category>;
  
  public function new()
  {
    categories = new Map();
  }
  
  public function toString():String
  {
    var buf:Array<String> = new Array();
    
    for (catName in categories.keys())
    {
      var cat:Category = categories.get(catName);
      buf.push("[" + catName + "]");
      for (key in cat.keys())
      {
        buf.push(key + "=" + cat.get(key));
      }
    }
    
    return buf.join("\r\n");
  }
  
}

@:forward
@:forwardStatics
abstract Category(Map<String, String>) from Map<String, String> to Map<String, String>
{
  
  @:arrayAccess
  private inline function getV(k:String):String { return this[k]; }
  @:arrayAccess
  private inline function setV(k:String, v:String):String { return this[k] = v; }
  
  public inline function asInt(key:String, def:Int = 0):Int
  {
    if (this.exists(key)) return Std.parseInt(this.get(key));
    else return def;
  }
  
  public inline function asFloat(key:String, def:Float = 0):Float
  {
    if (this.exists(key)) return Std.parseFloat(this.get(key));
    return def;
  }
  
  public inline function asBool(key:String, def:Bool = false):Bool
  {
    if (this.exists(key))
    {
      var v:String = this.get(key);
      if (v.toLowerCase() == "true" || Std.parseInt(v) > 0) return true;
      else return false;
    }
    else return def;
  }
  
  
}