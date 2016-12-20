import { StyleLayerIndex } from '../../src/style/style_layer_index';
import { Ajax } from '../../src/util/ajax';
import { StyleLayer } from '../../src/style/style_layer';
import deref = require('mapbox-gl-style-spec/lib/deref');

(() => {
  const inputElement = <HTMLInputElement>(document.getElementById('inputElem'));
  const btnElement = document.getElementById('btn');
  const contentDiv = document.getElementById('content');

  btnElement.addEventListener('click', function () {
    Ajax.getJSON(inputElement.value, (err, stylesheet) => {
      if (err) {
        console.warn(err);
        return;
      }

      const layers = deref(stylesheet.layers);

      const order = layers.map((layer) => layer.id);

      let _layers = {};
      for (let layer of layers) {
        layer = StyleLayer.create(layer);
        _layers[layer.id] = layer;
      }

      const serializedLayers = order.map((id) => _layers[id].serialize());
      const layerIndex = new StyleLayerIndex();
      layerIndex.replace(serializedLayers);
      refresh(layerIndex, layers[1].source);
    });
  });

  function refresh(layerIndex: StyleLayerIndex, sourceId: string) {
    contentDiv.innerHTML = '';
    const layerFamilies = layerIndex.familiesBySource[sourceId];
    for (const sourceLayerId in layerFamilies) {
      let node = document.createElement('div');
      node.innerHTML = `source layer id: ${sourceLayerId}`;
      contentDiv.appendChild(node);
      let ul = document.createElement('ul');
      for (const family of layerFamilies[sourceLayerId]) {
        for (const layer of family) {
          let li = document.createElement('li');
          li.innerHTML = `id: ${layer.id}, type: ${layer.type}`;
          ul.appendChild(li);
        }
      }
      contentDiv.appendChild(ul);
    }
  }
})();