declare namespace MapBoxGL {
  export interface Style {
    /**
     * Style specification version number.
     *
     * @type {number}
     * @memberOf MapBoxStyle
     */
    version: number;
    /**
     * A human-readable name for the style.
     *
     * @type {string}
     * @memberOf MapBoxStyle
     */
    name?: string;
    /**
     * Arbitrary properties useful to track with the stylesheet, but do not influence
     * rendering. Properties should be prefixed to avoid collisions, like 'mapbox:'.
     *
     * @type {*}
     * @memberOf MapBoxStyle
     */
    metadata?: any;
    /**
     * Default map center in longitude and latitude. The style center will be used
     * only if the map has not been positioned by other means (e.g. map options or user interaction).
     *
     * @type {number[]}
     * @memberOf MapBoxStyle
     */
    center?: number[];
    /**
     * Default zoom level. The style zoom will be used only if the map has not been
     * positioned by other means (e.g. map options or user interaction).
     *
     * @type {number}
     * @memberOf MapBoxStyle
     */
    zoom?: number;
    /**
     * Default bearing, in degrees clockwise from true north. The style bearing
     * will be used only if the map has not been positioned by other means (e.g. map options or user interaction).
     * Units in degrees. Defaults to 0.
     * @type {number}
     * @memberOf MapBoxStyle
     */
    bearing?: number;
    /**
     * Default pitch, in degrees. Zero is perpendicular to the surface, for a look
     * straight down at the map, while a greater value like 60 looks ahead towards
     * the horizon. The style pitch will be used only if the map has not been positioned
     * by other means (e.g. map options or user interaction).
     * Units in degrees. Defaults to 0.
     * @type {number}
     * @memberOf MapBoxStyle
     */
    pitch?: number;
    /**
     * The global light source.
     *
     * @memberOf MapBoxStyle
     */
    light?: Light;
    /**
     * Data source specifications.
     *
     * @type {{[key: string] : StyleSource}}
     * @memberOf MapBoxStyle
     */
    sources: {[key: string] : Source};
    /**
     * A base URL for retrieving the sprite image and metadata. The extensions
     * .png, .json and scale factor @2x.png will be automatically appended.
     * This property is required if any layer uses the background-pattern,
     * fill-pattern, line-pattern, fill-extrusion-pattern, or icon-image properties.
     *
     * @type {string}
     * @memberOf MapBoxStyle
     */
    sprite?: string;
    /**
     * A URL template for loading signed-distance-field glyph sets in PBF format.
     * The URL must include {fontstack} and {range} tokens. This property is required
     * if any layer uses the text-field layout property.
     *
     * @type {string}
     * @memberOf MapBoxStyle
     */
    glyphs?: string;
    /**
     * A global transition definition to use as a default across properties.
     *
     * @memberOf MapBoxStyle
     */
    transition?: Transition;
    /**
     * Layers will be drawn in the order of this array.
     *
     * @type {Layer[]}
     * @memberOf MapBoxStyle
     */
    layers: Layer[];
  }

  /**
   * Sources supply data to be shown on the map.
   * Adding a source won't immediately make data appear on the map because sources
   * don't contain styling details like color or width. Layers refer to a source and
   * give it a visual representation. This makes it possible to style the same source
   * in different ways, like differentiating between types of roads in a highways layer.
   * @export
   * @interface Source
   */
  export interface Source {
    type: string;
  }

  export interface TileSource extends Source{
    type: 'vector' | 'raster';
    /**
     * A URL to a TileJSON resource. Supported protocols are http:, https:, and mapbox://<mapid>.
     *
     * @type {string}
     * @memberOf TileSource
     */
    url?: string;
    /**
     * An array of one or more tile source URLs, as in the TileJSON spec.
     *
     * @type {string[]}
     * @memberOf TileSource
     */
    tiles?: string[];
    /**
     * Minimum zoom level for which tiles are available, as in the TileJSON spec.
     * Defaults to 0.
     * @type {number}
     * @memberOf TileSource
     */
    minzoom?: number;
    /**
     * Maximum zoom level for which tiles are available, as in the TileJSON spec.
     * Data from tiles at the maxzoom are used when displaying the map at higher zoom levels.
     * Defaults to 22.
     * @type {number}
     * @memberOf TileSource
     */
    maxzoom?: number;
    /**
     * The minimum visual size to display tiles for this layer. Only configurable for raster layers.
     * Defaults to 512. Units in pixels.
     * @type {number}
     * @memberOf TileSource
     */
    tileSize?: number;
  }

