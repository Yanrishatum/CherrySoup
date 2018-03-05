// ==UserScript==
// @name         Better Steam Broadcasting
// @namespace    http://yanrishatum.ru/
// @version      0.1
// @description  Improved steam broadcasting page. For teh minimalism.
// @author       Yanrishatum
// @match        http://steamcommunity.com/broadcast/watch/*
// @grant        none
// ==/UserScript==
/* jshint -W097 */
'use strict';

function delCrap(el)
{
  var has = el.querySelector("#PageContents");
  if (has)
  {
    for (var i = 0; i < el.children.length; i++)
    {
      if (el.children[i].id != "PageContents") delCrap(el.children[i]);
    }
  }
  else
  {
    el.parentElement.removeChild(el);
  }
}
// broadcast row shadow
delCrap(document.body);

var css = "#video_content { margin-left: 0px; margin-right: 0px; } #ChatWindow { margin-right: 0px; height: 100vh; } .pagecontent.no_header { padding: 0 !important; } .BroadcastInfoWrapper,.BroadcastRowShadow { display: none; }\
#ChatWindow.horizontal { width: 100vw; height: 320px; bottom: 0; right: 0; left: 0; top: initial; } .MinimizedChat #video_content { padding-right: 0px; } .ChatAndVideoContainer,#video_wrapper { height: 100vh; }\
#video_wrapper { display: flex; }";
var style = document.createElement("style");
style.innerHTML = css;
document.head.appendChild(style);

var btn = document.querySelector("#ChatViewersBtn");
btn.removeAttribute("onclick");
btn.addEventListener("click", function() {
  if (document.querySelector("#ViewerModal").style.display == "none")
    BroadcastWatch.ShowViewers();
  else BroadcastWatch.CloseViewers();
});

/*
var content = document.querySelector("#video_content");
content.style.marginLeft = "0px";
content.style.marginRight = "0px";
content = document.querySelector("#ChatWindow");
content.style.marginRight = "0px";
document.querySelector(".pagecontent").style.paddingTop = "0px";
*/