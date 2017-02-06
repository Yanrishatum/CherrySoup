package imgur;
import imgur.ImgurTypes;
import imgur.ImgurUtils;
using imgur.ImgurUtils;

class Gallery
{
  public function new() {}
  
  public function shareAlbum(id:String, title:String, ?topic:String, terms:Bool = false, mature:Bool = false)
  {
    return share("gallery/album/" + id, title, topic, terms, mature);
  }
  
  public function shareImage(id:String, title:String, ?topic:String, terms:Bool = false, mature:Bool = false)
  {
    return share("gallery/image/" + id, title, topic, terms, mature);
  }
  
  private inline function share(path:String, title:String, ?topic:String, terms:Bool, mature:Bool):Bool
  {
    var pars:Map<String, String> = new Map();
    pars.set("title", title);
    pars.setParam("topic", topic);
    pars.setBool("terms", terms, "1");
    pars.setBool("mature", mature, "1");
    
    var basic:Basic = ImgurUtils.getApi(path, "POST", pars);
    return basic.success;
  }
  
  public function remove(id:String):Bool
  {
    var basic:Basic = ImgurUtils.getApi("gallery/" + id, "DELETE");
    return basic.success;
  }
}