  /**
   * A GeoJSON source. Data must be provided via a "data" property, whose value can be a URL or inline GeoJSON.
   *
   * @export
   * @interface GeoJSONSource
   * @extends {Source}
   */
  export interface GeoJSONSource extends Source {
    type: 'geojson';
    /**
     * A URL to a GeoJSON file, or inline GeoJSON.
     *
     * @type {*}
     * @memberOf GeoJSONSource
     */
    data: any;
    /**
     * Maximum zoom level at which to create vector tiles (higher means greater detail at high zoom levels).
     * Defaults to 18.
     * @type {number}
     * @memberOf GeoJSONSource
     */
    maxzoom?: number;
    /**
     * Size of the tile buffer on each side. A value of 0 produces no buffer. A value of 512
     * produces a buffer as wide as the tile itself. Larger values produce fewer rendering
     * artifacts near tile edges and slower performance.
     * Defaults to 128. Minimum is 0 and maximum is 512.
     * @type {number}
     * @memberOf GeoJSONSource
     */
    buffer?: number;
    /**
     * Douglas-Peucker simplification tolerance (higher means simpler geometries and faster performance).
     * Defaults to 0.375.
     * @type {number}
     * @memberOf GeoJSONSource
     */
    tolerance?: number;
    /**
     * If the data is a collection of point features, setting this to true clusters the points by radius into groups.
     * Defaults to false.
     * @type {boolean}
     * @memberOf GeoJSONSource
     */
    cluster?: boolean;
    /**
     * Radius of each cluster if clustering is enabled. A value of 512 indicates a radius equal to the width of a tile.
     * Defaults to 50.
     * @type {number}
     * @memberOf GeoJSONSource
     */
    clusterRadius?: number;
    /**
     * Max zoom on which to cluster points if clustering is enabled.
     * Defaults to one zoom less than maxzoom (so that last zoom features are not clustered).
     *
     * @type {number}
     * @memberOf GeoJSONSource
     */
    clusterMaxZoom?: number;
  }

  /**
   * A video source. The "urls" value is an array. For each URL in the array,
   * a video element source will be created, in order to support same media in multiple
   * formats supported by different browsers.
   *
   * The "coordinates" array contains [longitude, latitude] pairs for the video corners
   * listed in clockwise order: top left, top right, bottom right, bottom left.
   *
   * @export
   * @interface VideoSource
   * @extends {Source}
   */
  export interface VideoSource extends Source {
    type: 'video';
    /**
     * URLs to video content in order of preferred format.
     *
     * @type {string[]}
     * @memberOf VideoSource
     */
    urls: string[];
    /**
     * Corners of video specified in longitude, latitude pairs.
     *
     * @type {Array<number[]>}
     * @memberOf VideoSource
     * @example
     * "coordinates": [
     *  [-122.51596391201019, 37.56238816766053],
     *  [-122.51467645168304, 37.56410183312965],
     *  [-122.51309394836426, 37.563391708549425],
     *  [-122.51423120498657, 37.56161849366671]
     * ]
     */
    coordinates: Array<number[]>;
  }

  export interface ImageSource extends Source {
    type: 'image';
    /**
     * URL that points to an image.
     *
     * @type {string}
     * @memberOf ImageSource
     */
    url: string;
    /**
     * Corners of image specified in longitude, latitude pairs.
     *
     * @type {Array<number[]>}
     * @memberOf ImageSource
     */
    coordinates: Array<number[]>;
  }

  /**
   * A style's transition property provides global transition defaults for that style.
   *
   * @export
   * @interface Transition
   */
  export interface Transition {
    /**
     * Time allotted for transitions to complete.
     * Units in milliseconds. Defaults to 300 and minimum is 0.
     * @type {number}
     * @memberOf Transition
     */
    duration?: number;
    /**
     * Length of time before a transition begins.
     * Units in milliseconds. Defaults to 0.
     * @type {number}
     * @memberOf Transition
     */
    delay?: number;
  }

