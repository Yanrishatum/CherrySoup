package;
import haxe.io.Path;
import sys.FileSystem;
import sys.io.File;
import sys.io.Process;

class LibSetup
{

  private static var usage:Map<String, Array<String>> =
  [
    "-add"    => ["-add <name> <path>", "Adds new library to the storage. Path should be absolute."],
    "-remove" => ["-remove <name>", "Removes existing library from the storage."],
    "-rename" => ["-rename <current_name> <new_name>", "Changes existing library name."]
  ];
  
  private static var libs:Map<String, String>;
  
  public static function main():Void
  {
    var args:Array<String> = Sys.args();
    Sys.setCwd(Path.directory(Sys.executablePath()));
    libs = readLibs();
    
    if (args.length == 0)
    {
      printHelp();
      return;
    }
    while (args.length > 0)
    {
      var arg:String = args.shift();
      if (arg.charCodeAt(0) == "-".code)
      {
        switch (arg)
        {
          case "-add":
            if (args.length < 2) printUsage("-add");
            else addLibrary(args.shift(), args.shift());
            continue;
          case "-remove":
            if (args.length < 1) printUsage("-remove");
            else removeLibrary(args.shift());
            continue;
          case "-rename":
            if (args.length < 2) printUsage("-rename");
            else renameLibrary(args.shift(), args.shift());
            continue;
        }
      }
      
      if (libs.exists(arg))
      {
        Sys.command("haxelib", ["setup", libs[arg]]);
      }
      else
      {
        Sys.println('Cannot find library under name $arg');
      }
    }
  }
  
  //==========================================================
  //{ Commands
  //==========================================================
  
  private static function addLibrary(name:String, path:String):Void
  {
    if (name.indexOf(":") != -1)
    {
      Sys.println("':' character does not allowed in the names.");
      return;
    }
    if (!Path.isAbsolute(path))
    {
      Sys.println("Path should be specified as absolute");
    }
    if (!FileSystem.exists(path))
    {
      if (askConfirm("Specified path does not exists. Create?", true))
      {
        FileSystem.createDirectory(path);
      }
      else
      {
        return;
      }
    }
    if (!FileSystem.isDirectory(path))
    {
      Sys.println("Specified path is not directory!");
      return;
    }
    if (libs.exists(name) && !askConfirm("This library name already occupied. Override?", false))
    {
      return;
    }
    
    libs.set(name, Path.normalize(Path.removeTrailingSlashes(path)));
    writeLibs();
    Sys.println('Added new library $name at path $path');
  }
  
  private static function removeLibrary(name:String):Void
  {
    if (!libs.exists(name)) Sys.println("Library with specified name already removed or wasn't here in the first place.");
    else
    {
      libs.remove(name);
      writeLibs();
      Sys.println('Removed library $name');
    }
  }
  
  private static function renameLibrary(name:String, newName:String):Void
  {
    if (!libs.exists(name)) Sys.println("Library with specified name does not exists.");
    else
    {
      if (libs.exists(newName) && !askConfirm("New library name already taken. Override?", false)) return;
      libs.set(newName, libs.get(name));
      libs.remove(name);
      writeLibs();
      Sys.println('Renamed library $name to $newName');
    }
  }
  
  //==========================================================
  //}
  //==========================================================
  
  //==========================================================
  //{ CLI
  //==========================================================
  
  private static function askConfirm(description:String, defaultYes:Bool):Bool
  {
    Sys.print(description + (defaultYes ? " [Y/n] " : " [y/N] "));
    var char:Int = Sys.getChar(false);
    if (char == "y".code || char == "Y".code)
    {
      Sys.println("Y");
      return true;
    }
    else if (char == "n".code || char == "N".code)
    {
      Sys.println("N");
      return false;
    }
    else
    {
      Sys.println(defaultYes ? "Y" : "N");
      return defaultYes;
    }
  }
  
  private static function printUsage(command:String):Void
  {
    var desc:Array<String> = usage.get(command);
    Sys.println("Usage: " + desc[0] + " | " + desc[1]);
  }
  
  private static function printHelp():Void
  {
    var proc:Process = new Process("haxelib", ["config"]);
    var currPath:String = Path.normalize(Path.removeTrailingSlashes(proc.stdout.readLine()));
    
    var charOffset:Int = 0;
    var buf:StringBuf = new StringBuf();
    for (desc in usage)
    {
      charOffset = desc[0].length > charOffset ? desc[0].length : charOffset;
    }
    buf.add("Usage:\n");
    for (desc in usage)
    {
      buf.add(StringTools.rpad(desc[0], " ", charOffset));
      buf.add(" | ");
      buf.add(desc[1]);
      buf.addChar("\n".code);
    }
    buf.add("\nRegistered libs:");
    
    var longest:Int = 0;
    for (key in libs.keys())
    {
      longest = key.length > longest ? key.length : longest;
    }
    
    for (key in libs.keys())
    {
      buf.addChar("\n".code);
      buf.add(StringTools.rpad(key, " ", longest));
      buf.addChar(":".code);
      var lib:String = libs.get(key);
      if (lib == currPath) buf.addChar("[".code);
      else buf.addChar(" ".code);
      buf.add(libs.get(key));
      if (lib == currPath) buf.addChar("]".code);
    }
    
    Sys.println(buf.toString());
  }
  
  //==========================================================
  //}
  //==========================================================
  
  private static function readLibs():Map<String, String>
  {
    if (!FileSystem.exists("libsetup_list.txt")) return new Map();
    var file:Array<String> = File.getContent("libsetup_list.txt").split("\n");
    var libs:Map<String, String> = new Map();
    for (lib in file)
    {
      var idx:Int = lib.indexOf(":");
      libs.set(lib.substr(0, idx), StringTools.trim(lib.substr(idx + 1)));
    }
    return libs;
  }
  
  private static function writeLibs():Void
  {
    File.saveContent("libsetup_list.txt", libsToStr());
  }
  
  private static function libsToStr():String
  {
    var buf:StringBuf = new StringBuf();
    for (key in libs.keys())
    {
      buf.add(key);
      buf.addChar(":".code);
      buf.add(libs[key]);
      buf.addChar("\n".code);
    }
    var str:String = buf.toString();
    return str.substr(0, str.length - 1);
  }
  
}