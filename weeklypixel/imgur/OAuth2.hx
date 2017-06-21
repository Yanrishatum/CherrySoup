package imgur;
import haxe.Http;

class OAuth2
{
  public function new()
  {
    
  }
  
  public function getAuthorizationURL():String
  {
    if (ImgurUtils.appId == null) throw "[Imgur OAuth] Application ID not set!";
    return "https://api.imgur.com/oauth2/authorize?client_id=" + ImgurUtils.appId + "&response_type=pin";
  }
  
  public function authorize():String
  {
    if (ImgurUtils.appId == null) throw "[Imgur OAuth] Application ID not set!";
    var url:String = "https://api.imgur.com/oauth2/authorize?client_id=" + ImgurUtils.appId + "&response_type=pin";
    Sys.println("Visit : " + url);
    Sys.println("Enter Imgur authorization PIN: ");
    var pin:String = Sys.stdin().readLine();
    ImgurUtils.userPIN = pin;
    return pin;
  }
  
  private inline function attachDebug(http:Http):Void
  {
    
    if (ImgurUtils.debug)
    {
      http.onError = function(err:String):Void
      {
        Sys.println("OAuth error occured: " + err);
      }
      http.onStatus = function(status:Int):Void
      {
        Sys.println("OAuth status: " + status);
      }
    }
  }
  
  public function renewToken():String
  {
    if (ImgurUtils.refreshToken == null)
    {
      getToken();
    }
    else
    {
      if (ImgurUtils.debug)
        Sys.println("[Imgur OAuth2] Getting new refresh-token...\n  Expiration expected at: " + Date.fromTime(ImgurUtils.tokenExpires).toString() + "\n  Current date: " + Date.now().toString());
      if (ImgurUtils.tokenExpires <= Date.now().getTime())
      {
        if (ImgurUtils.debug) Sys.println("[Imgur OAuth2] Token expired! Requesting new one");
        if (ImgurUtils.appId == null) throw "[Imgur OAuth2] Application ID not set!";
        if (ImgurUtils.appSecret == null) throw "[Imgur OAuth2] Application Secret not set!";
        if (ImgurUtils.refreshToken == null) throw "[Imgur OAuth2] You don't have a refresh token!";
        
        var http:Http = new Http("https://api.imgur.com/oauth2/token");
        attachDebug(http);
        
        http.addParameter("client_id", ImgurUtils.appId);
        http.addParameter("client_secret", ImgurUtils.appSecret);
        http.addParameter("grant_type", "refresh_token");
        http.addParameter("refresh_token", ImgurUtils.refreshToken);
        http.addHeader("Authorization", "Client-ID " + ImgurUtils.appId);
        http.request(true);
        if (ImgurUtils.debug) Sys.println("[Imgur OAuth2] Renew token data: " + http.responseData);
        var response:Dynamic = haxe.Json.parse(http.responseData);
        ImgurUtils.tokenExpires = Date.now().getTime() + response.expires_in;
        ImgurUtils.tokenType = response.tokenType;
        ImgurUtils.userToken = response.access_token;
        ImgurUtils.refreshToken = response.refresh_token;
        ImgurUtils.userName = response.account_username;
        return response;
      }
    }
    return null;
  }
  
  public function getToken():String
  {
    if (ImgurUtils.debug) Sys.println("[Imgur OAuth2] Requesting APP token...");
    if (ImgurUtils.appId == null) throw "[Imgur OAuth2] Application ID not set!";
    if (ImgurUtils.appSecret == null) throw "[Imgur OAuth2] Application Secret not set!";
    if (ImgurUtils.userPIN == null) throw "[Imgur OAuth2] You didn't aquired user PIN for application!";
    
    var http:Http = new Http("https://api.imgur.com/oauth2/token");
    attachDebug(http);
    
    http.addParameter("client_id", ImgurUtils.appId);
    http.addParameter("client_secret", ImgurUtils.appSecret);
    http.addParameter("grant_type", "pin");
    http.addParameter("pin", ImgurUtils.userPIN);
    ImgurUtils.userPIN = null;
    http.addHeader("Authorization", "Client-ID " + ImgurUtils.appId);
    http.request(true);
    if (ImgurUtils.debug) Sys.println("[Imgur OAuth2] Response data: " + http.responseData);
    
    var response:Dynamic = haxe.Json.parse(http.responseData);
    ImgurUtils.tokenExpires = Date.now().getTime() + response.expires_in;
    ImgurUtils.tokenType = response.tokenType;
    ImgurUtils.userToken = response.access_token;
    ImgurUtils.refreshToken = response.refresh_token;
    ImgurUtils.userName = response.account_username;
    ImgurUtils.userId = response.account_id;
    return response;
  }
}