  export interface Light {
    /**
     * Whether extruded geometries are lit relative to the map or viewport.
     * map
     * The position of the light source is aligned to the rotation of the map.
     * viewport
     * The position of the light source is aligned to the rotation of the viewport.
     * Defaults to viewport.
     * @type {('map' | 'viewport')}
     * @memberOf Light
     */
    anchor?: 'map' | 'viewport';
    /**
     * Position of the light source relative to lit (extruded) geometries, in
     * [r radial coordinate, a azimuthal angle, p polar angle] where r indicates
     * the distance from the center of the base of an object to its light, a
     * indicates the position of the light relative to 0° (0° when light.anchor
     * is set to viewport corresponds to the top of the viewport, or 0° when
     * light.anchor is set to map corresponds to due north, and degrees proceed
     * clockwise), and p indicates the height of the light (from 0°, directly
     * above, to 180°, directly below).
     * Defaults to [1.15,210,30].
     * @type {number[]}
     * @memberOf Light
     */
    position?: number[];
    /**
     * Color tint for lighting extruded geometries.
     * Defaults to #ffffff.
     * @memberOf Light
     */
    color?: string;
    /**
     * Intensity of lighting (on a scale from 0 to 1). Higher numbers will present
     * as more extreme contrast.
     * Defaults to 0.5.
     * @type {number}
     * @memberOf Light
     */
    intensity?: number;
  }

  export interface Layer {
    id: string; //Unique layer name.
    /**
     * Rendering type of this layer.
     *
     * @type {('fill' | 'line' | 'symbol' | 'circle' | 'fill-extrusion' | 'raster' | 'background')}
     * @memberOf Layer
     */
    type: 'fill' | 'line' | 'symbol' | 'circle' | 'fill-extrusion' | 'raster' | 'background';
    /**
     * Arbitrary properties useful to track with the layer, but do not influence rendering.
     * Properties should be prefixed to avoid collisions, like 'mapbox:'.
     *
     * @type {*}
     * @memberOf Layer
     */
    metadata: any;
    //
    /**
     * References another layer to copy `type`, `source`, `source-layer`, `minzoom`,
     * `maxzoom`, `filter`, and `layout` properties from.
     * This allows the layers to share processing and be more efficient.
     *
     * @type {string}
     * @memberOf Layer
     */
    ref: string;
    /**
     * Name of a source description to be used for this layer.
     *
     * @type {string}
     * @memberOf Layer
     */
    source: string;
    /**
     * Layer to use from a vector tile source. Required if the source supports multiple layers.
     *
     * @type {string}
     * @memberOf Layer
     */
    'source-layer': string;

    minzoom: number; // minimun 0, maximum 24
    maxzoom: number;

    /**
     * A expression specifying conditions on source features.
     * Only features that match the filter are displayed.
     *
     * @memberOf Layer
     */
    filter;
    /**
     * Layout properties for the layer.
     *
     * @memberOf Layer
     */
    layout: Layout;
    /**
     * Default paint properties for this layer.
     *
     * @memberOf Layer
     */
    paint: Paint;
  }

  /**
   * Layout properties appear in the layer's "layout" object. They are applied early
   * in the rendering process and define how data for that layer is passed to the GPU.
   * For efficiency, a layer can share layout properties with another layer via the
   * "ref" layer property, and should do so where possible. This will decrease processing
   * time and allow the two layers will share GPU memory and other resources associated
   * with the layer.
   *
   * @export
   * @interface Layerout
   */
  export interface Layout {
    /**
     * Whether this layer is displayed.
     * Defaults to visible.
     * @type {('visible' | 'none')}
     * @memberOf Layerout
     */
    visibility?: 'visible' | 'none';
  }

  export interface LineLayout extends Layout {
    /**
     * The display of line endings.
     * butt
     * A cap with a squared-off end which is drawn to the exact
     * endpoint of the line.
     * round
     * A cap with a rounded end which is drawn beyond the endpoint
     * of the line at a radius of one-half of the line's width and
     * centered on the endpoint of the line.
     * square
     * A cap with a squared-off end which is drawn beyond the endpoint
     * of the line at a distance of one-half of the line's width.
     * Defaults to butt.
     * @type {('butt' | 'round' | 'square')}
     * @memberOf LineLayout
     */
    'line-cap'?: 'butt' | 'round' | 'square';
    /**
     * The display of lines when joining.
     * bevel
     * A join with a squared-off end which is drawn beyond the endpoint of
     * the line at a distance of one-half of the line's width.
     * round
     * A join with a rounded end which is drawn beyond the endpoint of
     * the line at a radius of one-half of the line's width and centered on the endpoint of the line.
     * miter
     * A join with a sharp, angled corner which is drawn with the outer
     * sides beyond the endpoint of the path until they meet.
     *
     * @type {('bevel' | 'round' | 'miter')}
     * @memberOf LineLayout
     */
    'line-join'?: 'bevel' | 'round' | 'miter';
    /**
     * Used to automatically convert miter joins to bevel joins for sharp angles.
     * Defaults to 2. Requires line-join = miter.
     * @type {number}
     * @memberOf LineLayout
     */
    'line-miter-limit'?: number;
    /**
     * Used to automatically convert round joins to miter joins for shallow angles.
     * Defaults to 1.05. Requires line-join = round.
     * @type {number}
     * @memberOf LineLayout
     */
    'line-round-limit'?: number;
  }

