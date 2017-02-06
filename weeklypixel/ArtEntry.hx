package;

import haxe.Http;
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
