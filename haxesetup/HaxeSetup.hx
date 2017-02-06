package;
import haxe.io.Path;
import sys.FileSystem;
import sys.io.File;
import sys.io.Process;
import haxe.Http;
import format.tgz.Reader;
import format.tgz.Data;
import haxe.io.BytesOutput;
import haxe.io.BytesInput;

class HaxeSetup
{

  public static var settings:Settings;
  private static var versions:Array<ServerVersion>;
  private static var current:String;
  
  public static function main():Void
  {
    var args:Array<String> = Sys.args();
    
    programPath = Sys.programPath();
    if (Path.withoutDirectory(programPath) == ".n") programPath = Sys.executablePath();
    
    settings = new Settings();
    
    if (settings.requiresInit)
    {
      if (askConfirm("This is first time you launch HaxeSetup, would like to set the toolkit list path?", true))
      {
        settings.setup(null);
      }
      else
      {
        Sys.exit(0);
        return;
      }
    }
    
    scan();
    
    if (args.length == 0)
    {
      // TODO: Usage
      Sys.println("// TODO: Usage");
    }
    else
    {
      var method:String = args.shift();
      switch (method)
      {
        case "setup":
          settings.setup(args);
        case "list":
          list(args);
        case "set":
          setVersion(args);
        case "search":
          search(args);
        case "install":
          install(args);
        case "delete":
          // delete(args);
        case "alias":
          alias(args);
        case "external":
          external(args);
        case "path":
          path(args);
        default:
          Sys.println("Unknown method");
      }
    }
  }
  
  private static function scan():Void
  {
    var folder:Array<String> = FileSystem.readDirectory(settings.toolkitListPath);
    var path:String;
    versions = new Array();
    for (file in folder)
    {
      path = Path.join([settings.toolkitListPath, file]);
      if (FileSystem.isDirectory(path) || Path.extension(file) == "external")
      {
        var ver:ServerVersion = ServerVersion.open(path);
        if (ver != null) versions.push(ver);
      }
    }
    path = Path.join([settings.toolkitListPath, ".current"]);
    if (FileSystem.exists(path)) current = File.getContent(Path.join([settings.toolkitListPath, ".current"]));
    else current = Sys.getEnv("HAXEPATH");
  }
  
  private static function install(args:Array<String>):Void
  {
    var query:String = "";
    if (args.length == 0)
    {
      query = askInputRepeat("Enter search query: ");
    }
    else query = args.join(" ");
    
    var versions:Array<ServerVersion> = getServerVersions(query);
    
    if (versions.length == 0)
    {
      Sys.println("None found by that query, sorry");
      return;
    }
    else if (versions.length > 1)
    {
      Sys.println("More than one versions found by that query, please select one: ");
      var pad:Int = Std.string(versions.length).length;
      Sys.println("Found " + versions.length + " matching queries.");
      Sys.print(StringTools.rpad("", " ", pad));
      Sys.println(" Branch      Hash       Date");
      
      var i:Int = 0;
      for (ver in versions)
      {
        Sys.print(StringTools.lpad(Std.string(i++), "0", pad));
        Sys.print(" ");
        ver.print();
      }
      
      // TODO: Ask input
      return;
    }
    
    var ver:ServerVersion = versions[0];
    var outputPath:String = Path.join([settings.toolkitListPath, ver.git]);
    
    if (FileSystem.exists(outputPath))
    {
      if (!askConfirm("Looks like you already have that version installed, proceed anyway?", false))
      {
        Sys.exit(0);
        return;
      }
    }
    else
      FileSystem.createDirectory(outputPath);
    
    // Fetch and unpack archive.
    Sys.println("Fetching file: " + ver.name);
    var http:Http = new Http(ver.url);
    var output:BytesOutput = new BytesOutput();
    http.customRequest(false, output);
    
    Sys.println("Unarchiving...");
    var archive:Data = new Reader(new BytesInput(output.getBytes())).read();
    
    var haxePath:String = null;
    
    for (file in archive)
    {
      // Thanks for format tar reader that gives zero fucks about providing `typeflag` from archive making it essentially only way to know it's a diractory. Via HAAAAACKS.
      if (file.data == null || (file.data.length == 0 && file.fmod == 509)) continue;
      Sys.println("Saving: " + file.fileName);
      
      var filePath:String = Path.join([outputPath, file.fileName]);
      var folderPath:String = Path.directory(filePath);
      
      if (!FileSystem.exists(folderPath)) FileSystem.createDirectory(folderPath);
      if (haxePath == null && Path.withoutDirectory(file.fileName) == "haxe.exe") haxePath = Path.directory(file.fileName);
      
      File.saveBytes(filePath, file.data);
    }
    Sys.println("Storing build info...");
    ver.path = haxePath;
    ver.store(outputPath);
    versions.push(ver);
    
    if (askConfirm("New version of Haxe is installed, would you like to set it now? ", false))
    {
      setVersion([ver.git]);
    }
  }
  