  export interface SymbolLayout extends Layout {
    /**
     * Label placement relative to its geometry.
     * point
     * The label is placed at the point where the geometry is located.
     * line
     * The label is placed along the line of the geometry. Can only be
     * used on LineString and Polygon geometries.
     * Defaults to point.
     * @type {('point' | 'line')}
     * @memberOf SymbolLayout
     */
    'symbol-placement'?: 'point' | 'line';
    /**
     * Distance between two symbol anchors.
     * Units in pixels. Defaults to 250. Requires symbol-placement = line.
     * @type {number}
     * @memberOf SymbolLayout
     */
    'symbol-spacing'?: number;
    /**
     * If true, the symbols will not cross tile edges to avoid mutual
     * collisions. Recommended in layers that don't have enough padding
     * in the vector tile to prevent collisions, or if it is a point
     * symbol layer placed after a line symbol layer.
     * Defaults to false.
     * @type {boolean}
     * @memberOf SymbolLayout
     */
    'symbol-avoid-edges'?: boolean;
    /**
     * If true, the icon will be visible even if it collides with other previously drawn symbols.
     * Defaults to false. Requires icon-image.
     * @type {boolean}
     * @memberOf SymbolLayout
     */
    'icon-allow-overlap'?: boolean;
    /**
     * If true, other symbols can be visible even if they collide with the icon.
     * Defaults to false. Requires icon-image.
     * @type {boolean}
     * @memberOf SymbolLayout
     */
    'icon-ignore-placement'?: boolean;
    /**
     * If true, text will display without their corresponding icons when
     * the icon collides with other symbols and the text does not.
     * Defaults to false. Requires icon-image. Requires text-field.
     * @type {boolean}
     * @memberOf SymbolLayout
     */
    'icon-optional'?: boolean;
    /**
     * In combination with symbol-placement, determines the rotation behavior of icons.
     * map
     * When symbol-placement is set to point, aligns icons east-west.
     * When symbol-placement is set to line, aligns icon x-axes with the line.
     * viewport
     * Produces icons whose x-axes are aligned with the x-axis of the
     * viewport, regardless of the value of symbol-placement.
     * auto
     * When symbol-placement is set to point, this is equivalent to
     * viewport. When symbol-placement is set to line, this is equivalent to map.
     * Defaults to auto. Requires icon-image.
     * @type {('map' | 'viewport' | 'auto')}
     * @memberOf SymbolLayout
     */
    'icon-rotation-alignment'?: 'map' | 'viewport' | 'auto';
    /**
     * Scale factor for icon. 1 is original size, 3 triples the size.
     * Defaults to 1. Requires icon-image.
     * @type {number}
     * @memberOf SymbolLayout
     */
    'icon-size'?: number;
    /**
     * Scales the icon to fit around the associated text.
     * none
     * The icon is displayed at its intrinsic aspect ratio.
     * width
     * The icon is scaled in the x-dimension to fit the width of the text.
     * height
     * The icon is scaled in the y-dimension to fit the height of the text.
     * both
     * The icon is scaled in both x- and y-dimensions.
     *
     * Defaults to none. Requires icon-image. Requires text-field.
     * @type {('none' | 'width' | 'height' | 'both')}
     * @memberOf SymbolLayout
     */
    'icon-text-fit'?: 'none' | 'width' | 'height' | 'both';
    /**
     * Size of the additional area added to dimensions determined by
     * icon-text-fit, in clockwise order: top, right, bottom, left.
     *
     * Units in pixels. Defaults to 0,0,0,0.
     * Requires icon-image.
     * Requires text-field.
     * Requires icon-text-fit = one of both, width, height.
     * @type {number[]}
     * @memberOf SymbolLayout
     */
    'icon-text-fit-padding'?: number[];
    /**
     * A string with {tokens} replaced, referencing the data property
     * to pull from.
     *
     * @type {string}
     * @memberOf SymbolLayout
     */
    'icon-image'?: string;
    /**
     * Rotates the icon clockwise.
     * Units in degrees. Defaults to 0. Requires icon-image.
     * @type {number}
     * @memberOf SymbolLayout
     */
    'icon-rotate'?: number;
    /**
     * Size of the additional area around the icon bounding box used
     * for detecting symbol collisions
     * Units in pixels. Defaults to 2. Requires icon-image.
     * @type {number}
     * @memberOf SymbolLayout
     */
    'icon-padding'?: number;
    /**
     * If true, the icon may be flipped to prevent it from being rendered upside-down.
     * Defaults to false.
     * Requires icon-image.
     * Requires icon-rotation-alignment = map.
     * Requires symbol-placement = line.
     * @type {boolean}
     * @memberOf SymbolLayout
     */
    'icon-keep-upright'?: boolean;
    /**
     * Offset distance of icon from its anchor. Positive values indicate
     * right and down, while negative values indicate left and up.
     * Defaults to 0,0. Requires icon-image.
     * @type {number[]}
     * @memberOf SymbolLayout
     */
    'icon-offset'?: number[];
    /**
     * Orientation of text when map is pitched.
     * map
     * The text is aligned to the plane of the map.
     * viewport
     * The text is aligned to the plane of the viewport.
     * auto
     * Automatically matches the value of text-rotation-alignment.
     *
     * Defaults to auto. Requires text-field.
     * @type {('map' | 'viewport' | 'auto')}
     * @memberOf SymbolLayout
     */
    'text-pitch-alignment'?: 'map' | 'viewport' | 'auto';
    /**
     * In combination with symbol-placement, determines the rotation
     * behavior of the individual glyphs forming the text.
     * map
     * When symbol-placement is set to point, aligns text east-west.
     * When symbol-placement is set to line, aligns text x-axes with
     * the line.
     * viewport
     * Produces glyphs whose x-axes are aligned with the x-axis of
     * the viewport, regardless of the value of symbol-placement.
     * auto
     * When symbol-placement is set to point, this is equivalent to
     * viewport. When symbol-placement is set to line, this is equivalent to map.
     *
     * @type {('map' | 'viewport' | 'auto')}
     * @memberOf SymbolLayout
     */
    'text-rotation-alignment'?: 'map' | 'viewport' | 'auto';
    /**
     * Value to use for a text label. Feature properties are specified using tokens like {field_name}.
     *
     * @type {string}
     * @memberOf SymbolLayout
     */
    'text-field'?: string;
    /**
     * Font stack to use for displaying text.
     * Defaults to ["Open Sans Regular", "Arial Unicode MS Regular"]
     * Requires text-field
     * @type {string[]}
     * @memberOf SymbolLayout
     */
    'text-font'?: string[];
    /**
     * Font size.
     * Defaults to 16. Requires text-field
     * @type {number}
     * @memberOf SymbolLayout
     */
    'text-size'?: number;
    /**
     * The maximum line width for text wrapping.
     * Defaults to 10.
     * Units in ems.
     * Requires text-field.
     * @type {number}
     * @memberOf SymbolLayout
     */
    'text-max-width'?: number;
    /**
     * Text leading value for multi-line text.
     * Defaults to 1.2
     * Units in ems
     * Requires text-field.
     * @type {number}
     * @memberOf SymbolLayout
     */
    'text-line-height'?: number;
    /**
     * Text tracking amount.
     * Defaults to 0;
     * Units in ems.
     * Requires text-field.
     * @type {number}
     * @memberOf SymbolLayout
     */
    'text-letter-spacing'?: number;
    /**
     * Text justification options.
     * left
     * The text is aligned to the left.
     * center
     * The text is centered.
     * right
     * The text is aligned to the right.
     * Defaults to center. Requires text-field.
     * @type {('left' | 'center' | 'right')}
     * @memberOf SymbolLayout
     */
    'text-justify'?: 'left' | 'center' | 'right';
    /**
     * Part of the text placed closest to the anchor.
     * center
     * The center of the text is placed closest to the anchor.
     * left
     * The left side of the text is placed closest to the anchor.
     * right
     * The right side of the text is placed closest to the anchor.
     * top
     * The top of the text is placed closest to the anchor.
     * bottom
     * The bottom of the text is placed closest to the anchor.
     * top-left
     * The top left corner of the text is placed closest to the anchor.
     * top-right
     * The top right corner of the text is placed closest to the anchor.
     * bottom-left
     * The bottom left corner of the text is placed closest to the anchor.
     * bottom-right
     * The bottom right corner of the text is placed closest to the anchor.
     *
     * Defaults to center. Requires text-field.
     * @type {('center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right')}
     * @memberOf SymbolLayout
     */
    'text-anchor'?: 'center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    /**
     * Maximum angle change between adjacent characters.
     *
     * Units in degrees.
     * Defaults to 45.
     * Requires text-field.
     * Requires symbol-placement = line.
     * @type {number}
     * @memberOf SymbolLayout
     */
    'text-max-angle'?: number;
    /**
     * Rotates the text clockwise.
     * Units in degrees. Defaults to 0. Requires text-field.
     * @type {number}
     * @memberOf SymbolLayout
     */
    'text-rotate'?: number;
    /**
     * Size of the additional area around the text bounding box
     * used for detecting symbol collisions.
     * Units in pixels. Defaults to 2. Requires text-field.
     * @type {number}
     * @memberOf SymbolLayout
     */
    'text-padding'?: number;
    /**
     * If true, the text may be flipped vertically to prevent
     * it from being rendered upside-down.
     * Defaults to true.
     * Requires text-field.
     * Requires text-rotation-alignment = map.
     * Requires symbol-placement = line.
     * @type {boolean}
     * @memberOf SymbolLayout
     */
    'text-keep-upright'?: boolean;
    /**
     * Specifies how to capitalize text, similar to the CSS text-transform property.
     * none
     * The text is not altered.
     * uppercase
     * Forces all letters to be displayed in uppercase.
     * lowercase
     * Forces all letters to be displayed in lowercase.
     *
     * Defaults to none. Requires text-field.
     * @type {('none' | 'uppercase' | 'lowercase')}
     * @memberOf SymbolLayout
     */
    'text-transform'?: 'none' | 'uppercase' | 'lowercase';
    /**
     * Offset distance of text from its anchor. Positive values
     * indicate right and down, while negative values indicate
     * left and up.
     *
     * Defaults to 0,0. Requires text-field.
     * @type {number[]}
     * @memberOf SymbolLayout
     */
    'text-offset'?: number[];
    /**
     * If true, the text will be visible even if it collides
     * with other previously drawn symbols.
     *
     * Defaults to false. Requires text-field.
     * @type {boolean}
     * @memberOf SymbolLayout
     */
    'text-allow-overlap'?: boolean;
    /**
     * If true, other symbols can be visible even if they collide
     * with the text.
     * Defaults to false. Requires text-field.
     * @type {boolean}
     * @memberOf SymbolLayout
     */
    'text-ignore-placement'?: boolean;
    /**
     * If true, icons will display without their corresponding text
     * when the text collides with other symbols and the icon does not.
     * Defaults to false. Requires text-field. Requires icon-image.
     * @type {boolean}
     * @memberOf SymbolLayout
     */
    'text-optional'?: boolean;
  }

