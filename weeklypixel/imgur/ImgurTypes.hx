package imgur;

typedef Basic =
{
  var data:Dynamic;
  var success:Bool;
  var status:Int;
}

typedef ErrorData =
{
  var request:String;
  var error:String;
  var method:String;
}

typedef ImageType =
{
  var id:String;
  var title:String;
  var description:String;
  var datetime:Int;
  var type:String;
  var animated:Bool;
  var width:Int;
  var height:Int;
  var size:Int;
  var views:Int;
  var bandwidth:Int; // Owner only
  var deletehash:String; // Owner only
  var name:String;
  var section:String;
  var link:String;
  var gifv:String;  // Only for image/gif type and animation flag.
  var mp4:String;   // image/gif + animated
  var mp4_size:Int; // image/gif + animated
  var looping:Bool; // image/gif + animated
  var favorite:Bool;
  var nsfw:Bool;
  var vote:String;
  var in_gallery:Bool;
  var account_id:Int; // ???
  var account_url:String; // ???
}

typedef NewAlbumType =
{
  var id:String;
  var deletehash:String;
}

typedef AlbumType =
{
  var id:String;
  var title:String;
  var description:String;
  var datetime:Int;
  var cover:String;
  var cover_width:Int;
  var cover_height:Int;
  var account_url:String;
  var account_id:String;
  var privacy:String;
  var layout:String;
  var views:Int;
  var link:String;
  var favorite:Bool;
  var nsfw:Bool;
  var section:String;
  var order:Int;
  var deletehash:String;
  var images_count:Int;
  var images:Array<ImageType>;
  var in_gallery:Bool;
}