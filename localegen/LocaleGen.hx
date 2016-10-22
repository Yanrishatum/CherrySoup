package;
import haxe.io.Path;
import sys.FileSystem;
import sys.io.File;
import firetongue.TSV;
import tjson.TJSON;
import format.tmx.Data;
import format.tmx.Reader;

#if cpp
import hxcpp.StaticStd;
import hxcpp.StaticRegexp;
#end

class LocaleGen
{
  
  public static function main()
  {
    var args:Array<String> = Sys.args();
    if (args.length < 2)
    {
      Sys.println("Usage: lg <input path> <output path>");
      return;
    }
    var path:String = args.shift();
    
    UnicodeTools.init(path);
    TextValidator.registerBFont("main", Path.join([path, "gui/fonts/font"]));
    TextValidator.registerBFont("digits_red", Path.join([path, "gui/fonts/digits"]));
    TextValidator.registerBFont("digits_green", Path.join([path, "gui/fonts/digits_visited"]));
    TextValidator.registerBFont("digits_nes", Path.join([path, "gui/fonts/digits_nes"]));
    TextValidator.registerBFont("information", Path.join([path, "gui/fonts/information"]));
    TextValidator.registerBFont("information_shadow", Path.join([path, "gui/fonts/information_shadow"]));
    TextValidator.registerBFont("hooge", Path.join([path, "gui/fonts/hooge"]));
    TextValidator.registerBFont("hangyaboly", Path.join([path, "gui/fonts/hangyaboly"]));
    TextValidator.registerBFont("yumo", Path.join([path, "gui/fonts/yumo_font"]));
    TextValidator.registerBFont("icons", Path.join([path, "gui/fonts/icons"]));
    TextValidator.registerBFont("announce", Path.join([path, "gui/fonts/announce"]));
    
    var gen:LocaleGen = new LocaleGen(args.shift());
    if (args.indexOf("-validate") != -1) gen.validateMode = true;
    
    if (args.indexOf("-textvalidate") != -1)
    {
      gen.validate();
    }
    else if (args.indexOf("-onlysort") != -1) gen.sort();
    else
    {
      gen.scan(path);
      if (args.indexOf("-sort") != -1) gen.sort();
    }
    
    gen.save();
    Sys.println("Done");
  }
  
  private var tsv:TSV;
  private var log:TSV;
  private var validator:TSV;
  private var logName:String;
  private var output:String;
  private static inline var TAB:String = String.fromCharCode(9);
  private var validateMode:Bool;
  
  public function new(output:String)
  {
    this.output = output;
    tsv = openTSV(output);
    validator = openTSV("validation.tsv");
    var d:Date = Date.now();
    logName = "lg_" + d.getFullYear() + "_" + (1 + d.getMonth()) + "_" + d.getDate() + ".tsv";
    log = openTSV(logName);
  }
  
  public inline function scan(path:String):Void
  {
    scanFolder(path);
    tsv.grid = tsv.grid.filter(function(a:Array<String>):Bool { return a.length >= 2; });
    log.grid = log.grid.filter(function(a:Array<String>):Bool { return a.length >= 2; });
  }
  
  public function save():Void
  {
    if (validateMode)
    {
      var validatorList = validator.grid;
      validator.grid = new Array();
      for (cell in tsv.grid) 
      {
        if (validatorList.indexOf(cell) == -1)
        {
          Sys.println("Not required: " + cell.join(" = "));
          validator.grid.push(cell);
        }
      }
      saveTSV(validator, "validation.tsv");
      return;
    }
    if (validator.grid.length > 0) saveTSV(validator, "validation.tsv");
    saveTSV(tsv, output);
    saveTSV(log, logName);
  }
  
  public function sort():Void
  {
    tsv.grid.sort(pairSort);
    log.grid.sort(pairSort);
  }
  
