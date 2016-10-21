/* eslint-disable openlayers-internal/no-unused-requires */

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.MVT');
goog.require('ol.layer.VectorTile');
goog.require('ol.source.VectorTile');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
goog.require('ol.tilegrid');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var layerVT, selectedId, hoveredId, hoveredFeature;


var myStyle =  new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'blue',
    width: 3
  }),
  fill: new ol.style.Fill({
    color: 'rgba(0, 0, 255, 0.1)'
  })
});

var selectStyle = new ol.style.Style({
  zIndex: 1,
  fill: new ol.style.Fill({
    color: 'red'
  }),
  stroke: new ol.style.Stroke({
    color: 'yellow',
    width: 2
  })
});

var hoverStyle = new ol.style.Style({
  zIndex: 1,
  fill: new ol.style.Fill({
    color: 'pink'
  }),
  stroke: new ol.style.Stroke({
    color: 'black',
    width: 2
  })
});

var createChloroplethStyle = function(percent) {
  var style =  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'blue',
      width: 3
    }),
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 255, ' + (percent * (0.8 - 0.2) + 0.2) + ')'
    })
  });
  return style; 
}

// pre-generate all styles for better vt performance
var chloropleths = [];
for (i = 0; i < 10; i++) { 
    chloropleths.push(createChloroplethStyle(i*0.1));
}
console.log(chloropleths);

var styleFunction = function(feature, resolution) {
  //TODO: use accessor for properties
  if (feature.properties_.id == hoveredId) {
    return hoverStyle;
  } else if (feature.properties_.id == selectedId) {
    return selectStyle;
  } else  {
    return chloropleths[feature.properties_.id%10];//Math.floor(Math.random() * 10)
  }
};

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),  
    ( layerVT = new ol.layer.VectorTile({
      source: new ol.source.VectorTile({
        attributions: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
          '© <a href="http://www.openstreetmap.org/copyright">' +
          'OpenStreetMap contributors</a>',
        format: new ol.format.MVT(),
        tileGrid: ol.tilegrid.createXYZ({minZoom: 1, maxZoom: 13}),
        tilePixelRatio: 16,
        //url: 'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token=' + key
        url: 'https://s3.amazonaws.com/nets-vectortile/v4/{z}/{x}/{y}.pbf'
      }),
      style: styleFunction
    }))
  ],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

// ol.style.Fill, ol.style.Icon, ol.style.Stroke, ol.style.Style and
// ol.style.Text are required for createMapboxStreetsV6Style()


map.on('singleclick', function(e) {
  selectedId = map.forEachFeatureAtPixel(e.pixel, function(feature) {
    return feature.properties_.id;
  });
  layerVT.changed();
}, undefined, function(l) { return l == layerVT; });

// select interaction working on "pointermove"
//map.addInteraction(new ol.interaction.Select({
//  condition: ol.events.condition.pointerMove
//}));


map.on("pointermove", function(event) {
  var featureId = map.forEachFeatureAtPixel(event.pixel, function(feature) {
      return feature? feature.properties_.id: null;
  });

  if (featureId !== hoveredId) {
    hoveredId = featureId;
    layerVT.changed();
  }
});