  export interface Paint { }

  export interface PaintFill extends Paint {
    /**
     * Whether or not the fill should be antialiased.
     * Defaults to true.
     * @type {boolean}
     * @memberOf PaintFill
     */
    'fill-antialias'?: boolean;
    /**
     * The opacity of the entire fill layer. In contrast to the
     * fill-color, this value will also affect the 1px stroke
     * around the fill, if the stroke is used.
     * Defaults to 1.
     * @type {number}
     * @memberOf PaintFill
     */
    'fill-opacity'?: number;
    /**
     * The color of the filled part of this layer. This color can
     * be specified as rgba with an alpha component and the color's
     * opacity will not affect the opacity of the 1px stroke,
     * if it is used.
     * Defaults to #000000. Disabled by fill-pattern.
     * @type {number}
     * @memberOf PaintFill
     */
    'fill-color'?: number;
    /**
     * The outline color of the fill. Matches the value of `fill-color`
     * if unspecified.
     * Disabled by fill-pattern. Requires fill-antialias = true.
     * @type {number}
     * @memberOf PaintFill
     */
    'fill-outline-color'?: number;
    /**
     * The geometry's offset. Values are [x, y] where negatives indicate
     * left and up, respectively.
     * Units in pixels. Defaults to 0,0.
     * @type {number}
     * @memberOf PaintFill
     */
    'fill-translate'?: number;
    /**
     * Controls the translation reference point.
     * map
     * The fill is translated relative to the map.
     * viewport
     * The fill is translated relative to the viewport.
     * Defaults to map. Requires fill-translate.
     * @type {('map' | 'viewport')}
     * @memberOf PaintFill
     */
    'fill-translate-anchor'?: 'map' | 'viewport';
    /**
     * Name of image in sprite to use for drawing image fills.
     * For seamless patterns, image width and height must be a
     * factor of two (2, 4, 8, ..., 512).
     *
     * @type {string}
     * @memberOf PaintFill
     */
    'fill-pattern'?: string;
  }

