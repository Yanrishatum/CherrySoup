package;
import sys.io.File;
import sys.FileSystem;
import imgur.ImgurUtils;
import haxe.Http;
import imgur.Imgur;
import imgur.ImgurTypes;
import haxe.io.Path;
#if cpp

#end

class WeeklyPixel
{
  
  private static inline var NEW_ICONS_URL:String = "http://pixeljoint.com/pixels/new_icons.asp";
  private static inline var WEEKLY_OB:String = "showcase";
  private static var settings:IniFile;
  private static var months:Array<String> = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  public static function main()
  {
    Sys.println("Running at: " + Sys.getCwd());
    if (FileSystem.exists("wp.ini")) settings = IniFile.load(File.getContent("wp.ini"));
    else
    {
      settings = IniFile.load("[settings]\nHeaderID=KKM3Sp2\n[history]");
    }
    if (settings["settings"].asBool("debug", false)) ImgurUtils.debug = true;
    
    if (sys.FileSystem.exists("imgur.json"))
    {
      ImgurUtils.fromJson(haxe.Json.parse(sys.io.File.getContent("imgur.json")));
    }
    else
    {
      var credentials:Array<String> = sys.io.File.getContent("imgur_credentials.txt").split("\n");
      Imgur.setApplicationID(StringTools.trim(credentials[0]), StringTools.trim(credentials[1]));
      Imgur.oAuth2.authorize();
      sys.io.File.saveContent("imgur.json", haxe.Json.stringify(ImgurUtils.toJson()));
    }
    Imgur.oAuth2.renewToken();
    sys.io.File.saveContent("imgur.json", haxe.Json.stringify(ImgurUtils.toJson()));
    Sys.println("Imgur authorized");
    
    // trace(Imgur.image.uploadURL("http://pixeljoint.com/files/icons/full/crystalcavern.png", null, 
      // "crystalcavern.png", "Green Shine", "by Snake"));
    // trace(Imgur.image.get("G1LXrHD"));
    
    update();
    // trace(Imgur.album.create("test", null, null, null, ["6g5Np5a", "2XqVeJv", "iPAS4DJ", "pbUDqWw"], "pbUDqWw"));
    
    // File.saveContent("wp.ini", settings.toString());
    
  }
  
  private static function update():Void
  {
    Sys.println("Requesting top-list...");
    var list:Array<ArtEntry> = getIcons(WEEKLY_OB, 1);
    while (list.length > 24) list.pop();
    Sys.println("Got image list, loading...");
    var ids:Array<String> = new Array();
    list[0].getFullPiece();
    var imgid:Int = 1;
    for (art in list)
    {
      Sys.println("Loading: " + art.name + " by " + art.author);
      art.getFullPiece();
      Sys.print("Uploading... ");
      var desc:String = art.name + " by " + art.author + "\r\nPiece URL: " + art.pieceURL + "\r\nAuthor URL: " + art.authorURL + "\r\nRating place: " + imgid;
      imgid++;
      if (art == list[list.length - 1]) desc += getHistoryString();
      var img:ImageType = Imgur.image.uploadURL(art.fullURL, null, Path.withoutDirectory(art.fullURL), null, desc);
      Sys.println("Done: " + img.id);
      ids.push(img.id);
    }
    
    ids.reverse();
    ids.push(settings["settings"]["HeaderID"]);
    Sys.print("Uploaded all images, creating an album... ");
    var title:String = "Weekly Pixel: Week " + getWeek();
    var res:NewAlbumType = Imgur.album.create(title, null, null, null, ids, ids[ids.length - 1]);
    Sys.println("Done: " + res.id);
    var week:String = getWeek();
    settings["history"][week] = res.id;
    var date:Date = Date.now();
    settings["history"][week + "_date"] = date.getDate() + ' ' + months[date.getMonth()] + " '" + Std.string(date.getFullYear()).substr(2);
    File.saveContent("wp.ini", settings.toString());
    
    if (settings["settings"].asBool("AutoShare", false))
    {
      Sys.print("Sharing album... ");
      Imgur.gallery.shareAlbum(res.id, title, "Creativity", true, false);
      Sys.println("Done");
    }
    // trace(res);
  }
  
  private static inline function imgurErrorCheck():Void
  {
    if (Imgur.error != null)
    {
      Sys.println("Error occured with Imgur communication:");
      Sys.println("Status: " + Imgur.errorStatus);
      Sys.println("Error: " + Imgur.error.error);
      Sys.println("Method: " + Imgur.error.method);
      Sys.println("Request: " + Imgur.error.request);
    }
  }
  
  private static function getWeek():String
  {
    return Std.string(Std.int(Lambda.count(settings["history"]) / 2 + 1));
  }
  
  private static function getHistoryString():String
  {
    var buf:StringBuf = new StringBuf();
    
    buf.add("\r\n\r\nPrevious weeks:");
    var count:Int = Std.int(Lambda.count(settings["history"]) / 2);
    for (i in 0...count)
    {
      buf.add("\r\nWeek ");
      buf.add(i + 1);
      buf.add(' @ ');
      buf.add(settings["history"][Std.string(i) + "_date"]);
      buf.add(": https://imgur.com/gallery/");
      buf.add(settings["history"][Std.string(i)]);
    }
    buf.add("\r\nThanks to Finlal for logo.\r\n* Those posts always marked as mature, because bot do not guarantee lack of nudity in weekly top.");
    return buf.toString();
  }
  
  private static function getIcons(type:String, page:Int, ?into:Array<ArtEntry>):Array<ArtEntry>
  {
    var http:Http = new Http(NEW_ICONS_URL);
    http.addHeader("Cookie", "v=pg=" + page + "&ob=" + type);
    http.request(false);
    var start:Int = http.responseData.indexOf("<div class='imgbox'");
    var end:Int = http.responseData.indexOf("<br clear='both' />");
    if (start == -1 || end == -1)
    {
      trace(http.responseData);
      throw "Something went wrong";
    }
    
    var data:Array<String> = http.responseData.substring(start, end).split("<div class='imgbox'");
    data.shift();
    var entries:Array<ArtEntry> = into != null ? into : new Array();
    for (item in data) entries.push(ArtEntry.createFromHTML(item));
    
    return entries;
  }
}
