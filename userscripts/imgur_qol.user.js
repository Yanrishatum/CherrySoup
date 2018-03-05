// ==UserScript==
// @name         Imgur: QOL
// @namespace    http://yanrishatum.ru/
// @version      0.1
// @description  Quality of life improvements for Imgur
// @author       Yanrishatum
// @match        *://imgur.com/gallery/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  var putAside = true; // Move the post header to the side when scrolling.
  var fitTallVideos = true; // Limit video size to screen vertical height if it's too tall.
  var smoothScroll = true; // Use JS for smooth scrolling. (Element.scrollIntoView doesn't work well because how Imgur works with images)
  
  // Hotkeys
  var shiftMod = false;
  var ctrlMod = false;
  var altMod = false;
  var nextImage = "PageDown";
  var prevImage = "PageUp";
  
  var cssText = ".post-header { transition: all 0.5s ease, opacity 0.2s; transform-origin: left top; }  .post-header.fixed:hover { opacity: 1.0; } ";
  
  if (putAside) cssText += ".post-header.fixed { transform: rotateZ(90deg); opacity: 0.2; z-index: 0; } .comment-votes { padding-left: 20px; } ";
  else cssText += ".post-header.fixed { opacity: 0.1; } ";
  if (fitTallVideos) cssText += ".post-image video { min-height: initial !important; max-height: 100vh; }";
  
  var css = document.createElement("style");
  css.textContent = cssText;
  document.head.appendChild(css);
  
  var scrollFrame;
  var scrollTarget;
  var scrollStamp;
  var scrollSpeed = 4000;
  function scrollToImage(el, mode)
  {
    scrollTarget = el;
    var y = el.getBoundingClientRect().y;
    if (smoothScroll && y != 0)
    {
      scrollStamp = 0;
      scrollSpeed = Math.abs(y) * 4;
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(smoothScrollFrame);
    }
    else
    {
      el.scrollIntoView({ behavior: (mode || "instant"), block: "start", "inline": "start" });
    }
  }
  
  function smoothScrollFrame(timestamp)
  {
    if (!scrollStamp) scrollStamp = timestamp;
    var delta = (timestamp - scrollStamp) / 1000;
    scrollStamp = timestamp;
    var offset = scrollTarget.getBoundingClientRect().y;
    var aoff = Math.abs(offset);
    
    var shift = delta * scrollSpeed;
    if (aoff < 100 && aoff > 2) shift *= aoff / 100;
    if (shift < 1) shift = 1;
    //console.log(offset, shift, scrollSpeed, delta);
    if (shift > aoff)
    {
      window.scrollBy(0, offset);
      scrollTarget = null;
      cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
    }
    else
    {
      window.scrollBy(0, offset > 0 ? shift : -shift);
      scrollFrame = requestAnimationFrame(smoothScrollFrame);
    }
  }
  
  function keyHandler(e)
  {
    if (e.shiftKey != shiftMod || e.ctrlKey != ctrlMod || e.altKey != altMod) return;
    if (e.code == nextImage)
    {
      var images = $(".post-images .post-image-container");
      for (var i = 0; i < images.length; i++)
      {
        if (images[i].getBoundingClientRect().y > 1)
        {
          if (scrollTarget == images[i] && images[i].nextElementSibling) scrollToImage(images[i].nextElementSibling);
          else scrollToImage(images[i]);
          e.preventDefault();
          break;
        }
      }
    }
    else if (e.code == prevImage && document.querySelector(".post-action").getBoundingClientRect().y >= 0)
    {
      var images = $(".post-images .post-image-container");
      for (var i = images.length - 1; i >= 0; i--)
      {
        var box = images[i].getBoundingClientRect()
        if (box.y < -1)
        {
          if (scrollTarget == images[i] && images[i].previousElementSibling) scrollToImage(images[i].previousElementSibling);
          else scrollToImage(images[i]);
          e.preventDefault();
          break;
        }
      }
    }
    else if (e.code == "ArrowDown" || e.code == "ArrowUp")
    {
      scrollCancel();
    }
    else if (e.code == "Home")
    {
      if (document.querySelector("#comments-container").getBoundingClientRect().y < 0)
      {
        scrollToImage(document.querySelector("#comments-container"), "instant");
        e.preventDefault();
      }
      else
      {
        scrollCancel();
      }
    }
    else if (e.code == "End")
    {
      if (document.querySelector("#comments-container").getBoundingClientRect().y > 0)
      {
        scrollToImage(document.querySelector("#comments-container"), "instant");
        e.preventDefault();
      }
      else
      {
        scrollCancel();
      }
    }
  }
  
  function scrollCancel()
  {
    if (scrollFrame)
    {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
      scrollTarget = null;
    }
  }
  
  window.addEventListener("keydown", keyHandler);
  if (smoothScroll) window.addEventListener("wheel", scrollCancel);
  
  
})();