  export interface PaintBackground extends Paint {
    /**
     * The color with which the background will be drawn.
     * Defaults to #000000. Disabled by background-pattern.
     * @type {string}
     * @memberOf PaintBackground
     */
    'background-color'?: string;
    /**
     * Name of image in sprite to use for drawing an image background.
     * For seamless patterns, image width and height must be a factor of two (2, 4, 8, ..., 512).
     *
     * @type {string}
     * @memberOf PaintBackground
     */
    'background-pattern'?: string;
    /**
     * The opacity at which the background will be drawn.
     *
     * @type {number}
     * @memberOf PaintBackground
     */
    'background-opacity'?: number;
  }

  export interface PaintLine extends Paint {
    /**
     * The opacity at which the line will be drawn.
     * Defaults to 1.
     * @type {number}
     * @memberOf PaintLine
     */
    'line-opacity'?: number;
    /**
     * The color with which the line will be drawn.
     * Defaults to #000000. Disabled by line-pattern.
     * @type {string}
     * @memberOf PaintLine
     */
    'line-color'?: string;
    /**
     * The geometry's offset. Values are [x, y] where negatives
     * indicate left and up, respectively.
     * Units in pixels. Defaults to 0,0.
     * @type {number[]}
     * @memberOf PaintLine
     */
    'line-translate'?: number[];
    /**
     * Controls the translation reference point.
     * map
     * The line is translated relative to the map.
     * viewport
     * The line is translated relative to the viewport.
     *
     * Defaults to map. Requires line-translate.
     * @type {('map' | 'viewport')}
     * @memberOf PaintLine
     */
    'line-translate-anchor'?: 'map' | 'viewport';
    /**
     * Stroke thickness.
     * Units in pixels. Defaults to 1.
     * @type {number}
     * @memberOf PaintLine
     */
    'line-width'?: number;
    /**
     * Draws a line casing outside of a line's actual path.
     * Value indicates the width of the inner gap.
     * Units in pixels. Defaults to 0.
     * @type {number}
     * @memberOf PaintLine
     */
    'line-gap-width'?: number;
    /**
     * The line's offset. For linear features, a positive value
     * offsets the line to the right, relative to the direction
     * of the line, and a negative value to the left. For polygon
     * features, a positive value results in an inset, and a
     * negative value results in an outset.
     *
     * Units in pixels. Defaults to 0.
     * @type {number}
     * @memberOf PaintLine
     */
    'line-offset'?: number;
    /**
     * Blur applied to the line, in pixels.
     * Units in pixels. Defaults to 0.
     * @type {number}
     * @memberOf PaintLine
     */
    'line-blur'?: number;
    /**
     * Specifies the lengths of the alternating dashes and gaps
     * that form the dash pattern. The lengths are later scaled
     * by the line width. To convert a dash length to pixels,
     * multiply the length by the current line width.
     *
     * Units in line widths. Disabled by line-pattern.
     * @type {number[]}
     * @memberOf PaintLine
     */
    'line-dasharray'?: number[];
    /**
     * Name of image in sprite to use for drawing image lines.
     * For seamless patterns, image width must be a factor of
     * two (2, 4, 8, ..., 512).
     *
     * @type {string}
     * @memberOf PaintLine
     */
    'line-pattern'?: string;
  }