  public function validate():Void
  {
    validator.fields = tsv.fields.copy();
    for (item in tsv.grid)
    {
      if (item == null || item.length < 2) continue;
      
      var key:String = item[0];
      var validated:Array<String> = [key];
      var skip:Bool = true;
      
      for (i in 1...item.length)
      {
        var valid:Bool = true;
        var text:String = "";
        
        if ((StringTools.startsWith(key, "#map_") && key.indexOf("_npc_") != -1) || StringTools.startsWith(key, "#dialog_"))
        {
          var hooge:Bool = TextValidator.validate(item[i], "hooge", 156, 32, 3);
          if (!hooge)
          {
            text = "Invalid: NORMAL";
            var t = TextValidator.wordWrapText(StringTools.replace(item[i], "<N>", "\n"), "hooge", 156);
            var size = TextValidator.calculateDimensions(t, "hooge", false);
            text += " (" + size.x + ", " + size.y + ", lines: " + t.split("\n").length + ")";
          }
          var yumo = TextValidator.validate(item[i], "yumo", 156, 32, 3);
          if (!yumo)
          {
            var indexValue:String;
            if (StringTools.startsWith(key, "#dialog_"))
              indexValue = findValue( key.substr(0, key.lastIndexOf("_")) + "_0", i);
            else
            {
              indexValue = findValue(key.substr(0, key.lastIndexOf("_")) + "_text", i);
              if (indexValue == null) indexValue = findValue(key.substr(0, key.lastIndexOf("_")) + "_text0", i);
              if (indexValue == null) indexValue = findValue(key.substr(0, key.lastIndexOf("_")) + "_text1", i);
              if (indexValue == null) indexValue = findValue(key.substr(0, key.lastIndexOf("_")) + "_text2", i);
            }
            
            if (indexValue != null && indexValue == "@yumo")
            {
              text = "Invalid: YUMO";
              var t = TextValidator.wordWrapText(StringTools.replace(item[i], "<N>", "\n"), "yumo", 156);
              var size = TextValidator.calculateDimensions(t, "yumo", false);
              text += " (" + size.x + ", " + size.y + ", lines: " + t.split("\n").length + ")";
            }
            else yumo = true;
            
          }
          valid = yumo && hooge;
        }
        else if (StringTools.startsWith(key, "#map_"))
        {
          if (key.indexOf("_hint_") != -1)
          {
            valid = TextValidator.validate(item[i], "main", 246, 90, 90);
            if (!valid) text = "Invalid: Hint";
          }
        }
        else if (StringTools.startsWith(key, "#diary_"))
        {
          // 150x66
          valid = TextValidator.validate(item[i], "hooge", 150, 66, 90);
          if (!valid) text = "Invalid: Diary";
        }
        
        validated.push(text);
        if (!valid) skip = false;
      }
      if (skip) continue;
      Sys.println("Invalid: " + validated.join(", "));
      validator.grid.push(validated);
    }
  }
  
  private function findValue(key:String, index:Int):String
  {
    for (item in tsv.grid)
    {
      if (item != null && item.length > index)
      {
        if (item[0] == key) return item[index];
      }
    }
    return null;
  }
  
  private function openTSV(path:String):TSV
  {
    if (FileSystem.exists(path))
      return new TSV(File.getContent(path));
    return new TSV("flag" + TAB + "content");
  }
  
  private function saveTSV(tsv:TSV, path:String):Void
  {
    var tsvOut:StringBuf = new StringBuf();
    tsvOut.add(tsv.fields.join(TAB));
    tsvOut.add("\r\n");
    for (val in tsv.grid)
    {
      if (val.length == 0) continue;
      tsvOut.add(val.join(TAB));
      tsvOut.add("\r\n");
    }
    File.saveContent(path, tsvOut.toString());
  }
  
  private function scanFolder(path:String):Void
  {
    var files:Array<String> = FileSystem.readDirectory(path);
    for (file in files)
    {
      var newPath:String = Path.join([path, file]);
      if (FileSystem.isDirectory(newPath)) scanFolder(newPath);
      else
      {
        switch (Path.extension(file).toLowerCase())
        {
          case "tmx":
            scanTmx(newPath);
          case "txt":
            scanTxt(newPath);
          case "json":
            scanTxt(newPath);
          default:
            // Unknown
        }
      }
    }
  }
  
  private function scanTxt(path:String):Void
  {
    var sort:Bool = false;
    
    var key:String = "_" + new Path(path).file + "_";
    var split:Array<String> = null;
    if (path.indexOf("assets/chars/dialogs") != -1)
    {
      if (path.indexOf("_") != -1 && Path.withoutDirectory(path) != "portal_demon.txt")
      {
        split = File.getContent(path).split("//");
        key = "#dialog" + key;
      }
    }
    else if (path.indexOf("assets/diary") != -1)
    {
      split = File.getContent(path).split("\r\n\r\n");
      split.shift();
      key = "#diary" + key;
    }
    else if (path == "assets/intro/script.txt")
    {
      var sub:Array<String> = new Array();
      split = File.getContent(path).split("\r\n\r\n");
      for (item in split) if (item.charAt(0) != "@") sub.push(item);
      split = sub;
      key = "#intro_";
    }
    else if (path == "assets/map.json")
    {
      var json:Array<Array<String>> = TJSON.parse(File.getContent(path)).areas;
      for (y in 0...json.length)
      {
        var line:Array<String> = json[y];
        for (x in 0...line.length)
        {
          insertPair("#map_area_" + x + "_" + y, cleanup(StringTools.trim(line[x])));
        }
      }
    }
    else if (path == "assets/gui/hints/hints.json")
    {
      var json:Array<{ name:String, desc:String, image:String }> = TJSON.parse(File.getContent(path)).hints;
      for (item in json)
      {
        insertPair("#hint_" + item.name + "_name", item.name);
        insertPair("#hint_" + item.name + "_desc", cleanup(item.desc));
      }
    }
    
    if (split != null)
    {
      var i:Int = 0;
      for (item in split)
      {
        insertPair(key + i, cleanup(StringTools.trim(item)));
        i++;
      }
    }
    
  }
  
