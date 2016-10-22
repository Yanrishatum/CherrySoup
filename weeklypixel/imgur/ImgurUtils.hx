package imgur;
import haxe.Http;
import imgur.Imgur;
import imgur.ImgurTypes;

class ImgurUtils
{
  
  public static var appId:String;
  public static var appSecret:String;
  
  public static var userPIN:String;
  public static var userToken:String;
  public static var refreshToken:String;
  public static var tokenExpires:Int = 0;
  public static var tokenType:String;
  public static var userName:String;
  public static var userId:Int = 0;
  
  public static function toJson():Dynamic
  {
    var data:Dynamic = {
      appId: appId,
      appSecret: appSecret,
      tokenExpires: tokenExpires,
      userId: userId
    };
    if (userPIN != null) data.userPIN = userPIN;
    if (userToken != null) data.userToken = userToken;
    if (refreshToken != null) data.refreshToken = refreshToken;
    if (tokenType != null) data.tokenType = tokenType;
    if (userName != null) data.userName = userName;
    return data;
  }
  
  public static function fromJson(data:Dynamic):Void
  {
    appId = data.appId;
    appSecret = data.appSecret;
    tokenExpires = data.tokenExpires;
    userId = data.userId;
    if (Reflect.hasField(data, "userPIN")) userPIN = data.userPIN;
    if (Reflect.hasField(data, "userToken")) userToken = data.userToken;
    if (Reflect.hasField(data, "refreshToken")) refreshToken = data.refreshToken;
    if (Reflect.hasField(data, "tokenType")) tokenType = data.tokenType;
    if (Reflect.hasField(data, "userName")) userName = data.userName;
  }
  
  public static inline function checkUserToken():Void
  {
    if (userToken == null) throw "This API requires user access token!";
  }
  
  public static function getApi(api:String, post:Bool = false, ?params:Map<String, Dynamic>):Basic
  {
    if (appId == null) throw "[Imgur] Application ID not set!";
    
    var http:Http = new Http("https://api.imgur.com/3/" + api);
    if (params != null)
    {
      for (key in params.keys())
      {
        var item:Dynamic = params.get(key);
        if (Std.is(item, Array))
        {
          var arr:Array<Dynamic> = cast item;
          for (entry in arr) http.addParameter(key + "[]", Std.string(entry));
        }
        else
        {
          http.addParameter(key, Std.string(item));
        }
      }
    }
    if (userToken != null) http.addHeader("Authorization", "Bearer " + userToken);
    else http.addHeader("Authorization", "Client-ID " + appId);
    http.request(post);
    try
    {
      var json:Basic = haxe.Json.parse(http.responseData);
      Imgur.errorStatus = json.status;
      if (!json.success) Imgur.error = json.data;
      else Imgur.error = null;
      return json;
    }
    catch(e:Dynamic)
    {
      trace(e);
      trace(http.responseData);
      neko.Lib.rethrow(e);
      return null;
    }
  }
  
}