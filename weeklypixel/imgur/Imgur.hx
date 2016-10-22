package imgur;
import imgur.ImgurTypes;

class Imgur
{
  
  public static var error:ErrorData;
  public static var errorStatus:Int;
  
  public static function setApplicationID(id:String, secret:String):Void
  {
    ImgurUtils.appId = id;
    ImgurUtils.appSecret = secret;
  }
  
  public static var album:Album = new Album();
  
  public static var image:Image = new Image();
  
  public static var oAuth2:OAuth2 = new OAuth2();
  
}