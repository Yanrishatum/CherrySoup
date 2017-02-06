package imgur;
import haxe.io.Bytes;
import imgur.ImgurTypes;
import imgur.ImgurUtils;
using imgur.ImgurUtils;

class Image
{
  public function new() { }
  
  /** Get information about an image. **/
  public function get(id:String):ImageType
  {
    var resp:Basic = ImgurUtils.getApi("image/" + id);
    if (resp.success) return resp.data;
    return null;
  }
  
  /**
   * Upload a new image via URL.
   * @param url         URL for an image to upload.
   * @param album       The id of the album you want to add the image to. For anonymous albums, {album} should be the deletehash that is returned at creation.
   * @param name        The name of the file.
   * @param title       The title of the image.
   * @param description The description of the image.
   */
  public function uploadURL(url:String, ?album:String, ?name:String, ?title:String, ?description:String):ImageType
  {
    return upload(url, "URL", album, name, title, description);
  }
  
  /**
   * Upload a new image via Bytes.
   * @param bytes       Image data.
   * @param album       The id of the album you want to add the image to. For anonymous albums, {album} should be the deletehash that is returned at creation.
   * @param name        The name of the file.
   * @param title       The title of the image.
   * @param description The description of the image.
   */
  public function uploadBytes(bytes:Bytes, ?album:String, ?name:String, ?title:String, ?description:String):ImageType
  {
    return upload(bytes, "file", album, name, title, description);
  }
  
  /**
   * Upload a new image via Base64 encoded data.
   * @param data        Base64-encoded image data.
   * @param album       The id of the album you want to add the image to. For anonymous albums, {album} should be the deletehash that is returned at creation.
   * @param name        The name of the file.
   * @param title       The title of the image.
   * @param description The description of the image.
   */
  public function uploadBase64(data:String, ?album:String, name:String, ?title:String, ?description:String):ImageType
  {
    return upload(data, "base64", album, name, title, description);
  }
  
  private inline function upload(data:Dynamic, type:String, album:String, name:String, title:String, description:String):ImageType
  {
    var par:Map<String, Dynamic> = new Map();
    par.set("image", data);
    par.set("type", type);
    par.setParam("album", album);
    par.setParam("name", name);
    par.setParam("title", title);
    par.setParam("description", description);
    
    return ImgurUtils.getApiFromBasic("image", "POST", par);
  }
  
  /** Deletes an image. For an anonymous image, {id} must be the image's deletehash. If the image belongs to your account then passing the ID of the image is sufficient. **/
  public function delete(idOrDeletehash:String):Bool
  {
    var basic:Basic = ImgurUtils.getApi("image/" + idOrDeletehash, "DELETE");
    return basic.success;
  }
  
  /** Updates the title or description of an image. You can only update an image you own and is associated with your account. For an anonymous image, {id} must be the image's deletehash. **/
  public function update(idOrDeletehash:String, ?title:String, ?description:String):Bool
  {
    var pars:Map<String, String> = new Map();
    pars.setParam("title", title);
    pars.setParam("description", description);
    
    var basic:Basic = ImgurUtils.getApi("image/" + idOrDeletehash, "POST", pars);
    return basic.success;
  }
  
  /** Favorite an image with the given ID. The user is required to be logged in to favorite the image. **/
  public function favorite(id:String):Bool
  {
    ImgurUtils.checkUserToken();
    var basic:Basic = ImgurUtils.getApi("image/" + id + "/favorite", "POST");
    return basic.success;
  }
  
}