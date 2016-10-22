package;
import haxe.Http;
import imgur.Imgur;
import imgur.ImgurUtils;
import imgur.ImgurTypes;
import haxe.io.Path;

class WeeklyPixel
{
  
  private static inline var NEW_ICONS_URL:String = "http://pixeljoint.com/pixels/new_icons.asp";
  private static inline var WEEKLY_OB:String = "showcase";
  
  public static function main()
  {
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
    
  }
  
  private static function update():Void
  {
    Sys.println("Requesting top-list...");
    var list:Array<ArtEntry> = getIcons(WEEKLY_OB, 1);
    while (list.length > 24) list.pop();
    Sys.println("Got image list, loading...");
    var ids:Array<String> = new Array();
    list[0].getFullPiece();
    for (art in list)
    {
      Sys.println("Loading: " + art.name + " by " + art.author);
      art.getFullPiece();
      Sys.print("Uploading... ");
      var desc:String = "by " + art.author + "\r\nPiece URL: " + art.pieceURL + "\r\nAuthor URL: " + art.authorURL;
      var img:ImageType = Imgur.image.uploadURL(art.fullURL, null, Path.withoutDirectory(art.fullURL), art.name, desc);
      Sys.println("Done: " + img.id);
      ids.push(img.id);
    }
    ids.reverse();
    Sys.print("Uploaded all images, creating an album... ");
    var res:NewAlbumType = Imgur.album.create("Weekly Pixel - weekly digest of PixelJoint", "Weekly Pixel - teh bot of top-24 pixel art images on PixelJoint because Author wanted to make one.", null, null, ids, ids[ids.length - 1]);
    Sys.println("Done: " + res.id);
    // trace(res);
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

class ArtEntry
{
  // Who don't like regular expressions?
  private static var imageAndName:EReg = ~/<a href='(\/pixelart\/[0-9]+\.htm)'>([^<]+)<\/a>/;
  private static var authorReg:EReg = ~/<a href='(\/p\/[0-9]+\.htm)'[^>]+>([^<]+)<\/a>/;
  private static var dateReg:EReg = ~/Added to gallery @ (\d+)\/(\d+)\/(\d+) (\d+):(\d+)/;
  private static var mainPieceReg:EReg = ~/<img id='mainimg' src="([^"]+)"/;
  
  public static function createFromHTML(data:String):ArtEntry
  {
    var entry:ArtEntry = new ArtEntry();
    
    imageAndName.match(data);
    entry.pieceURL = "http://pixeljoint.com" + imageAndName.matched(1);
    entry.name = imageAndName.matched(2);
    
    authorReg.match(data);
    entry.authorURL = "http://pixeljoint.com" + authorReg.matched(1);
    entry.author = authorReg.matched(2);
    
    dateReg.match(data);
    entry.date = new Date(Std.parseInt(dateReg.matched(3)), Std.parseInt(dateReg.matched(1)), Std.parseInt(dateReg.matched(2)),
      Std.parseInt(dateReg.matched(4)), Std.parseInt(dateReg.matched(5)), 0);
    
    return entry;
  }
  
  public var pieceURL:String;
  public var authorURL:String;
  public var name:String;
  public var author:String;
  public var date:Date;
  public var fullURL:String;
  
  public function getFullPiece()
  {
    var http:Http = new Http(pieceURL);
    http.request(false);
    mainPieceReg.match(http.responseData);
    fullURL = "http://pixeljoint.com" + mainPieceReg.matched(1);
  }
  
  public function new()
  {
    
  }
  
  
}