  export interface PaintCircle extends Paint {
    /**
     * Units in pixels. Defaults to 5.
     *
     * @type {number}
     * @memberOf PaintCircle
     */
    'circle-radius'?: number;
    /**
     * The fill color of the circle.
     * Defaults to #000000.
     * @type {string}
     * @memberOf PaintCircle
     */
    'circle-color'?: string;
    /**
     * Amount to blur the circle. 1 blurs the circle such that only
     * the centerpoint is full opacity.
     * Defaults to 0.
     * @type {number}
     * @memberOf PaintCircle
     */
    'circle-blur'?: number;
    /**
     * The opacity at which the circle will be drawn.
     * Defaults to 1.
     * @type {number}
     * @memberOf PaintCircle
     */
    'circle-opacity'?: number;
    /**
     * The geometry's offset. Values are [x, y] where negatives
     * indicate left and up, respectively.
     * Units in pixels. Defaults to 0,0.
     * @type {number[]}
     * @memberOf PaintCircle
     */
    'circle-translate'?: number[];
    /**
     * Controls the translation reference point.
     * Defaults to map. Requires circle-translate.
     * @type {('map' | 'viewport')}
     * @memberOf PaintCircle
     */
    'circle-translate-anchor'?: 'map' | 'viewport';
    /**
     * Controls the scaling behavior of the circle when the map is pitched.
     * map
     * Circles are scaled according to their apparent distance to the camera.
     * viewport
     * Circles are not scaled.
     * Defaults to map.
     * @type {('map' | 'viewport')}
     * @memberOf PaintCircle
     */
    'circle-pitch-scale'?: 'map' | 'viewport';
    /**
     * The width of the circle's stroke.
     * Strokes are placed outside of the "circle-radius".
     * Units in pixels. Defaults to 0.
     * @type {number}
     * @memberOf PaintCircle
     */
    'circle-stroke-width'?: number;
    /**
     * The stroke color of the circle.
     *
     * @type {string}
     * @memberOf PaintCircle
     */
    'circle-stroke-color'?: string;
    /**
     * The opacity of the circle's stroke.
     * Defaults to 1.
     * @type {number}
     * @memberOf PaintCircle
     */
    'circle-stroke-opacity'?: number;
  }