  private static function setVersion(args:Array<String>):Void
  {
    var query:String = "";
    if (args.length == 0)
    {
      query = askInputRepeat("Enter version hash or alias: ");
    }
    else query = args.join(" ");
    
    for (version in versions)
    {
      if (version.git == query || version.alias == query)
      {
        var path:String;
        if (version.branch == "external") path = version.path;
        else path = Path.join([settings.toolkitListPath, version.git, version.path]);
        if (windows())
        {
          Sys.command("setx", ["HAXEPATH", StringTools.replace(Path.addTrailingSlash(path), "/", "\\"), "/m"]);
          File.saveContent(Path.join([settings.toolkitListPath, ".current"]), path);
          Sys.println("Current version now is " + version.name);
        }
        else
        {
          Sys.command("Only windows supported at the moment, sorry");
        }
        return;
      }
    }
    Sys.println("Could not find version with given hash");
  }
  
  private static function search(args:Array<String>):Void
  {
    var query:String = "";
    if (args.length == 0)
    {
      query = askInputRepeat("Enter search query: ");
    }
    else query = args.join(" ");
    
    var serverVersions:Array<ServerVersion> = getServerVersions(query);
    
    if (serverVersions.length > 0)
    {
      Sys.println("Found " + serverVersions.length + " matching queries.");
      Sys.println("Branch      Hash       Date");
      for (ver in serverVersions)
      {
        ver.print();
      }
    }
    else
    {
      Sys.println("None found by that query, sorry");
    }
  }
  
  private static function external(args:Array<String>):Void
  {
    if (args.length < 1)
    {
      Sys.println("`external` command requires sub-type");
      return;
    }
    var type:String = args.shift();
    switch(type)
    {
      case "list":
        // TODO: Better list?
        list(["external"]);
      case "add":
        var name:String = args.length > 0 ? args.shift() : askInputRepeat("External version name: ");
        var path:String = args.length > 0 ? args.shift() : askInputRepeat("External version path: ");
        var ver:ServerVersion = Type.createEmptyInstance(ServerVersion);
        ver.date = Date.now().toString();
        ver.date = ver.date.substr(0, ver.date.lastIndexOf(":"));
        ver.size = 0;
        ver.name = name;
        ver.url = path;
        ver.valid = true;
        ver.branch = "external";
        ver.git = name;
        ver.path = path;
        ver.alias = name;
        ver.store();
      case "remove":
        // TODO
    }
  }
  
  private static function path(args:Array<String>):Void
  {
    filterQuery = args.length == 0 ? askInputRepeat("Search query: ").split(" ") : args;
    var vers:Array<ServerVersion> = versions.filter(versionFilter);
    if (vers.length > 1) Sys.println("More than one version found by that query");
    else if (vers.length == 0) Sys.println("No versions found by that query");
    else
    {
      Sys.println(vers[0].path);
    }
  }
  
  private static function alias(args:Array<String>):Void
  {
    var hash:String;
    if (args.length == 0) hash = askInput("Enter version hash: ");
    else hash = args.shift();
    
    var alias:String;
    if (args.length == 0) alias = askInput("Enter version alias: ");
    else alias = args.join(" ");
    
    var found:ServerVersion = null;
    for (ver in versions)
    {
      trace(ver.git, ver.alias);
      if (ver.git == hash)
      {
        if (ver.alias != null)
        {
          Sys.println("Removing old alias '" + ver.alias + "'");
        }
        ver.alias = alias;
        ver.store();
        found = ver;
        break;
      }
    }
    if (found != null)
    {
      for (ver in versions)
      {
        if (ver != found && ver.alias == alias)
        {
          ver.alias = null;
          ver.store();
          Sys.println("Removed alias from haxe " + ver.git);
        }
      }
      Sys.println("Created alias '" + alias + "' to version with hash '" + found.git + "'");
    }
    else Sys.println("Could not find version with given hash");
  }
  