  private function insertPair(key:String, value:String):Void
  {
    for (i in 0...tsv.grid.length)
    {
      if (tsv.grid[i][0] == key)
      {
        //if (tsv.grid[i][1] != value)
          //trace("Updating: " + key + " = " + value);
        //tsv.grid[i][1] = value;
        if (validateMode)
        {
          validator.grid.push(tsv.grid[i]);
        }
        return;
      }
    }
    if (!validateMode)
    {
      tsv.grid.push([key, value]);
      log.grid.push([key, value]);
      Sys.println("Insert new: " + key + " = " + value);
    }
    else
    {
      Sys.println("Not listed: " + key + " = " + value);
    }
  }
  
  //{ TMX
  
  private static inline var hint_id:Int = 1025 + (1 * 32 + 3);
  private static inline var npc_id:Int = 1025 + (3 * 32 + 0);
  private static inline var diary_id:Int = 1025 + (3 * 32 + 5);
  private static inline var slot_id:Int = 1025 + (1 * 32 + 12);
  private static inline var trigger_id:Int = 1025 + (1 * 32 + 13);
  private static var NPC_FIELDS:Array<String> = ["text", "text0", "text1", "text2", "text3", "text4", "text5", "text6", "text7", "text8", "text9", "text10"];
  private static var TEXT_FIELDS:Array<String> = ["text"]; //hint/trigger
  private static var DIARY_FIELDS:Array<String> = ["note"]; // Diary
  private static var SLOT_FIELDS:Array<String> = ["conditionText"]; // Artefact
  
  private function scanTmx(path:String):Void
  {
    var tmx:TmxMap = new Reader(Xml.parse(File.getContent(path))).read();
    var key:String = "#map_" + new Path(path).file + "_";
    for (layer in tmx.layers)
    {
      switch (layer)
      {
        case TmxLayer.ObjectGroup(group):
          for (object in group.objects)
          {
            var id:Int = switch(object.objectType)
            {
              case TmxObjectType.Tile(gid): gid;
              default: 0;
            }
            
            switch (id)
            {
              case hint_id:
                savePair(object, key + "hint_"    + object.id + "_", TEXT_FIELDS);
              case npc_id:
                savePair(object, key + "npc_"     + object.id + "_" + object.name + "_", NPC_FIELDS);
              case diary_id:
                savePair(object, key + "diary_"   + object.id + "_", DIARY_FIELDS);
              case slot_id:
                savePair(object, key + "slot_"    + object.id + "_", SLOT_FIELDS);
              case trigger_id:
                savePair(object, key + "trigger_" + object.id + "_", TEXT_FIELDS);
              //default:
                //trace(id);
            }
          }
        default:
          // Meh
      }
    }
  }
  
  private function savePair(obj:TmxObject, pairKey:String, fields:Array<String>):Void
  {
    for (key in obj.properties.keys())
    {
      if (fields.indexOf(key) != -1)
      {
        insertPair(pairKey + key, cleanup(obj.properties.get(key)));
      }
    }
  }
  
  //}
  
  private function pairSort(aArr:Array<String>, bArr:Array<String>):Int
  {
    var a:String = aArr[0];
    var b:String = bArr[0];
    if (a == null || b == null) return 0;
    var left:Int = 0;
    var right:Int = 0;
    
    var startChar:Int;
    var scanStart:Int;
    var leftChunkData:String;
    var rightChunkData:String;
    
    inline function isDigit(a:Int):Bool
    {
      return (a >= 48 && a <= 57);
    }
    
    inline function inChunk(a:Int, b:Int):Bool
    {
      if (isDigit(b))
      {
        return isDigit(a);
      }
      else return !isDigit(a);
    }
    
    while ((left < a.length) || (right < b.length))
    {
      if (left >= a.length) return -1;
      else if (right >= b.length) return 1;
      
      startChar = StringTools.fastCodeAt(a, left);
      scanStart = left;
      while ((left < a.length) && (left == scanStart || inChunk(StringTools.fastCodeAt(a, left), startChar)))
      {
        left++;
      }
      
      leftChunkData = a.substring(scanStart, left);
      
      scanStart = right;
      startChar = StringTools.fastCodeAt(b, right);
      while ((right < b.length) && (right == scanStart || inChunk(StringTools.fastCodeAt(b, right), startChar)))
      {
        right++;
      }
      
      rightChunkData = b.substring(scanStart, right);
      
      if (isDigit(StringTools.fastCodeAt(leftChunkData, 0)) && isDigit(StringTools.fastCodeAt(rightChunkData, 0)))
      {
        startChar = Std.parseInt(leftChunkData);
        scanStart = Std.parseInt(rightChunkData);
        if (startChar < scanStart) return -1;
        if (startChar > scanStart) return 1;
      }
      else
      {
        if (leftChunkData != rightChunkData) return leftChunkData > leftChunkData ? 1 : -1;
      }
      
    }
    
    return 0;
  }
  
  private inline function cleanup(input:String):String
  {
    return ~/(\\n|\r?\n)/gi.replace(input, "<N>");
  }
  
}