  export interface PaintRaster extends Paint {
    /**
     * The opacity at which the image will be drawn.
     * Defaults to 1.
     * @type {number}
     * @memberOf PaintRaster
     */
    'raster-opacity'?: number;
    /**
     * Rotates hues around the color wheel.
     * Units in degrees. Defaults to 0.
     * @type {number}
     * @memberOf PaintRaster
     */
    'raster-hue-rotate'?: number;
    /**
     * Increase or reduce the brightness of the image. The value is the
     * minimum brightness.
     *
     * @type {number}
     * @memberOf PaintRaster
     */
    'raster-brightness-min'?: number;
    /**
     * Increase or reduce the brightness of the image. The value is the
     * maximum brightness.
     *
     * @type {number}
     * @memberOf PaintRaster
     */
    'raster-brightness-max'?: number;
    /**
     * Increase or reduce the saturation of the image.
     *
     * @type {number}
     * @memberOf PaintRaster
     */
    'raster-saturation'?: number;
    /**
     * Increase or reduce the contrast of the image.
     *
     * @type {number}
     * @memberOf PaintRaster
     */
    'raster-contrast'?: number;
    /**
     * Fade duration when a new tile is added.
     *
     * @type {number}
     * @memberOf PaintRaster
     */
    'raster-fade-duration'?: number;
  }

  export interface PaintSymbol extends Paint {
    'icon-opacity'?: number;
    'icon-color'?: string;
    'icon-halo-color'?: string;
    'icon-halo-width'?: number;
    'icon-halo-blur'?: number;
    'icon-translate'?: number[];
    'icon-translate-anchor'?: 'map' | 'viewport';
    'text-opacity'?: number;
    'text-color'?: string;
    'text-halo-color'?: string;
    'text-halo-width'?: number;
    'text-halo-blur'?: number;
    'text-translate'?: number[];
    'text-translate-anchor'?: number;
  }

  export interface PaintFillExtrusion extends Paint {
    'fill-extrusion-opacity'?: number;
    'fill-extrusion-color'?: string;
    'fill-extrusion-translate'?: number[];
    'fill-extrusion-translate-anchor'?: 'map' | 'viewport';
    'fill-extrusion-pattern'?: string;
    'fill-extrusion-height'?: number;
    'fill-extrusion-base'?: number;
  }

  export interface Function {
    /**
     * Functions are defined in terms of input and output values.
     * A set of one input value and one output value is known as a "stop."
     *
     * @type {any[]}
     * @memberOf Function
     */
    stops: any[];
    /**
     * If specified, the function will take the specified
     * feature property as an input.
     *
     * @type {string}
     * @memberOf Function
     */
    property?: string;
    /**
     * The exponential base of the interpolation curve. It
     * controls the rate at which the function output increases.
     * Higher values make the output increase more towards the
     * high end of the range. With values close to 1 the output
     * increases linearly.
     * Default is 1.
     * @type {number}
     * @memberOf Function
     */
    base?: number;
    /**
     * identity
     * functions return their input as their output.
     * exponential
     * functions generate an output by interpolating between
     * stops just less than and just greater than the function input.
     * The domain must be numeric. This is the default for numeric domain,
     * continuous range functions.
     * interval
     * functions return the output value of the stop just
     * less than the function input. The domain must be numeric. This is
     * the default for numeric domain, discrete range functions.
     * categorical
     * functions return the output value of the stop equal to the
     * function input. This is the default for string domain functions.
     *
     * @type {('identity' | 'exponential' | 'interval' | 'categorical')}
     * @memberOf Function
     */
    type?: 'identity' | 'exponential' | 'interval' | 'categorical';
  }
}