  private static var filterQuery:Array<String>;
  private static function versionFilter(ver:ServerVersion):Bool
  {
    return ver.match(filterQuery);
  }
  
  private static function list(args:Array<String>):Void
  {
    // TODO: Filters
    
    var filtered:Array<ServerVersion> = versions;
    if (args.length > 0)
    {
      filterQuery = args.copy();
      filtered = versions.filter(versionFilter);
    }
    for (ver in filtered)
    {
      ver.print();
    }
    
    Sys.println("Current: " + current);
  }
  
  //=============================================================
  // Utils
  //=============================================================
  
  private static inline function windows():Bool
  {
    return (Sys.systemName() == "Windows");
  }
  
  private static inline function linux():Bool
  {
    return (Sys.systemName() == "linux" || Sys.systemName() == "BSD");
  }
  
  private static inline function mac():Bool
  {
    return (Sys.systemName() == "Mac");
  }
  
  private static function getServerVersions(?filter:String):Array<ServerVersion>
  {
    var url:String = switch(Sys.systemName())
    {
      case "Windows": "http://hxbuilds.s3-website-us-east-1.amazonaws.com/builds/haxe/windows/";
      case "Linux", "BSD": Sys.println("Alert: Linux version does not detect 32/64 OS at the moment and uses 32-bit Haxe");
                  "http://hxbuilds.s3-website-us-east-1.amazonaws.com/builds/haxe/linux32/"; // TODO: linux64
      case "Mac": "http://hxbuilds.s3-website-us-east-1.amazonaws.com/builds/haxe/mac";
      // TODO: Raspbian?
      default: null;
    }
    
    if (url == null)
    {
      Sys.println("Sorry, I was unable to detect your system and can't work properly :(");
      Sys.exit(1);
      return null;
    }
    
    var html:String = Http.requestUrl(url);
    var start:Int = html.indexOf("<pre>") + 5;
    var rawVersions:Array<String> = html.substring(start, html.indexOf("</pre>")).split("</a>");
    
    var serverVersions:Array<ServerVersion> = new Array();
    for (raw in rawVersions)
    {
      var ver:ServerVersion = new ServerVersion(raw);
      if (ver.valid) serverVersions.push(ver);
    }
    
    if (filter != null)
    {
      filterQuery = filter.split(" ");
      serverVersions = serverVersions.filter(versionFilter);
    }
    
    return serverVersions;
  }
  
  public static function askInputRepeat(text:String):String
  {
    var data:String;
    do
    {
      data = askInput(text);
    }
    while (data == "");
    return data;
  }
  
  public static function askInput(text:String, def:String = ""):String
  {
    Sys.print(text);
    var line:String = Sys.stdin().readLine();
    if (line == "") return def;
    return line;
  }
  
  public static function askConfirm(text:String, def:Bool):Bool
  {
    Sys.print(text);
    if (def) Sys.print(" [Y/n]: ");
    else Sys.print(" [y/N]: ");
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
    Sys.println(def ? "Y" : "N");
    return def;
  }
  
  public static var programPath:String;
  
}

class ServerVersion
{
  public var date:String;
  public var size:Int;
  public var name:String;
  public var url:String;
  public var valid:Bool;
  public var branch:String;
  public var git:String;
  
  // Local
  public var path:String;
  public var alias:String;
  
