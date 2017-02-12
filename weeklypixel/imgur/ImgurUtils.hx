package imgur;
import haxe.io.BytesOutput;
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
  public static var tokenExpires:Float = 0;
  public static var tokenType:String;
  public static var userName:String;
  public static var userId:Int = 0;
  
  public static var debug:Bool = false;
  
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
  
  public static inline function setParam<T>(params:Map<String, Dynamic>, name:String, v:T):Void
  {
    if (v != null) params.set(name, v);
  }
  
  public static inline function setBool(params:Map<String, Dynamic>, name:String, b:Bool, asVal:String):Void
  {
    if (b) params.set(name, asVal);
  }
  
  public static inline function getApiFromBasic<T>(api:String, method:String = "GET", ?params:Map<String, Dynamic>):T
  {
    var basic:Basic = getApi(api, method, params);
    if (basic.success) return basic.data;
    else return null;
  }
  
  public static inline function checkUserToken():Void
  {
    if (userToken == null) throw "This API requires user access token!";
  }
  
  private static inline function statusHandler(status:Int):Void
  {
    trace("Response status: " + status);
  }
  
  private static inline function errorHandler(e:String):Void
  {
    trace("Response error: " + e);
  }
  
  public static function getApi(api:String, method:String = "GET", ?params:Map<String, Dynamic>):Basic
  {
    if (appId == null) throw "[Imgur] Application ID not set!";
    
    var http:Http = new Http("https://api.imgur.com/3/" + api);
    
    if (debug)
    {
      trace("Http: https://api.imgur.com/3/" + api);
      trace("Method: " + method);
      http.onStatus = statusHandler;
      http.onError = errorHandler;
    }
    
    if (params != null)
    {
      for (key in params.keys())
      {
        var item:Dynamic = params.get(key);
        if (Std.is(item, Array))
        {
          var arr:Array<Dynamic> = cast item;
          for (entry in arr) http.addParameter(key + "[]", Std.string(entry));
          if (debug) trace('Added array: $key => [${arr.join(", ")}]');
        }
        else
        {
          http.addParameter(key, Std.string(item));
          if (debug) trace('Added parameter: $key => $item');
        }
      }
    }
    if (userToken != null) http.addHeader("Authorization", "Bearer " + userToken);
    else http.addHeader("Authorization", "Client-ID " + appId);
    if (debug)
    {
      if (userToken != null) trace("Authorized request: " + userToken);
      else trace("Anonymous request");
    }
    // http.request(post);
    var data:BytesOutput = new BytesOutput();
    http.customRequest(method == "POST", data, null, method);
    #if neko
    var str:String = neko.Lib.stringReference(data.getBytes());
    #else
    var str:String = data.getBytes().toString();
    #end
    if (debug) trace("Data response length: " + str.length);
    try
    {
      var json:Basic = haxe.Json.parse(str);
      Imgur.errorStatus = json.status;
      if (!json.success) Imgur.error = json.data;
      else Imgur.error = null;
      return json;
    }
    catch(e:Dynamic)
    {
      trace("Json parsing error: " + e);
      trace("Data: " + str);
      #if neko
      neko.Lib.rethrow(e);
      #else
      throw e;
      #end
      return null;
    }
  }
  
}