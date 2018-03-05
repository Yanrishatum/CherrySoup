function initNodeEngine(editor, nodeTemplate, values)
{
  // value: element
  var stringSocket = new D3NE.Socket("string", "String value", "hint");
  var arraySocket = new D3NE.Socket("array", "Array value", "hint");
  // var numberSocket = new D3NE.Socket("number", "Number value", "hint");
  var elementSocket = new D3NE.Socket("element", "HTML Element value", "hint");
  var boolSocket = new D3NE.Socket("boolean", "Boolean value", "hint");
  var anySocket = new D3NE.Socket("object", "Any value", "hint");
  anySocket.combineWith(stringSocket);
  anySocket.combineWith(arraySocket);
  anySocket.combineWith(elementSocket);
  anySocket.combineWith(boolSocket);
  stringSocket.combineWith(anySocket);
  arraySocket.combineWith(anySocket);
  elementSocket.combineWith(anySocket);
  boolSocket.combineWith(anySocket);
  
  var components = [];
  var menu = {};
  function addComponent(name, menuPath, data)
  {
    data.template = nodeTemplate;
    var comp = new D3NE.Component(name, data);
    components.push(comp);
    var path = menuPath.split(".");
    var pathNode = menu;
    var last = path.pop();
    while (path.length)
    {
      var pathPart = path.shift();
      if (pathNode[pathPart]) pathNode = pathNode[pathPart];
      else pathNode = (pathNode[pathPart] = {});
    }
    pathNode[last] = comp;
  }
  
  // Components: Values
  addComponent("Get Feed Document", "Inputs.Get Document", {
    builder(node)
    {
      var valOut = new D3NE.Output("Element", elementSocket);
      return node.addOutput(valOut);
    },
    worker(node, inputs, outputs, values)
    {
      outputs[0] = (typeof values.xml) == "string" ? null : values.xml;
    }
  });
  
  addComponent("Get Feed String", "Inputs.Get Feed String", {
    builder(node)
    {
      var valOut = new D3NE.Output("String", stringSocket);
      return node.addOutput(valOut);
    },
    worker(node, inputs, outputs, values)
    {
      outputs[0] = (typeof values.xml) == "string" ? values.xml : null;
    }
  });
  
  addComponent("Get Feed Root", "Inputs.Get Root", {
    builder(node)
    {
      var valOut = new D3NE.Output("Element", elementSocket);
      return node.addOutput(valOut);
    },
    worker(node, inputs, outputs, values)
    {
      outputs[0] = values.root;
    }
  });
  
  addComponent("Get Feed URL", "Inputs.Get Feed URL", {
    builder(node)
    {
      var valOut = new D3NE.Output("String", stringSocket);
      return node.addOutput(valOut);
    },
    worker(node, inputs, outputs, values)
    {
      outputs[0] = values.defURL;
    }
  });
  
  addComponent("Get Feed Item", "Inputs.Get Feed Item", {
    builder(node)
    {
      var valOut = new D3NE.Output("Element", elementSocket);
      return node.addOutput(valOut);
    },
    worker(node, inputs, outputs, values)
    {
      outputs[0] = values.item;
    }
  });
  
  addComponent("Set Root Item", "Outputs.Set Root", {
    builder(node)
    {
      var valOut = new D3NE.Input("Element", elementSocket);
      return node.addInput(valOut);
    },
    worker(node, inputs, outputs, values)
    {
      if (inputs[0][0])
        values.root = inputs[0][0];
    }
  });
  
  addComponent("Set Feed URL", "Outputs.Set Feed URL", {
    builder(node)
    {
      var valOut = new D3NE.Input("String", stringSocket);
      return node.addInput(valOut);
    },
    worker(node, inputs, outputs, values)
    {
      if (inputs[0][0])
        values.url = inputs[0][0];
    }
  });
  
  addComponent("Set Feed Title", "Outputs.Set Feed Title", {
    builder(node)
    {
      var valOut = new D3NE.Input("String", stringSocket);
      return node.addInput(valOut);
    },
    worker(node, inputs, outputs, values)
    {
      if (inputs[0][0])
        values.title = inputs[0][0];
    }
  });
  
  addComponent("Set Items", "Outputs.Set Items", {
    builder(node)
    {
      var valOut = new D3NE.Input("Element[]", arraySocket);
      return node.addInput(valOut);
    },
    worker(node, inputs, outputs, values)
    {
      if (inputs[0][0])
        values.items = inputs[0][0];
    }
  });
  
  addComponent("Set Item", "Outputs.Set Item", {
    builder(node)
    {
      var valTitle = new D3NE.Input("Title", stringSocket);
      var valDate = new D3NE.Input("Date", stringSocket);
      var valContent = new D3NE.Input("Content", stringSocket);
      var valURL = new D3NE.Input("URL", stringSocket);
      return node
        .addInput(valTitle)
        .addInput(valDate)
        .addInput(valContent)
        .addInput(valURL);
    },
    worker(node, inputs, outputs, values)
    {
      if (inputs[0][0] && inputs[1][0] && inputs[2][0] && inputs[3][0])
        values.result = {
          title: inputs[0][0],
          date: inputs[1][0],
          content: inputs[2][0],
          link: inputs[3][0]
        };
    }
  });
  
  addComponent("Is Compatible", "Outputs.Set Compatible", {
    builder(node)
    {
      var valOut = new D3NE.Input("Boolean", boolSocket);
      return node.addInput(valOut);
    },
    worker(node, inputs, outputs, values)
    {
      if (inputs[0][0] !== undefined)
        values.compatible = inputs[0][0];
    }
  });
  
  // Components: Processor
  addComponent("Query Selector", "Element.Query Selector", {
    builder(node)
    {
      var elIn = new D3NE.Input("Element", elementSocket);
      var elOut = new D3NE.Output("Element", elementSocket);
      var arrOut = new D3NE.Output("Element[]", arraySocket);
      
      var typeControl = new D3NE.Control("<label><input type='checkbox'>Select all</label>", (el, control) =>
      {
        var inp = el.querySelector("input")
        inp.addEventListener("change", (e) =>
        {
          control.putData("all", e.currentTarget.checked);
        });
        inp.checked = control.getData("all");
        // control.putData("all", 
      });
      
      var selectorControl = new D3NE.Control("<input>", (el, control) =>
      {
        el.value = control.getData("query") || "";
        el.addEventListener("change", () =>
        {
          control.putData("query", el.value);
        });
      });
      
      return node
        .addInput(elIn)
        .addOutput(elOut)
        .addOutput(arrOut)
        .addControl(typeControl)
        .addControl(selectorControl);
    },
    worker(node, inputs, outputs)
    {
      if (!inputs[0][0] || !node.data.query)
      {
        outputs[0] = null;
        outputs[1] = null;
        return;
      }
      if (node.data.all)
      {
        outputs[0] = null;
        outputs[1] = inputs[0][0].querySelectorAll(node.data.query);
      }
      else
      {
        outputs[0] = inputs[0][0].querySelector(node.data.query);
        outputs[1] = null;
      }
    }
  });
  
  addComponent("Get Attribute", "Element.Get Attribute", {
    builder(node)
    {
      var elIn = new D3NE.Input("Element", elementSocket);
      var elOut = new D3NE.Output("String", stringSocket);
      
      var selectorControl = new D3NE.Control("<input>", (el, control) =>
      {
        el.value = control.getData("attribute") || "";
        el.addEventListener("change", () =>
        {
          control.putData("attribute", el.value);
        });
      });
      
      return node
        .addInput(elIn)
        .addOutput(elOut)
        .addControl(selectorControl);
    },
    worker(node, inputs, outputs)
    {
      if (!inputs[0][0] || !node.data.attribute)
      {
        outputs[0] = null;
        return;
      }
      outputs[0] = inputs[0][0].getAttribute(node.data.attribute);
    }
  });
  
  addComponent("Get Field", "Element.Get Field", {
    builder(node)
    {
      var elIn = new D3NE.Input("Element", elementSocket);
      var elOut = new D3NE.Output("String", stringSocket);
      
      var selectorControl = new D3NE.Control("<input>", (el, control) =>
      {
        el.value = control.getData("attribute") || "";
        el.addEventListener("change", () =>
        {
          control.putData("attribute", el.value);
        });
      });
      
      return node
        .addInput(elIn)
        .addOutput(elOut)
        .addControl(selectorControl);
    },
    worker(node, inputs, outputs)
    {
      if (!inputs[0][0] || !node.data.attribute)
      {
        outputs[0] = null;
        return;
      }
      outputs[0] = inputs[0][0][node.data.attribute];
    }
  });
  
  addComponent("Set Field", "Element.Set Field", {
    builder(node)
    {
      var elVal = new D3NE.Input("Value", anySocket);
      var elEl = new D3NE.Input("Element", elementSocket);
      var elOut = new D3NE.Output("Element", elementSocket);
      
      var selectorControl = new D3NE.Control("<input>", (el, control) =>
      {
        el.value = control.getData("attribute") || "";
        el.addEventListener("change", () =>
        {
          control.putData("attribute", el.value);
        });
      });
      
      return node
        .addInput(elVal)
        .addInput(elEl)
        .addOutput(elOut)
        .addControl(selectorControl);
    },
    worker(node, inputs, outputs)
    {
      outputs[0] = inputs[1][0];
      if (!inputs[0][0] || !inputs[1][0] || !node.data.attribute)
      {
        return;
      }
      inputs[1][0][node.data.attribute] = inputs[0][0];
    }
  });
  
  addComponent("Get Text Content", "Element.Get Text Content", {
    builder(node)
    {
      var elIn = new D3NE.Input("Element", elementSocket);
      var elOut = new D3NE.Output("String", stringSocket);
      
      return node
        .addInput(elIn)
        .addOutput(elOut);
    },
    worker(node, inputs, outputs)
    {
      if (!inputs[0][0])
      {
        outputs[0] = null;
        return;
      }
      outputs[0] = inputs[0][0].textContent;
    }
  });
  
  addComponent("Get Inner HTML", "Element.Get Inner HTML", {
    builder(node)
    {
      var elIn = new D3NE.Input("Element", elementSocket);
      var elOut = new D3NE.Output("String", stringSocket);
      
      return node
        .addInput(elIn)
        .addOutput(elOut);
    },
    worker(node, inputs, outputs)
    {
      if (!inputs[0][0])
      {
        outputs[0] = null;
        return;
      }
      outputs[0] = inputs[0][0].innerHTML;
    }
  });
  
  addComponent("Get Outer HTML", "Element.Get Outer HTML", {
    builder(node)
    {
      var elIn = new D3NE.Input("Element", elementSocket);
      var elOut = new D3NE.Output("String", stringSocket);
      
      return node
        .addInput(elIn)
        .addOutput(elOut);
    },
    worker(node, inputs, outputs)
    {
      if (!inputs[0][0])
      {
        outputs[0] = null;
        return;
      }
      outputs[0] = inputs[0][0].outerHTML;
    }
  });
  
  // Other
  
  addComponent("Convert", "Other.Convert", {
    builder(node)
    {
      var elIn = new D3NE.Input("Input", anySocket);
      var elOut = new D3NE.Output("Output", anySocket);
      return node
        .addInput(elIn)
        .addOutput(elOut);
    },
    worker(node, inputs, outputs)
    {
      outputs[0] = inputs[0][0];
    }
  });
  
  addComponent("Eval", "Other.Eval", {
    builder(node)
    {
      var elIn = new D3NE.Input("Inputs", anySocket);
      elIn.multipleConnections = true;
      var elOut0 = new D3NE.Output("Output.0", anySocket);
      var elOut1 = new D3NE.Output("Output.1", anySocket);
      var elOut2 = new D3NE.Output("Output.2", anySocket);
      var elOut3 = new D3NE.Output("Output.3", anySocket);
      var elOut4 = new D3NE.Output("Output.4", anySocket);
      
      var stringControl = new D3NE.Control("<textarea>", (el, control) =>
      {
        el.value = control.getData("eval") || "";
        el.addEventListener("change", (e) =>
        {
          control.putData("eval", el.value);
        });
        el.addEventListener("mousedown", (e) =>
        {
          e.stopPropagation();
        });
      });
      return node
        .addInput(elIn)
        .addOutput(elOut0)
        .addOutput(elOut1)
        .addOutput(elOut2)
        .addOutput(elOut3)
        .addOutput(elOut4)
        .addControl(stringControl);
    },
    worker(node, inputs, outputs)
    {
      function getInput(id)
      {
        return inputs[0][id];
      }
      function setOutput(id, val)
      {
        outputs[id] = val;
      }
      // TODO: A bit safer eval
      eval(node.data.eval);
    }
  });
  
  addComponent("Regex test", "String.Regex Test", {
    builder(node)
    {
      var elIn = new D3NE.Input("String", stringSocket);
      var elOut = new D3NE.Output("Boolean", boolSocket);
      
      var typeControl = new D3NE.Control("<label><input type='checkbox'>Ignore case</label>", (el, control) =>
      {
        var inp = el.querySelector("input")
        inp.addEventListener("change", (e) =>
        {
          control.putData("ignoreCase", e.currentTarget.checked);
        });
        inp.checked = control.getData("ignoreCase");
      });
      
      var selectorControl = new D3NE.Control("<input>", (el, control) =>
      {
        el.value = control.getData("reg") || "";
        el.addEventListener("change", () =>
        {
          control.putData("reg", el.value);
        });
      });
      
      return node
        .addInput(elIn)
        .addOutput(elOut)
        .addControl(typeControl)
        .addControl(selectorControl);
    },
    worker(node, inputs, outputs)
    {
      if (!inputs[0][0] || !node.data.reg)
      {
        outputs[0] = null;
        return;
      }
      var reg = new RegExp(node.data.reg, node.data.ignoreCase ? "i" : "");
      outputs[0] = reg.test(inputs[0][0]);
    }
  });
  
  // Debug
  addComponent("Display String", "Debug.String", {
    builder(node)
    {
      var elIn = new D3NE.Input("String", anySocket);
      var display = new D3NE.Control("<div class='debug-display'></div>", (el, control) =>
      {
        control.setValue = val => {
           el.textContent = val;
        };
      });
      
      return node
        .addInput(elIn)
        .addControl(display);
    },
    worker(node, inputs, outputs)
    {
      var val = inputs[0][0] || "";
      editor.nodes.find(n => n.id == node.id).controls[0].setValue(val);
      // outputs[0] = inputs[0][0].outerHTML;
    }
  });
  
  addComponent("Console Output", "Debug.Console Output", {
    builder(node)
    {
      var elAny = new D3NE.Input("Data", anySocket);
      elAny.multipleConnections = true;
      
      return node
        .addInput(elAny);
    },
    worker(node, inputs, outputs)
    {
      if (inputs[0].connections.length == 0) return;
      for (var i = 0; i < inputs[0].length; i++)
      {
          console.log(inputs[0][i]);
      }
    }
  });
  
  var engine = new D3NE.Engine("graphParser@0.1.0", components);
  
  if (editor)
  {
    var menu = new D3NE.ContextMenu(menu);
    
    editor = new D3NE.NodeEditor("graphParser@0.1.0", editor, components, menu);
    
    var vals = values || {};
    
    editor.eventListener.on("change", async function() {
      await engine.abort();
      await engine.process(editor.toJSON(), null, vals);
    });
    return { engine: engine, editor: editor };
  }
  return engine;
}

// isCompatible(xml):
//   compatible
// getRoot(xml):
//   root
// getFeedTitle(root):
//   title
// getFeedURL(root, def): // def = defURL
//   url
// getItems(root):
//   items
// getInfo(item):
//   title
//   date
//   content
//   link