  public function new(string:String)
  {
    // 2014-03-01 06:12
    // 3359158
    // http://hxbuilds.s3-website-us-east-1.amazonaws.com/builds/haxe/windows/haxe_2014-03-01_development_398a8ef.tar.gz
    // haxe_2014-03-01_development_398a8ef.tar.gz
    if (string.indexOf("Last Modified") != -1) string = string.substr(string.indexOf("-\n")+2);
    var split:Array<String> = ~/(  +(<a href=")?|">)/g.split(StringTools.trim(string));
    // https://imgs.xkcd.com/comics/perl_problems.png :)
    date = split[0];
    size = Std.parseInt(split[1]);
    url = split[2];
    name = split[3];
    valid = name != null && name != "";
    if (valid)
    {
      branch = name.indexOf("development") != -1 ? "development" : name.indexOf("master") != -1 ? "master" : name.indexOf("latest") != -1 ? "latest" : "unknown";
      if (branch != "latest" && branch != "unknown")
      {
        var idx:Int = name.lastIndexOf("_") + 1;
        git = name.substring(idx, name.lastIndexOf(".tar.gz"));
      }
      else git = Path.withoutExtension(name);
    }
  }
  
  public function match(filterQuery:Array<String>):Bool
  {
    // A bit simple currently.
    var count:Int = 0;
    for (query in filterQuery)
    {
      if (name.indexOf(query) != -1 || date.indexOf(query) != -1 || branch == query.toLowerCase() || git == query.toLowerCase()) count++;
      else if (alias != null && alias == query) count++;
    }
    return count == filterQuery.length;
  }
  
  public function print():Void
  {
    if (branch == "latest") Sys.print("latest " + date);
    else Sys.print(StringTools.rpad(branch, " ", 11) + " " + StringTools.rpad(git != null ? git : "", " ", 10) + " " + date);
    if (alias != null) Sys.println(" Alias: " + alias);
    else Sys.println("");
  }
  
  public function store(?path:String):Void
  {
    if (path == null)
    {
      if (branch == "external") path = HaxeSetup.settings.toolkitListPath;
      else path = Path.join([HaxeSetup.settings.toolkitListPath, git]);
    }
    var name:String = branch == "external" ? Path.join([path, name + ".external"]) : Path.join([path, ".info"]);
    var json:VersionJson = { date: date, size: size, name: this.name, url: url, branch: branch, git: git, path: this.path, alias: alias };
    File.saveContent(name, haxe.Json.stringify(json));
  }
  
  public static function open(path:String):ServerVersion
  {
    if (FileSystem.isDirectory(path))
    {
      path = Path.join([path, ".info"]);
      if (!FileSystem.exists(path))
        return null;
    }
    var json:VersionJson = haxe.Json.parse(File.getContent(path));
    // I don't like using Type, but I'm too lazy to rewrite constructor, lol.
    var ver:ServerVersion = Type.createEmptyInstance(ServerVersion);
    ver.date = json.date;
    ver.size = json.size;
    ver.name = json.name;
    ver.url = json.url;
    ver.branch = json.branch;
    ver.git = json.git;
    ver.path = json.path;
    ver.alias = json.alias;
    ver.valid = true;
    return ver;
  }
  
}

typedef VersionJson =
{
  var date:String;
  var size:Int;
  var name:String;
  var url:String;
  var branch:String;
  var git:String;
  var path:String;
  var alias:String;
}

typedef SettingsJson =
{
  var version:Int;
  var toolkitListPath:String;
}

class Settings
{
  public var requiresInit:Bool;
  
  public var toolkitListPath:String;
  
  public function new()
  {
    var cwd:String = Sys.getCwd();
    Sys.setCwd(Path.directory(HaxeSetup.programPath));
    
    requiresInit = !FileSystem.exists("haxesetup.settings");
    if (!requiresInit)
    {
      var data:SettingsJson = haxe.Json.parse(File.getContent("haxesetup.settings"));
      toolkitListPath = data.toolkitListPath;
    }
    
    Sys.setCwd(cwd);
  }
  
  public function save()
  {
    var cwd:String = Sys.getCwd();
    Sys.setCwd(Path.directory(HaxeSetup.programPath));
    var data:SettingsJson = { version: 0, toolkitListPath:toolkitListPath };
    
    File.saveContent("haxesetup.settings", haxe.Json.stringify(data));
    
    Sys.setCwd(cwd);
  }
  
  public function setup(args:Array<String>):Void
  {
    var path:String = null;
    if (args == null || args.length == 0)
    {
      path = HaxeSetup.askInput("Enter toolkit list path (empty line for default subfolder with HaxeSetup): ", Path.join([Path.directory(HaxeSetup.programPath), "toolkits"]) );
    }
    else
    {
      path = args.shift();
    }
    if (FileSystem.exists(path) && !FileSystem.isDirectory(path))
    {
      Sys.println("Specified path is not suitable for toolkit library");
      Sys.exit(0);
      return;
    }
    if (!FileSystem.exists(path)) FileSystem.createDirectory(path);
    requiresInit = false;
    toolkitListPath = path;
    save();
  }
  
}