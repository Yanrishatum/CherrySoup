package imgur;
import imgur.ImgurTypes;
import imgur.ImgurUtils;

class Image
{
  public function new()
  {
    
  }
  
  public function get(id:String):ImageType
  {
    var resp:Basic = ImgurUtils.getApi("image/" + id, false);
    if (resp.success) return resp.data;
    return null;
  }
  
  public function uploadURL(url:String, ?album:String, ?name:String, ?title:String, ?description:String):ImageType
  {
    var par:Map<String, Dynamic> = new Map();
    par["image"] = url;
    par["type"] = "URL";
    if (album != null) par["album"] = album;
    if (name != null) par["name"] = name;
    if (title != null) par["title"] = title;
    if (description != null) par["description"] = description;
    
    var resp:Basic = ImgurUtils.getApi("image", true, par);
    if (resp.success) return resp.data;
    return null;
  }
}