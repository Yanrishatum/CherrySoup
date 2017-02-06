package imgur;
import imgur.ImgurTypes;

class Album
{
  
  public function new() {}
  
  public function create(title:String = null, description:String = null, privacy:String = null, layout:String = null,
    ids:Array<String> = null, cover:String = null):NewAlbumType
  {
    var pars:Map<String, Dynamic> = new Map();
    if (title != null) pars.set("title", title);
    if (description != null) pars.set("description", description);
    if (privacy != null) pars.set("privacy", privacy);
    if (layout != null) pars.set("layout", layout);
    if (ids != null) pars.set("ids", ids);
    if (cover != null) pars.set("cover", cover);
    var resp:Basic = ImgurUtils.getApi("album", "POST", pars);
    if (resp.success) return resp.data;
    else return null;
  }
  
}