require([
  "esri/Map",
  "esri/Basemap",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/layers/OpenStreetMapLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/widgets/Search",
  "esri/geometry/Extent",
  "esri/geometry/Point",
  "esri/geometry/geometryEngine"
], function (
  Map,
  Basemap,
  MapView,
  FeatureLayer,
  OpenStreetMapLayer,
  GraphicsLayer,
  Graphic,
  Search,
  Extent,
  Point,
  geometryEngine
) {

  // =========================================================
  // SETTINGS
  // =========================================================

  const FACILITIES_URL =
    "https://services-eu1.arcgis.com/z1y55jruXrgzzpdi/arcgis/rest/services/Sport_Ireland_Facilities_Mapping/FeatureServer/0";


  const PRIVATE_RESIDENCE_WHERE =
    "(Owner <> 'Private Residence' OR Owner IS NULL)";


  const CLICK_TOLERANCE_PIXELS =
    14;


  const OSM_OPACITY =
    0.45;


  const IRELAND_CENTER =
    [-8, 53.4];


  const IRELAND_ZOOM =
    7;


  const CATCHMENT_RADII =
    [1, 2, 4, 8];


  const LIVE_FOCUS_DELAY =
    150;


  const COVERAGE_MIN_ZOOM =
    9;


  const COVERAGE_LIMIT =
    700;


  // =========================================================
  // SPORT ICON SETTINGS
  // =========================================================

  const SPORT_ICON_MIN_ZOOM =
    6;


  const SPORT_ICON_MAX_SIZE =
    46;


  const SPORT_ICON_MIN_SIZE =
    12;


  /*
    Icon uses no more than this proportion
    of the polygon's smallest screen dimension.
  */

  const SPORT_ICON_POLYGON_RATIO =
    0.80;


  // =========================================================
  // SPORT ICONS
  // =========================================================

  /*
    Disability icons are intentionally excluded.

    Multiple icons can be listed for the same sport.
    The app rotates between them using OBJECTID.

    This gives us a consistent male/female visual mix
    without implying the facility itself is gender-specific.
  */

  const sportIcons = {

    "Gaelic Games": [
      "gaa.png",
      "gaelic_f.png"
    ],

    "Soccer": [
      "soccer.png",
      "soccer_f.png"
    ],

    "Rugby": [
      "rugby.png",
      "rugby_f.png"
    ],

    "Cycling": [
      "cycling.png",
      "cycling_f.png"
    ],

    "Running": [
      "running.png",
      "running_f.png"
    ],

    "Swimming Indoor": [
      "swimming.png"
    ],

    "Swimming Outdoor": [
      "swimming.png"
    ],

    "Golf": [
      "golf.png"
    ],

    "Boxing": [
      "combat_sports.png"
    ],

    "Combat Sports": [
      "combat_sports.png"
    ],

    "Gym": [
      "personal_exercise.png"
    ],

    "Personal Exercise": [
      "personal_exercise.png"
    ],

    "Tennis": [
      "racket_sports.png"
    ],

    "Badminton": [
      "racket_sports.png"
    ],

    "Padel": [
      "racket_sports.png"
    ],

    "Racket Sports": [
      "racket_sports.png"
    ],

    "Pilates": [
      "pilates.png",
      "pilates_f.png"
    ],

    "Dancing": [
      "dancing.png"
    ]

  };


  // =========================================================
  // SPORTS
  // =========================================================

  const mainSports = [

    {
      value: "Gaelic Games",
      label: "Gaelic Games"
    },

    {
      value: "Soccer",
      label: "Soccer"
    },

    {
      value: "Golf",
      label: "Golf"
    },

    {
      value: "Tennis",
      label: "Tennis"
    },

    {
      value: "Basketball",
      label: "Basketball"
    },

    {
      value: "Athletics",
      label: "Athletics"
    },

    {
      value: "Hockey",
      label: "Hockey"
    },

    {
      value: "Cricket",
      label: "Cricket"
    },

    {
      value: "Sports Hall",
      label: "Sports Halls"
    },

    {
      value: "Swimming Indoor",
      label: "Swimming Indoor"
    }

  ];


  const sportColours = {

    "Gaelic Games":
      [0, 176, 80],

    "Soccer":
      [25, 110, 235],

    "Golf":
      [120, 145, 95],

    "Tennis":
      [235, 205, 0],

    "Basketball":
      [255, 145, 20],

    "Athletics":
      [145, 65, 205],

    "Hockey":
      [55, 65, 175],

    "Cricket":
      [185, 90, 165],

    "Sports Hall":
      [105, 105, 140],

    "Swimming Indoor":
      [255, 20, 147],

    "Swimming Outdoor":
      [255, 80, 180],

    "Rugby":
      [230, 65, 55],

    "Equestrian":
      [145, 125, 105],

    "Badminton":
      [220, 95, 155],

    "Boxing":
      [185, 75, 55],

    "Cycling":
      [55, 155, 125],

    "Gym":
      [105, 105, 105],

    "Gymnastics":
      [170, 100, 195],

    "Rowing":
      [55, 125, 175],

    "Sailing":
      [45, 145, 185],

    "Padel":
      [230, 165, 30],

    "5-a-side":
      [70, 155, 230],

    "Pitch and Putt":
      [130, 140, 120],

    "Canoe/Kayak":
      [100, 130, 135],

    "GAA Handball":
      [115, 115, 115],

    "Multiple":
      [145, 95, 165],

    "Other":
      [145, 145, 145]

  };


  const breakdownColours = [

    [0, 132, 150],
    [235, 132, 30],
    [85, 115, 185],
    [170, 85, 165],
    [55, 155, 125],
    [210, 85, 70],
    [125, 145, 75],
    [105, 105, 145],
    [225, 165, 45],
    [75, 145, 175]

  ];


  // =========================================================
  // FACILITY RENDERER
  // =========================================================

  const rendererInfos =
    Object.entries(
      sportColours
    ).map(
      function (
        [sport, colour]
      ) {

        const pool =
          sport === "Swimming Indoor" ||
          sport === "Swimming Outdoor";


        return {

          value:
            sport,


          symbol: {

            type:
              "simple-fill",


            color: [

              colour[0],

              colour[1],

              colour[2],

              pool
                ? 0.72
                : 0.44

            ],


            outline: {

              color: [

                colour[0],

                colour[1],

                colour[2],

                1

              ],


              width:
                pool
                  ? 5
                  : 2

            }

          }

        };

      }
    );


  // =========================================================
  // GRAPHICS LAYERS
  // =========================================================

  const coverageLayer =
    new GraphicsLayer();


  const sportIconLayer =
    new GraphicsLayer({

      title:
        "Sport icons",


      opacity:
        0.75

    });


  const analysisLayer =
    new GraphicsLayer();


  const selectionGraphicsLayer =
    new GraphicsLayer({

      title:
        "Selected facilities"

    });


  // =========================================================
  // FACILITY LAYER
  // =========================================================

  const facilitiesLayer =
    new FeatureLayer({

      url:
        FACILITIES_URL,


      definitionExpression:
        PRIVATE_RESIDENCE_WHERE,


      outFields: [

        "OBJECTID",

        "Sport",

        "Infrastructure_Type",

        "Surface",

        "Floodlights",

        "Owner",

        "Facility_Size",

        "Owner_Name",

        "Quality",

        "Local_Authority",

        "LEA",

        "Multi_Use",

        "Area_msq",

        "Pool_Length",

        "Pool_Breadth"

      ],


      popupEnabled:
        false,


      renderer: {

        type:
          "unique-value",


        field:
          "Sport",


        uniqueValueInfos:
          rendererInfos,


        defaultSymbol: {

          type:
            "simple-fill",


          color: [
            145,
            145,
            145,
            0.27
          ],


          outline: {

            color: [
              100,
              100,
              100,
              1
            ],


            width:
              1.5

          }

        }

      }

    });


  // =========================================================
  // MAP
  // =========================================================

  const osm =
    new OpenStreetMapLayer({

      opacity:
        OSM_OPACITY

    });


  const map =
    new Map({

      basemap:
        new Basemap({

          baseLayers:
            [osm]

        }),


      layers: [

        coverageLayer,

        facilitiesLayer,

        sportIconLayer,

        analysisLayer,

        selectionGraphicsLayer

      ]

    });


  const view =
    new MapView({

      container:
        "viewDiv",


      map:
        map,


      center:
        IRELAND_CENTER,


      zoom:
        IRELAND_ZOOM,


      constraints: {

        minZoom:
          6

      }

    });


  const search =
    new Search({

      view:
        view,


      locationEnabled:
        false

    });


  view.ui.add(
    search,
    "top-right"
  );


  // =========================================================
  // STATE
  // =========================================================

  let facilitiesLayerView =
    null;


  let selectedGraphics =
    [];


  let selectedIndex =
    0;


  let selectedGraphic =
    null;


  let highlightHandle =
    null;


  let analysisMode =
    "normal";


  let lastCatchmentPoint =
    null;


  let catchmentRequestId =
    0;


  let lensRadiusKm =
    2;


  let lensRequestId =
    0;


  let lensRefreshTimer =
    null;


  let lastFocusFeatures =
    [];


  let coverageSport =
    "";


  let coverageRadiusKm =
    1;


  let coverageRequestId =
    0;


  let sportIconRequestId =
    0;


  let allSportValues =
    [];


  // =========================================================
  // DOM
  // =========================================================

  const resultCount =
    document.getElementById(
      "resultCount"
    );


  const mainSportFilters =
    document.getElementById(
      "mainSportFilters"
    );


  const moreSportFilters =
    document.getElementById(
      "moreSportFilters"
    );


  const ownerFilters =
    document.getElementById(
      "ownerFilters"
    );


  const surfaceFilters =
    document.getElementById(
      "surfaceFilters"
    );


  const floodlightFilters =
    document.getElementById(
      "floodlightFilters"
    );


  const normalModeButton =
    document.getElementById(
      "normalModeButton"
    );


  const catchmentModeButton =
    document.getElementById(
      "catchmentModeButton"
    );


  const lensModeButton =
    document.getElementById(
      "lensModeButton"
    );


  const coverageModeButton =
    document.getElementById(
      "coverageModeButton"
    );


  const lensControls =
    document.getElementById(
      "lensControls"
    );


  const coverageControls =
    document.getElementById(
      "coverageControls"
    );


  const lensRadiusSelect =
    document.getElementById(
      "lensRadiusSelect"
    );


  const coverageSportSelect =
    document.getElementById(
      "coverageSportSelect"
    );


  const coverageRadiusSelect =
    document.getElementById(
      "coverageRadiusSelect"
    );


  const coverageStatus =
    document.getElementById(
      "coverageStatus"
    );


  const fixedLens =
    document.getElementById(
      "fixedLens"
    );


  const lensSvg =
    document.getElementById(
      "lensSvg"
    );


  const lensTotal =
    document.getElementById(
      "lensTotal"
    );


  const lensRadiusLabel =
    document.getElementById(
      "lensRadiusLabel"
    );


  const lensLoading =
    document.getElementById(
      "lensLoading"
    );


  const mapAnalysisBadge =
    document.getElementById(
      "mapAnalysisBadge"
    );


  const analysisModeStatus =
    document.getElementById(
      "analysisModeStatus"
    );


  const rightPanelHeading =
    document.getElementById(
      "rightPanelHeading"
    );


  const emptyState =
    document.getElementById(
      "emptyState"
    );


  const facilityDetails =
    document.getElementById(
      "facilityDetails"
    );


  const analysisDetails =
    document.getElementById(
      "analysisDetails"
    );


  const analysisTitle =
    document.getElementById(
      "analysisTitle"
    );


  const analysisSubtitle =
    document.getElementById(
      "analysisSubtitle"
    );


  const analysisTotals =
    document.getElementById(
      "analysisTotals"
    );


  const focusBreakdownControls =
    document.getElementById(
      "focusBreakdownControls"
    );


  const focusBreakdownField =
    document.getElementById(
      "focusBreakdownField"
    );


  const focusResultsLimit =
    document.getElementById(
      "focusResultsLimit"
    );


  const summaryBlock =
    document.getElementById(
      "summaryBlock"
    );


  const summaryHeading =
    document.getElementById(
      "summaryHeading"
    );


  const analysisSummary =
    document.getElementById(
      "analysisSummary"
    );


  const analysisTableContainer =
    document.getElementById(
      "analysisTableContainer"
    );


  const selectionNavigator =
    document.getElementById(
      "selectionNavigator"
    );


  const selectionPosition =
    document.getElementById(
      "selectionPosition"
    );


  const previousFacility =
    document.getElementById(
      "previousFacility"
    );


  const nextFacility =
    document.getElementById(
      "nextFacility"
    );


  const poolLengthRow =
    document.getElementById(
      "poolLengthRow"
    );


  const poolBreadthRow =
    document.getElementById(
      "poolBreadthRow"
    );


  // =========================================================
  // LOAD
  // =========================================================

  view.when(
    async function () {

      await facilitiesLayer.load();


      facilitiesLayerView =
        await view.whenLayerView(
          facilitiesLayer
        );


      buildSportFilters();


      buildDomainFilter(
        "Owner",
        ownerFilters,
        "owner-filter"
      );


      buildDomainFilter(
        "Surface",
        surfaceFilters,
        "surface-filter"
      );


      buildDomainFilter(
        "Floodlights",
        floodlightFilters,
        "floodlight-filter"
      );


      buildLegend();


      buildCoverageSportList();


      setupDropdowns();


      setupControls();


      await updateResultCount();


      refreshSportIcons();

    }
  );


  // =========================================================
  // SPORT FILTERS
  // =========================================================

  function buildSportFilters() {

    const field =
      getField(
        "Sport"
      );


    if (
      !field ||
      !field.domain
    ) {

      return;

    }


    allSportValues =
      field.domain.codedValues.map(
        function (
          item
        ) {

          return {

            code:
              item.code,

            name:
              item.name

          };

        }
      );


    const mainValues =
      mainSports.map(
        function (
          item
        ) {

          return item.value;

        }
      );


    mainSports.forEach(
      function (
        sport
      ) {

        const match =
          field.domain.codedValues.find(
            function (
              item
            ) {

              return (
                item.code === sport.value ||
                item.name === sport.value
              );

            }
          );


        if (match) {

          addSportCheckbox(
            match,
            mainSportFilters,
            sport.label
          );

        }

      }
    );


    field.domain.codedValues
      .filter(
        function (
          item
        ) {

          return (
            !mainValues.includes(
              item.code
            ) &&
            !mainValues.includes(
              item.name
            )
          );

        }
      )
      .sort(
        function (
          a,
          b
        ) {

          return (
            a.name.localeCompare(
              b.name
            )
          );

        }
      )
      .forEach(
        function (
          item
        ) {

          addSportCheckbox(
            item,
            moreSportFilters,
            item.name
          );

        }
      );

  }


  function addSportCheckbox(
    value,
    container,
    labelText
  ) {

    const label =
      document.createElement(
        "label"
      );


    label.className =
      "checkbox-item";


    const checkbox =
      document.createElement(
        "input"
      );


    checkbox.type =
      "checkbox";


    checkbox.value =
      value.code;


    checkbox.checked =
      true;


    checkbox.className =
      "sport-filter";


    const square =
      document.createElement(
        "span"
      );


    square.className =
      "colour-square";


    const colour =
      sportColours[
        value.code
      ] ||
      sportColours[
        value.name
      ] ||
      [
        145,
        145,
        145
      ];


    square.style.background =
      `rgb(${colour.join(",")})`;


    const text =
      document.createElement(
        "span"
      );


    text.textContent =
      labelText;


    label.appendChild(
      checkbox
    );


    label.appendChild(
      square
    );


    label.appendChild(
      text
    );


    checkbox.addEventListener(
      "change",
      applyFilters
    );


    container.appendChild(
      label
    );

  }


  // =========================================================
  // OTHER FILTERS
  // =========================================================

  function buildDomainFilter(
    fieldName,
    container,
    className
  ) {

    const field =
      getField(
        fieldName
      );


    if (
      !field ||
      !field.domain
    ) {

      return;

    }


    field.domain.codedValues.forEach(
      function (
        item
      ) {

        if (
          fieldName === "Owner" &&
          (
            item.code === "Private Residence" ||
            item.name === "Private Residence"
          )
        ) {

          return;

        }


        const label =
          document.createElement(
            "label"
          );


        label.className =
          "checkbox-item";


        const checkbox =
          document.createElement(
            "input"
          );


        checkbox.type =
          "checkbox";


        checkbox.value =
          item.code;


        checkbox.checked =
          true;


        checkbox.className =
          className;


        const text =
          document.createElement(
            "span"
          );


        text.textContent =
          item.name;


        label.appendChild(
          checkbox
        );


        label.appendChild(
          text
        );


        checkbox.addEventListener(
          "change",
          applyFilters
        );


        container.appendChild(
          label
        );

      }
    );

  }


  // =========================================================
  // DROPDOWNS
  // =========================================================

  function setupDropdowns() {

    [

      [
        "moreSportsButton",
        "moreSportFilters",
        "moreSportsArrow"
      ],

      [
        "ownerFilterButton",
        "ownerFilters",
        "ownerFilterArrow"
      ],

      [
        "surfaceFilterButton",
        "surfaceFilters",
        "surfaceFilterArrow"
      ],

      [
        "floodlightFilterButton",
        "floodlightFilters",
        "floodlightFilterArrow"
      ]

    ].forEach(
      function (
        ids
      ) {

        const button =
          document.getElementById(
            ids[0]
          );


        const list =
          document.getElementById(
            ids[1]
          );


        const arrow =
          document.getElementById(
            ids[2]
          );


        button.addEventListener(
          "click",
          function () {

            const open =
              list.classList.contains(
                "hidden"
              );


            list.classList.toggle(
              "hidden",
              !open
            );


            arrow.textContent =
              open
                ? "▴"
                : "▾";

          }
        );

      }
    );

  }


  // =========================================================
  // LEGEND
  // =========================================================

  function buildLegend() {

    const legend =
      document.getElementById(
        "legendItems"
      );


    mainSports.forEach(
      function (
        sport
      ) {

        const row =
          document.createElement(
            "div"
          );


        row.className =
          "legend-item";


        const box =
          document.createElement(
            "span"
          );


        box.className =
          "legend-colour";


        const colour =
          sportColours[
            sport.value
          ];


        box.style.background =
          `rgb(${colour.join(",")})`;


        const text =
          document.createElement(
            "span"
          );


        text.textContent =
          sport.label;


        row.appendChild(
          box
        );


        row.appendChild(
          text
        );


        legend.appendChild(
          row
        );

      }
    );

  }


  // =========================================================
  // COVERAGE SPORT LIST
  // =========================================================

  function buildCoverageSportList() {

    allSportValues
      .slice()
      .sort(
        function (
          a,
          b
        ) {

          return (
            a.name.localeCompare(
              b.name
            )
          );

        }
      )
      .forEach(
        function (
          item
        ) {

          const option =
            document.createElement(
              "option"
            );


          option.value =
            item.code;


          option.textContent =
            item.name;


          coverageSportSelect.appendChild(
            option
          );

        }
      );

  }


  // =========================================================
  // FILTER WHERE
  // =========================================================

  function buildCurrentFilterWhere() {

    const clauses =
      [];


    const groups = [

      [
        "Sport",
        ".sport-filter"
      ],

      [
        "Owner",
        ".owner-filter"
      ],

      [
        "Surface",
        ".surface-filter"
      ],

      [
        "Floodlights",
        ".floodlight-filter"
      ]

    ];


    let checkedTotal =
      0;


    groups.forEach(
      function (
        pair
      ) {

        checkedTotal +=
          document.querySelectorAll(
            pair[1] +
            ":checked"
          ).length;


        addCheckboxClause(
          clauses,
          pair[0],
          pair[1]
        );

      }
    );


    if (
      checkedTotal ===
      0
    ) {

      return "1=0";

    }


    return (
      clauses.length
        ? clauses.join(
            " AND "
          )
        : "1=1"
    );

  }


  function buildAnalysisWhere() {

    const filters =
      buildCurrentFilterWhere();


    if (
      filters === "1=0"
    ) {

      return "1=0";

    }


    if (
      filters === "1=1"
    ) {

      return PRIVATE_RESIDENCE_WHERE;

    }


    return (
      PRIVATE_RESIDENCE_WHERE +
      " AND (" +
      filters +
      ")"
    );

  }


  function addCheckboxClause(
    clauses,
    field,
    selector
  ) {

    const all =
      document.querySelectorAll(
        selector
      );


    const checked =
      document.querySelectorAll(
        selector +
        ":checked"
      );


    if (
      checked.length === 0 ||
      checked.length === all.length
    ) {

      return;

    }


    const values =
      Array.from(
        checked
      ).map(
        function (
          item
        ) {

          return (
            "'" +
            escapeSql(
              item.value
            ) +
            "'"
          );

        }
      );


    clauses.push(
      field +
      " IN (" +
      values.join(",") +
      ")"
    );

  }


  // =========================================================
  // APPLY FILTERS
  // =========================================================

  async function applyFilters() {

    facilitiesLayerView.filter = {

      where:
        buildCurrentFilterWhere()

    };


    clearSelection();


    await updateResultCount();


    refreshSportIcons();


    if (
      analysisMode ===
      "catchment" &&
      lastCatchmentPoint
    ) {

      runCatchment(
        lastCatchmentPoint
      );

    }


    if (
      analysisMode ===
      "lens"
    ) {

      runFocusSearch();

    }


    if (
      analysisMode ===
      "coverage"
    ) {

      refreshCoverage();

    }

  }


  document
    .getElementById(
      "selectAllFilters"
    )
    .addEventListener(
      "click",
      function () {

        document
          .querySelectorAll(
            ".sport-filter, .owner-filter, .surface-filter, .floodlight-filter"
          )
          .forEach(
            function (
              item
            ) {

              item.checked =
                true;

            }
          );


        applyFilters();

      }
    );


  document
    .getElementById(
      "deselectAllFilters"
    )
    .addEventListener(
      "click",
      function () {

        document
          .querySelectorAll(
            ".sport-filter, .owner-filter, .surface-filter, .floodlight-filter"
          )
          .forEach(
            function (
              item
            ) {

              item.checked =
                false;

            }
          );


        applyFilters();

      }
    );


  // =========================================================
  // PUBLIC FACILITY COUNT
  // =========================================================

  async function updateResultCount() {

    const query =
      facilitiesLayer.createQuery();


    query.where =
      buildAnalysisWhere();


    const count =
      await facilitiesLayer.queryFeatureCount(
        query
      );


    resultCount.textContent =
      count.toLocaleString(
        "en-IE"
      ) +
      " public facilities";

  }


  // =========================================================
  // SPORT ICONS
  // =========================================================

  async function refreshSportIcons() {

    const requestId =
      ++sportIconRequestId;


    sportIconLayer.removeAll();


    if (
      !view.extent ||
      view.zoom <
      SPORT_ICON_MIN_ZOOM
    ) {

      return;

    }


    const availableSports =
      Object.keys(
        sportIcons
      );


    if (
      availableSports.length ===
      0
    ) {

      return;

    }


    const iconSportsSql =
      availableSports
        .map(
          function (
            sport
          ) {

            return (
              "'" +
              escapeSql(
                sport
              ) +
              "'"
            );

          }
        )
        .join(
          ","
        );


    const query =
      facilitiesLayer.createQuery();


    query.geometry =
      view.extent;


    query.spatialRelationship =
      "intersects";


    const currentWhere =
      buildAnalysisWhere();


    if (
      currentWhere ===
      "1=0"
    ) {

      return;

    }


    query.where =
      "(" +
      currentWhere +
      ")" +
      " AND Sport IN (" +
      iconSportsSql +
      ")";


    query.returnGeometry =
      true;


    query.outFields = [
      "OBJECTID",
      "Sport"
    ];


    try {

      const response =
        await facilitiesLayer.queryFeatures(
          query
        );


      if (
        requestId !==
        sportIconRequestId
      ) {

        return;

      }


      const graphics =
        [];


      response.features.forEach(
        function (
          feature
        ) {

          if (
            !feature.geometry ||
            !feature.geometry.extent
          ) {

            return;

          }


          const icon =
            chooseSportIcon(
              feature
            );


          if (!icon) {

            return;

          }


          const centre =
            getGeometryCentre(
              feature.geometry
            );


          if (!centre) {

            return;

          }


          /*
            Convert polygon extent to screen pixels.
          */

          const extent =
            feature.geometry.extent;


          const topLeft =
            view.toScreen(

              new Point({

                x:
                  extent.xmin,

                y:
                  extent.ymax,

                spatialReference:
                  extent.spatialReference

              })

            );


          const bottomRight =
            view.toScreen(

              new Point({

                x:
                  extent.xmax,

                y:
                  extent.ymin,

                spatialReference:
                  extent.spatialReference

              })

            );


          if (
            !topLeft ||
            !bottomRight
          ) {

            return;

          }


          const polygonWidth =
            Math.abs(
              bottomRight.x -
              topLeft.x
            );


          const polygonHeight =
            Math.abs(
              bottomRight.y -
              topLeft.y
            );


          const smallestDimension =
            Math.min(
              polygonWidth,
              polygonHeight
            );


          /*
            Icon stays comfortably inside the polygon
            bounding box.
          */

          const calculatedSize =
            smallestDimension *
            SPORT_ICON_POLYGON_RATIO;


          const iconSize =
            Math.min(
              SPORT_ICON_MAX_SIZE,
              calculatedSize
            );


          /*
            If it would be too tiny, don't show it yet.
            It appears automatically as the map zooms in.
          */

          if (
            iconSize <
            SPORT_ICON_MIN_SIZE
          ) {

            return;

          }


          graphics.push(

            new Graphic({

              geometry:
                centre,


              symbol: {

                type:
                  "picture-marker",


                url:
                  icon,


                width:
                  iconSize +
                  "px",


                height:
                  iconSize +
                  "px"

              }

            })

          );

        }
      );


      if (
        requestId !==
        sportIconRequestId
      ) {

        return;

      }


      sportIconLayer.addMany(
        graphics
      );

    }
    catch (
      error
    ) {

      console.error(
        "SPORT ICON ERROR:",
        error
      );

    }

  }


  function chooseSportIcon(
    feature
  ) {

    const sport =
      feature.attributes.Sport;


    const options =
      sportIcons[
        sport
      ];


    if (
      !options ||
      options.length ===
      0
    ) {

      return null;

    }


    const objectId =
      Number(
        feature.attributes.OBJECTID
      ) ||
      0;


    /*
      Deterministic rotation.

      If there are two images, facilities alternate
      between them consistently.
    */

    const index =
      Math.abs(
        objectId
      ) %
      options.length;


    return (
      options[
        index
      ]
    );

  }


  // =========================================================
  // CONTROLS
  // =========================================================

  function setupControls() {

    normalModeButton.addEventListener(
      "click",
      function () {

        setMode(
          "normal"
        );

      }
    );


    catchmentModeButton.addEventListener(
      "click",
      function () {

        setMode(
          "catchment"
        );

      }
    );


    lensModeButton.addEventListener(
      "click",
      function () {

        setMode(
          "lens"
        );

      }
    );


    coverageModeButton.addEventListener(
      "click",
      function () {

        setMode(
          "coverage"
        );

      }
    );


    lensRadiusSelect.addEventListener(
      "change",
      function () {

        lensRadiusKm =
          Number(
            lensRadiusSelect.value
          );


        lensRadiusLabel.textContent =
          lensRadiusKm +
          " km";


        updateLensSize();


        runFocusSearch();

      }
    );


    coverageSportSelect.addEventListener(
      "change",
      function () {

        coverageSport =
          coverageSportSelect.value;


        refreshCoverage();

      }
    );


    coverageRadiusSelect.addEventListener(
      "change",
      function () {

        coverageRadiusKm =
          Number(
            coverageRadiusSelect.value
          );


        refreshCoverage();

      }
    );


    focusBreakdownField.addEventListener(
      "change",
      renderFocusBreakdown
    );


    focusResultsLimit.addEventListener(
      "change",
      renderFocusBreakdown
    );


    document
      .getElementById(
        "clearAnalysisButton"
      )
      .addEventListener(
        "click",
        clearAnalysis
      );


    document
      .getElementById(
        "homeButton"
      )
      .addEventListener(
        "click",
        function () {

          view.goTo({

            center:
              IRELAND_CENTER,

            zoom:
              IRELAND_ZOOM

          });

        }
      );


    document
      .getElementById(
        "zoomToFacility"
      )
      .addEventListener(
        "click",
        function () {

          if (
            !selectedGraphic
          ) {

            return;

          }


          view.goTo(

            selectedGraphic.geometry.extent
              ? selectedGraphic.geometry.extent.expand(
                  2.2
                )
              : selectedGraphic.geometry

          );

        }
      );


    document
      .getElementById(
        "closeDetails"
      )
      .addEventListener(
        "click",
        function () {

          if (
            analysisMode ===
            "normal"
          ) {

            clearSelection();


            showNormalPanel();

          }


          if (
            analysisMode ===
            "catchment"
          ) {

            clearAnalysis();

          }

        }
      );

  }


  // =========================================================
  // MODES
  // =========================================================

  function setMode(
    mode
  ) {

    analysisMode =
      mode;


    [
      normalModeButton,
      catchmentModeButton,
      lensModeButton,
      coverageModeButton
    ].forEach(
      function (
        button
      ) {

        button.classList.remove(
          "active"
        );

      }
    );


    lensControls.classList.add(
      "hidden"
    );


    coverageControls.classList.add(
      "hidden"
    );


    hideFixedLens();


    analysisLayer.removeAll();


    coverageLayer.removeAll();


    focusBreakdownControls.classList.add(
      "hidden"
    );


    if (
      mode ===
      "normal"
    ) {

      normalModeButton.classList.add(
        "active"
      );


      mapAnalysisBadge.classList.add(
        "hidden"
      );


      analysisModeStatus.textContent =
        "Map Search enabled.";


      showNormalPanel();

    }


    if (
      mode ===
      "catchment"
    ) {

      catchmentModeButton.classList.add(
        "active"
      );


      mapAnalysisBadge.textContent =
        "Catchment Area — click a location";


      mapAnalysisBadge.classList.remove(
        "hidden"
      );


      analysisModeStatus.textContent =
        "Click a location to calculate 1, 2, 4 and 8 km catchments.";


      if (
        lastCatchmentPoint
      ) {

        runCatchment(
          lastCatchmentPoint
        );

      }
      else {

        showAnalysisMessage(
          "Catchment Area",
          "Click a point on the map."
        );

      }

    }


    if (
      mode ===
      "lens"
    ) {

      lensModeButton.classList.add(
        "active"
      );


      lensControls.classList.remove(
        "hidden"
      );


      showFixedLens();


      mapAnalysisBadge.textContent =
        "Focus Search";


      mapAnalysisBadge.classList.remove(
        "hidden"
      );


      analysisModeStatus.textContent =
        "Move the map beneath the fixed focus area.";


      updateLensSize();


      runFocusSearch();

    }


    if (
      mode ===
      "coverage"
    ) {

      coverageModeButton.classList.add(
        "active"
      );


      coverageControls.classList.remove(
        "hidden"
      );


      mapAnalysisBadge.textContent =
        "Coverage Gaps";


      mapAnalysisBadge.classList.remove(
        "hidden"
      );


      analysisModeStatus.textContent =
        "Choose a sport and radius to identify areas outside facility coverage.";


      showAnalysisMessage(
        "Coverage Gaps",
        "Choose a sport and coverage radius."
      );


      refreshCoverage();

    }

  }


  // =========================================================
  // MAP CLICK
  // =========================================================

  view.on(
    "click",
    function (
      event
    ) {

      if (
        analysisMode ===
        "catchment"
      ) {

        runCatchment(
          event.mapPoint
        );


        return;

      }


      if (
        analysisMode !==
        "normal"
      ) {

        return;

      }


      selectFacilityFromClick(
        event
      );

    }
  );


  // =========================================================
  // MAP SEARCH
  // =========================================================

  async function selectFacilityFromClick(
    event
  ) {

    const clickedPoint =
      event.mapPoint;


    const topLeft =
      view.toMap({

        x:
          event.x -
          CLICK_TOLERANCE_PIXELS,

        y:
          event.y -
          CLICK_TOLERANCE_PIXELS

      });


    const bottomRight =
      view.toMap({

        x:
          event.x +
          CLICK_TOLERANCE_PIXELS,

        y:
          event.y +
          CLICK_TOLERANCE_PIXELS

      });


    if (
      !topLeft ||
      !bottomRight
    ) {

      return;

    }


    const extent =
      new Extent({

        xmin:
          Math.min(
            topLeft.x,
            bottomRight.x
          ),

        ymin:
          Math.min(
            topLeft.y,
            bottomRight.y
          ),

        xmax:
          Math.max(
            topLeft.x,
            bottomRight.x
          ),

        ymax:
          Math.max(
            topLeft.y,
            bottomRight.y
          ),

        spatialReference:
          view.spatialReference

      });


    const query =
      facilitiesLayer.createQuery();


    query.geometry =
      extent;


    query.spatialRelationship =
      "intersects";


    query.where =
      buildAnalysisWhere();


    query.returnGeometry =
      true;


    query.outFields =
      ["*"];


    const response =
      await facilitiesLayer.queryFeatures(
        query
      );


    const nearby =
      response.features ||
      [];


    if (
      nearby.length ===
      0
    ) {

      clearSelection();

      return;

    }


    const overlapping =
      nearby.filter(
        function (
          feature
        ) {

          try {

            return (
              geometryEngine.intersects(
                feature.geometry,
                clickedPoint
              )
            );

          }
          catch {

            return false;

          }

        }
      );


    if (
      overlapping.length >
      0
    ) {

      overlapping.sort(
        function (
          a,
          b
        ) {

          return (
            getPolygonArea(
              a.geometry
            ) -
            getPolygonArea(
              b.geometry
            )
          );

        }
      );


      selectFacilities(
        overlapping
      );


      return;

    }


    let nearest =
      nearby[0];


    let shortest =
      Infinity;


    nearby.forEach(
      function (
        feature
      ) {

        try {

          const distance =
            geometryEngine.distance(
              clickedPoint,
              feature.geometry,
              "meters"
            );


          if (
            distance <
            shortest
          ) {

            shortest =
              distance;


            nearest =
              feature;

          }

        }
        catch {
          // continue
        }

      }
    );


    selectFacilities(
      [nearest]
    );

  }


  // =========================================================
  // CATCHMENT AREA
  // =========================================================

  async function runCatchment(
    point
  ) {

    if (!point) {

      return;

    }


    lastCatchmentPoint =
      point;


    const requestId =
      ++catchmentRequestId;


    analysisLayer.removeAll();


    const buffers =
      CATCHMENT_RADII.map(
        function (
          radius
        ) {

          return (
            geometryEngine.geodesicBuffer(
              point,
              radius,
              "kilometers"
            )
          );

        }
      );


    buffers
      .slice()
      .reverse()
      .forEach(
        function (
          buffer
        ) {

          analysisLayer.add(

            new Graphic({

              geometry:
                buffer,


              symbol: {

                type:
                  "simple-fill",


                color: [
                  0,
                  140,
                  105,
                  0.035
                ],


                outline: {

                  color: [
                    0,
                    115,
                    85,
                    0.9
                  ],


                  width:
                    1.7

                }

              }

            })

          );

        }
      );


    analysisLayer.add(

      new Graphic({

        geometry:
          point,


        symbol: {

          type:
            "simple-marker",


          size:
            11,


          color: [
            0,
            105,
            78
          ],


          outline: {

            color:
              "white",


            width:
              2

          }

        }

      })

    );


    showCatchmentLoading();


    const query =
      facilitiesLayer.createQuery();


    query.geometry =
      buffers[3];


    query.spatialRelationship =
      "intersects";


    query.where =
      buildAnalysisWhere();


    query.returnGeometry =
      true;


    query.outFields = [
      "OBJECTID",
      "Sport",
      "Infrastructure_Type"
    ];


    try {

      const response =
        await facilitiesLayer.queryFeatures(
          query
        );


      if (
        requestId !==
        catchmentRequestId
      ) {

        return;

      }


      const features =
        deduplicateFeatures(
          response.features
        );


      const results =
        buffers.map(
          function (
            buffer
          ) {

            return (
              features.filter(
                function (
                  feature
                ) {

                  const centre =
                    getGeometryCentre(
                      feature.geometry
                    );


                  return (
                    centre &&
                    geometryEngine.intersects(
                      buffer,
                      centre
                    )
                  );

                }
              )
            );

          }
        );


      renderCatchmentResults(
        results
      );

    }
    catch (
      error
    ) {

      console.error(
        "CATCHMENT ERROR:",
        error
      );

    }

  }


  function showCatchmentLoading() {

    rightPanelHeading.textContent =
      "Catchment Area";


    showAnalysisPanel();


    focusBreakdownControls.classList.add(
      "hidden"
    );


    summaryBlock.classList.add(
      "hidden"
    );


    analysisTitle.textContent =
      "Facility catchment";


    analysisSubtitle.textContent =
      "Counting facilities…";


    analysisTotals.innerHTML =
      `
        <div class="analysis-total-card">
            <span>Within 1 km</span>
            <strong>…</strong>
        </div>

        <div class="analysis-total-card">
            <span>Within 2 km</span>
            <strong>…</strong>
        </div>

        <div class="analysis-total-card">
            <span>Within 4 km</span>
            <strong>…</strong>
        </div>

        <div class="analysis-total-card">
            <span>Within 8 km</span>
            <strong>…</strong>
        </div>
      `;


    analysisTableContainer.innerHTML =
      "";

  }


  function renderCatchmentResults(
    results
  ) {

    analysisTitle.textContent =
      "Facility catchment";


    analysisSubtitle.textContent =
      "All sport categories are shown. Red zeroes highlight missing provision.";


    analysisTotals.innerHTML =
      CATCHMENT_RADII.map(
        function (
          radius,
          index
        ) {

          return `
            <div class="analysis-total-card">

                <span>
                    Within ${radius} km
                </span>

                <strong>
                    ${results[index].length}
                </strong>

            </div>
          `;

        }
      ).join(
        ""
      );


    let html =
      `
        <table class="analysis-table">

            <thead>

                <tr>
                    <th>Sport</th>
                    <th>1 km</th>
                    <th>2 km</th>
                    <th>4 km</th>
                    <th>8 km</th>
                </tr>

            </thead>

            <tbody>
      `;


    allSportValues
      .slice()
      .sort(
        function (
          a,
          b
        ) {

          return (
            a.name.localeCompare(
              b.name
            )
          );

        }
      )
      .forEach(
        function (
          sport
        ) {

          const counts =
            results.map(
              function (
                list
              ) {

                return (
                  list.filter(
                    function (
                      feature
                    ) {

                      return (
                        feature.attributes.Sport ===
                        sport.code
                      );

                    }
                  ).length
                );

              }
            );


          html +=
            `
              <tr>

                  <td>
                      ${escapeHtml(
                        displaySportName(
                          sport.name
                        )
                      )}
                  </td>

                  ${counts.map(
                    function (
                      count
                    ) {

                      return `
                        <td class="${
                          count === 0
                            ? "zero-result"
                            : ""
                        }">
                            ${count}
                        </td>
                      `;

                    }
                  ).join("")}

              </tr>
            `;

        }
      );


    html +=
      `
            </tbody>

        </table>
      `;


    analysisTableContainer.innerHTML =
      html;

  }


  // =========================================================
  // LIVE MAP WATCHERS
  // =========================================================

  function scheduleFocusRefresh() {

    if (
      analysisMode !==
      "lens"
    ) {

      return;

    }


    updateLensSize();


    lensLoading.classList.remove(
      "hidden"
    );


    clearTimeout(
      lensRefreshTimer
    );


    lensRefreshTimer =
      setTimeout(
        runFocusSearch,
        LIVE_FOCUS_DELAY
      );

  }


  view.watch(
    "center",
    scheduleFocusRefresh
  );


  view.watch(
    "resolution",
    scheduleFocusRefresh
  );


  view.watch(
    "stationary",
    function (
      stationary
    ) {

      if (!stationary) {

        return;

      }


      refreshSportIcons();


      if (
        analysisMode ===
        "coverage"
      ) {

        refreshCoverage();

      }

    }
  );


  // =========================================================
  // FOCUS SEARCH
  // =========================================================

  async function runFocusSearch() {

    if (
      analysisMode !==
      "lens"
    ) {

      return;

    }


    const requestId =
      ++lensRequestId;


    updateLensSize();


    const buffer =
      geometryEngine.geodesicBuffer(
        view.center,
        lensRadiusKm,
        "kilometers"
      );


    const query =
      facilitiesLayer.createQuery();


    query.geometry =
      buffer;


    query.spatialRelationship =
      "intersects";


    query.where =
      buildAnalysisWhere();


    query.returnGeometry =
      true;


    query.outFields = [
      "OBJECTID",
      "Sport",
      "Infrastructure_Type",
      "Owner",
      "Surface",
      "Facility_Size",
      "Floodlights"
    ];


    try {

      const response =
        await facilitiesLayer.queryFeatures(
          query
        );


      if (
        requestId !==
        lensRequestId
      ) {

        return;

      }


      lastFocusFeatures =
        deduplicateFeatures(
          response.features
        ).filter(
          function (
            feature
          ) {

            const centre =
              getGeometryCentre(
                feature.geometry
              );


            return (
              centre &&
              geometryEngine.intersects(
                buffer,
                centre
              )
            );

          }
        );


      lensLoading.classList.add(
        "hidden"
      );


      const sportCounts =
        countByField(
          lastFocusFeatures,
          "Sport"
        );


      renderLens(
        lastFocusFeatures.length,
        sportCounts
      );


      renderFocusPanel();

    }
    catch (
      error
    ) {

      console.error(
        "FOCUS SEARCH ERROR:",
        error
      );

    }

  }


  function renderFocusPanel() {

    rightPanelHeading.textContent =
      "Focus Search";


    showAnalysisPanel();


    focusBreakdownControls.classList.remove(
      "hidden"
    );


    summaryBlock.classList.remove(
      "hidden"
    );


    analysisTitle.textContent =
      `${lensRadiusKm} km focus area`;


    analysisSubtitle.textContent =
      "Live summary of facilities inside the current focus area.";


    const sportCounts =
      countByField(
        lastFocusFeatures,
        "Sport"
      );


    analysisTotals.innerHTML =
      `
        <div class="analysis-total-card">

            <span>
                Facilities
            </span>

            <strong>
                ${lastFocusFeatures.length}
            </strong>

        </div>

        <div class="analysis-total-card">

            <span>
                Sports represented
            </span>

            <strong>
                ${Object.keys(sportCounts).length}
            </strong>

        </div>
      `;


    analysisTableContainer.innerHTML =
      "";


    renderFocusBreakdown();

  }


  function renderFocusBreakdown() {

    if (
      analysisMode !==
      "lens"
    ) {

      return;

    }


    const field =
      focusBreakdownField.value;


    const headingNames = {

      "Sport":
        "Sports",

      "Infrastructure_Type":
        "Facility types",

      "Owner":
        "Ownership types",

      "Surface":
        "Surface types",

      "Facility_Size":
        "Facility sizes",

      "Floodlights":
        "Floodlights"

    };


    summaryHeading.textContent =
      headingNames[field] ||
      "Results";


    const counts =
      countByField(
        lastFocusFeatures,
        field
      );


    let entries =
      Object.entries(
        counts
      ).sort(
        function (
          a,
          b
        ) {

          return (
            b[1] -
            a[1]
          );

        }
      );


    const limit =
      focusResultsLimit.value;


    if (
      limit !==
      "all"
    ) {

      entries =
        entries.slice(
          0,
          Number(
            limit
          )
        );

    }


    analysisSummary.innerHTML =
      entries.map(
        function (
          entry,
          index
        ) {

          let label =
            entry[0];


          if (
            field ===
            "Sport"
          ) {

            label =
              displaySportName(
                label
              );

          }


          if (
            field ===
            "Floodlights"
          ) {

            label =
              formatFloodlights(
                label
              );

          }


          const colour =
            field === "Sport"
              ? (
                  sportColours[
                    entry[0]
                  ] ||
                  [
                    130,
                    130,
                    130
                  ]
                )
              : breakdownColours[
                  index %
                  breakdownColours.length
                ];


          return `
            <div class="analysis-summary-row">

                <span
                    class="analysis-swatch"
                    style="background:rgb(${colour.join(",")})"
                ></span>

                <span>
                    ${escapeHtml(label)}
                </span>

                <strong>
                    ${entry[1]}
                </strong>

            </div>
          `;

        }
      ).join(
        ""
      );

  }


  // =========================================================
  // FOCUS LENS
  // =========================================================

  function showFixedLens() {

    fixedLens.classList.remove(
      "hidden"
    );

  }


  function hideFixedLens() {

    fixedLens.classList.add(
      "hidden"
    );

  }


  function updateLensSize() {

    if (
      analysisMode !==
      "lens"
    ) {

      return;

    }


    const buffer =
      geometryEngine.geodesicBuffer(
        view.center,
        lensRadiusKm,
        "kilometers"
      );


    if (
      !buffer ||
      !buffer.extent
    ) {

      return;

    }


    const extent =
      buffer.extent;


    const left =
      new Point({

        x:
          extent.xmin,

        y:
          extent.center.y,

        spatialReference:
          extent.spatialReference

      });


    const right =
      new Point({

        x:
          extent.xmax,

        y:
          extent.center.y,

        spatialReference:
          extent.spatialReference

      });


    const leftScreen =
      view.toScreen(
        left
      );


    const rightScreen =
      view.toScreen(
        right
      );


    if (
      !leftScreen ||
      !rightScreen
    ) {

      return;

    }


    const diameter =
      Math.abs(
        rightScreen.x -
        leftScreen.x
      );


    fixedLens.dataset.diameter =
      diameter;


    fixedLens.style.width =
      diameter +
      "px";


    fixedLens.style.height =
      diameter +
      "px";


    lensSvg.style.width =
      diameter +
      150 +
      "px";


    lensSvg.style.height =
      diameter +
      150 +
      "px";

  }


  function renderLens(
    total,
    sportCounts
  ) {

    lensTotal.textContent =
      total;


    lensSvg.innerHTML =
      "";


    const diameter =
      Number(
        fixedLens.dataset.diameter
      ) ||
      0;


    if (
      diameter <
      170
    ) {

      lensSvg.style.display =
        "none";


      fixedLens.classList.add(
        "compact-lens"
      );


      return;

    }


    lensSvg.style.display =
      "block";


    fixedLens.classList.remove(
      "compact-lens"
    );


    const entries =
      topEntries(
        sportCounts,
        8
      );


    if (
      entries.length ===
      0
    ) {

      return;

    }


    const compact =
      diameter <
      280;


    const centre =
      210;


    const baseRadius =
      compact
        ? 135
        : 148;


    const maxExtra =
      compact
        ? 42
        : 72;


    const maximum =
      Math.max(
        ...entries.map(
          function (
            entry
          ) {

            return entry[1];

          }
        )
      );


    const angleStep =
      Math.PI *
      2 /
      entries.length;


    entries.forEach(
      function (
        entry,
        index
      ) {

        const sport =
          entry[0];


        const value =
          entry[1];


        const angle =
          angleStep *
          index -
          Math.PI /
          2;


        const extra =
          Math.max(

            compact
              ? 14
              : 24,

            value /
            maximum *
            maxExtra

          );


        const colour =
          sportColours[
            sport
          ] ||
          [
            125,
            125,
            125
          ];


        const startX =
          centre +
          Math.cos(angle) *
          baseRadius;


        const startY =
          centre +
          Math.sin(angle) *
          baseRadius;


        const endX =
          centre +
          Math.cos(angle) *
          (
            baseRadius +
            extra
          );


        const endY =
          centre +
          Math.sin(angle) *
          (
            baseRadius +
            extra
          );


        const halo =
          createSvg(
            "line"
          );


        halo.setAttribute(
          "x1",
          startX
        );


        halo.setAttribute(
          "y1",
          startY
        );


        halo.setAttribute(
          "x2",
          endX
        );


        halo.setAttribute(
          "y2",
          endY
        );


        halo.setAttribute(
          "stroke",
          "white"
        );


        halo.setAttribute(
          "stroke-width",
          compact
            ? "20"
            : "27"
        );


        halo.setAttribute(
          "stroke-linecap",
          "round"
        );


        lensSvg.appendChild(
          halo
        );


        const bar =
          createSvg(
            "line"
          );


        bar.setAttribute(
          "x1",
          startX
        );


        bar.setAttribute(
          "y1",
          startY
        );


        bar.setAttribute(
          "x2",
          endX
        );


        bar.setAttribute(
          "y2",
          endY
        );


        bar.setAttribute(
          "stroke",
          `rgb(${colour.join(",")})`
        );


        bar.setAttribute(
          "stroke-width",
          compact
            ? "12"
            : "18"
        );


        bar.setAttribute(
          "stroke-linecap",
          "round"
        );


        lensSvg.appendChild(
          bar
        );


        const labelRadius =
          baseRadius +
          extra +
          (
            compact
              ? 18
              : 32
          );


        const label =
          createSvg(
            "text"
          );


        label.setAttribute(
          "x",
          centre +
          Math.cos(angle) *
          labelRadius
        );


        label.setAttribute(
          "y",
          centre +
          Math.sin(angle) *
          labelRadius
        );


        label.setAttribute(
          "text-anchor",
          "middle"
        );


        label.setAttribute(
          "dominant-baseline",
          "middle"
        );


        label.setAttribute(
          "class",
          "radial-label"
        );


        label.textContent =
          compact
            ? String(value)
            : `${displaySportName(sport)} ${value}`;


        lensSvg.appendChild(
          label
        );

      }
    );

  }


  // =========================================================
  // COVERAGE GAPS
  // =========================================================

  async function refreshCoverage() {

    coverageLayer.removeAll();


    if (
      analysisMode !==
      "coverage"
    ) {

      return;

    }


    coverageSport =
      coverageSportSelect.value;


    coverageRadiusKm =
      Number(
        coverageRadiusSelect.value
      );


    if (
      !coverageSport
    ) {

      coverageStatus.textContent =
        "Select a sport to show coverage.";


      return;

    }


    if (
      view.zoom <
      COVERAGE_MIN_ZOOM
    ) {

      coverageStatus.textContent =
        "Zoom in further to display coverage circles.";


      return;

    }


    const requestId =
      ++coverageRequestId;


    const query =
      facilitiesLayer.createQuery();


    query.geometry =
      view.extent;


    query.spatialRelationship =
      "intersects";


    query.where =
      buildCoverageWhere();


    query.returnGeometry =
      true;


    query.outFields = [
      "OBJECTID",
      "Sport"
    ];


    const count =
      await facilitiesLayer.queryFeatureCount(
        query
      );


    if (
      requestId !==
      coverageRequestId
    ) {

      return;

    }


    if (
      count >
      COVERAGE_LIMIT
    ) {

      coverageStatus.textContent =
        `${count} facilities visible. Zoom in further.`;


      return;

    }


    const response =
      await facilitiesLayer.queryFeatures(
        query
      );


    if (
      requestId !==
      coverageRequestId
    ) {

      return;

    }


    const colour =
      sportColours[
        coverageSport
      ] ||
      [
        0,
        145,
        105
      ];


    const graphics =
      [];


    response.features.forEach(
      function (
        feature
      ) {

        const centre =
          getGeometryCentre(
            feature.geometry
          );


        if (!centre) {

          return;

        }


        const buffer =
          geometryEngine.geodesicBuffer(
            centre,
            coverageRadiusKm,
            "kilometers"
          );


        graphics.push(

          new Graphic({

            geometry:
              buffer,


            symbol: {

              type:
                "simple-fill",


              color: [
                colour[0],
                colour[1],
                colour[2],
                0.12
              ],


              outline: {

                color: [
                  colour[0],
                  colour[1],
                  colour[2],
                  0.65
                ],


                width:
                  1.4

              }

            }

          })

        );

      }
    );


    coverageLayer.addMany(
      graphics
    );


    coverageStatus.textContent =
      `${graphics.length} facilities shown with ${coverageRadiusKm} km coverage.`;


    rightPanelHeading.textContent =
      "Coverage Gaps";


    showAnalysisPanel();


    focusBreakdownControls.classList.add(
      "hidden"
    );


    summaryBlock.classList.add(
      "hidden"
    );


    analysisTitle.textContent =
      "Coverage Gaps";


    analysisSubtitle.textContent =
      `${displaySportName(coverageSport)} facilities with ${coverageRadiusKm} km straight-line coverage.`;


    analysisTotals.innerHTML =
      `
        <div class="analysis-total-card">

            <span>
                Facilities shown
            </span>

            <strong>
                ${graphics.length}
            </strong>

        </div>

        <div class="analysis-total-card">

            <span>
                Radius
            </span>

            <strong>
                ${coverageRadiusKm} km
            </strong>

        </div>
      `;


    analysisTableContainer.innerHTML =
      "";

  }


  function buildCoverageWhere() {

    const clauses = [

      PRIVATE_RESIDENCE_WHERE,

      "Sport = '" +
      escapeSql(
        coverageSport
      ) +
      "'"

    ];


    addCheckboxClause(
      clauses,
      "Owner",
      ".owner-filter"
    );


    addCheckboxClause(
      clauses,
      "Surface",
      ".surface-filter"
    );


    addCheckboxClause(
      clauses,
      "Floodlights",
      ".floodlight-filter"
    );


    return (
      clauses.join(
        " AND "
      )
    );

  }


  // =========================================================
  // SELECT FACILITIES
  // =========================================================

  function selectFacilities(
    graphics
  ) {

    clearSelection();


    selectedGraphics =
      graphics;


    selectedIndex =
      0;


    const ids =
      graphics
        .map(
          function (
            feature
          ) {

            return (
              feature.getObjectId()
            );

          }
        )
        .filter(
          function (
            id
          ) {

            return (
              id !== undefined &&
              id !== null
            );

          }
        );


    if (
      facilitiesLayerView &&
      ids.length >
      0
    ) {

      highlightHandle =
        facilitiesLayerView.highlight(
          ids
        );

    }


    drawSelectedPolygons();


    showCurrentFacility();

  }


  function drawSelectedPolygons() {

    selectionGraphicsLayer.removeAll();


    selectedGraphics.forEach(
      function (
        feature,
        index
      ) {

        selectionGraphicsLayer.add(

          new Graphic({

            geometry:
              feature.geometry,


            symbol: {

              type:
                "simple-fill",


              color: [
                0,
                190,
                170,
                index === selectedIndex
                  ? 0.14
                  : 0.04
              ],


              outline: {

                color:
                  index === selectedIndex
                    ? [
                        0,
                        70,
                        60
                      ]
                    : [
                        0,
                        205,
                        180
                      ],


                width:
                  index === selectedIndex
                    ? 4
                    : 3

              }

            }

          })

        );

      }
    );

  }


  function showCurrentFacility() {

    selectedGraphic =
      selectedGraphics[
        selectedIndex
      ];


    drawSelectedPolygons();


    showFacilityDetails(
      selectedGraphic.attributes
    );


    selectionNavigator.classList.toggle(
      "hidden",
      selectedGraphics.length <=
      1
    );


    selectionPosition.textContent =
      `${selectedIndex + 1} of ${selectedGraphics.length}`;

  }


  previousFacility.addEventListener(
    "click",
    function () {

      if (
        selectedGraphics.length ===
        0
      ) {

        return;

      }


      selectedIndex =
        (
          selectedIndex -
          1 +
          selectedGraphics.length
        ) %
        selectedGraphics.length;


      showCurrentFacility();

    }
  );


  nextFacility.addEventListener(
    "click",
    function () {

      if (
        selectedGraphics.length ===
        0
      ) {

        return;

      }


      selectedIndex =
        (
          selectedIndex +
          1
        ) %
        selectedGraphics.length;


      showCurrentFacility();

    }
  );


  // =========================================================
  // FACILITY DETAILS
  // =========================================================

  function showFacilityDetails(
    a
  ) {

    rightPanelHeading.textContent =
      "Facility details";


    emptyState.classList.add(
      "hidden"
    );


    analysisDetails.classList.add(
      "hidden"
    );


    facilityDetails.classList.remove(
      "hidden"
    );


    let title =
      cleanValue(
        a.Owner_Name
      );


    if (
      title ===
      "Not recorded"
    ) {

      title =
        `${cleanValue(a.Sport)} - ${cleanValue(a.Infrastructure_Type)}`;

    }


    setText(
      "detailTitle",
      title
    );


    setText(
      "detailSportTag",
      displaySportName(
        a.Sport
      )
    );


    const sportColour =
      sportColours[
        a.Sport
      ] ||
      [
        130,
        130,
        130
      ];


    document
      .getElementById(
        "detailSportTag"
      )
      .style.background =
      `rgb(${sportColour.join(",")})`;


    setText(
      "detailTypeTag",
      cleanValue(
        a.Infrastructure_Type
      )
    );


    setText(
      "detailSport",
      displaySportName(
        a.Sport
      )
    );


    setText(
      "detailInfrastructure",
      cleanValue(
        a.Infrastructure_Type
      )
    );


    const pool =
      a.Sport === "Swimming Indoor" ||
      a.Sport === "Swimming Outdoor";


    poolLengthRow.classList.toggle(
      "hidden",
      !pool
    );


    poolBreadthRow.classList.toggle(
      "hidden",
      !pool
    );


    if (pool) {

      setText(
        "detailPoolLength",
        formatDimension(
          a.Pool_Length
        )
      );


      setText(
        "detailPoolBreadth",
        formatDimension(
          a.Pool_Breadth
        )
      );

    }


    setText(
      "detailSurface",
      cleanValue(
        a.Surface
      )
    );


    setText(
      "detailFloodlights",
      formatFloodlights(
        a.Floodlights
      )
    );


    setText(
      "detailOwner",
      cleanValue(
        a.Owner
      )
    );


    setText(
      "detailOwnerName",
      cleanValue(
        a.Owner_Name
      )
    );


    setText(
      "detailSize",
      cleanValue(
        a.Facility_Size
      )
    );


    setText(
      "detailQuality",
      formatQuality(
        a.Quality
      )
    );


    setText(
      "detailMultiUse",
      cleanValue(
        a.Multi_Use
      )
    );


    setText(
      "detailLA",
      titleCase(
        a.Local_Authority
      )
    );


    setText(
      "detailLEA",
      titleCase(
        a.LEA
      )
    );


    setText(
      "detailArea",
      formatArea(
        a.Area_msq
      )
    );

  }


  // =========================================================
  // PANELS
  // =========================================================

  function showNormalPanel() {

    rightPanelHeading.textContent =
      "Facility details";


    emptyState.classList.remove(
      "hidden"
    );


    facilityDetails.classList.add(
      "hidden"
    );


    analysisDetails.classList.add(
      "hidden"
    );

  }


  function showAnalysisPanel() {

    emptyState.classList.add(
      "hidden"
    );


    facilityDetails.classList.add(
      "hidden"
    );


    analysisDetails.classList.remove(
      "hidden"
    );

  }


  function showAnalysisMessage(
    title,
    subtitle
  ) {

    rightPanelHeading.textContent =
      title;


    showAnalysisPanel();


    focusBreakdownControls.classList.add(
      "hidden"
    );


    summaryBlock.classList.add(
      "hidden"
    );


    analysisTitle.textContent =
      title;


    analysisSubtitle.textContent =
      subtitle;


    analysisTotals.innerHTML =
      "";


    analysisTableContainer.innerHTML =
      "";

  }


  function clearAnalysis() {

    analysisLayer.removeAll();


    coverageLayer.removeAll();


    if (
      analysisMode ===
      "catchment"
    ) {

      lastCatchmentPoint =
        null;


      showAnalysisMessage(
        "Catchment Area",
        "Click a point on the map."
      );

    }


    if (
      analysisMode ===
      "coverage"
    ) {

      coverageSportSelect.value =
        "";


      coverageSport =
        "";


      showAnalysisMessage(
        "Coverage Gaps",
        "Choose a sport and coverage radius."
      );

    }

  }


  function clearSelection() {

    if (
      highlightHandle
    ) {

      highlightHandle.remove();


      highlightHandle =
        null;

    }


    selectionGraphicsLayer.removeAll();


    selectedGraphics =
      [];


    selectedGraphic =
      null;

  }


  // =========================================================
  // HELPERS
  // =========================================================

  function getField(
    name
  ) {

    return (
      facilitiesLayer.fields.find(
        function (
          field
        ) {

          return (
            field.name ===
            name
          );

        }
      )
    );

  }


  function getGeometryCentre(
    geometry
  ) {

    if (!geometry) {

      return null;

    }


    if (
      geometry.centroid
    ) {

      return geometry.centroid;

    }


    if (
      geometry.extent
    ) {

      return geometry.extent.center;

    }


    return null;

  }


  function deduplicateFeatures(
    features
  ) {

    const ids =
      new Set();


    return (
      features.filter(
        function (
          feature
        ) {

          const id =
            feature.attributes.OBJECTID;


          if (
            ids.has(
              id
            )
          ) {

            return false;

          }


          ids.add(
            id
          );


          return true;

        }
      )
    );

  }


  function countByField(
    features,
    field
  ) {

    const counts =
      {};


    features.forEach(
      function (
        feature
      ) {

        const value =
          cleanValue(
            feature.attributes[
              field
            ]
          );


        counts[value] =
          (
            counts[value] ||
            0
          ) +
          1;

      }
    );


    return counts;

  }


  function topEntries(
    counts,
    limit
  ) {

    return (
      Object.entries(
        counts
      )
        .sort(
          function (
            a,
            b
          ) {

            return (
              b[1] -
              a[1]
            );

          }
        )
        .slice(
          0,
          limit
        )
    );

  }


  function getPolygonArea(
    geometry
  ) {

    try {

      return (
        Math.abs(
          geometryEngine.geodesicArea(
            geometry,
            "square-meters"
          )
        )
      );

    }
    catch {

      return Infinity;

    }

  }


  function cleanValue(
    value
  ) {

    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === "NULL"
    ) {

      return "Not recorded";

    }


    return String(
      value
    );

  }


  function displaySportName(
    sport
  ) {

    return (
      sport === "Sports Hall"
        ? "Sports Halls"
        : cleanValue(
            sport
          )
    );

  }


  function formatFloodlights(
    value
  ) {

    if (
      value ===
      "Floodlights"
    ) {

      return "Yes";

    }


    if (
      value ===
      "No Floodlights"
    ) {

      return "No";

    }


    return cleanValue(
      value
    );

  }


  function formatDimension(
    value
  ) {

    const n =
      Number(
        value
      );


    return (
      Number.isFinite(
        n
      )
        ? n.toLocaleString(
            "en-IE",
            {
              maximumFractionDigits:
                1
            }
          ) +
          " m"
        : "Not recorded"
    );

  }


  function formatQuality(
    value
  ) {

    const labels = {

      1:
        "Poor",

      2:
        "Good / Satisfactory",

      3:
        "Excellent"

    };


    return (
      labels[value] ||
      cleanValue(
        value
      )
    );

  }


  function formatArea(
    value
  ) {

    const n =
      Number(
        value
      );


    if (
      !Number.isFinite(
        n
      )
    ) {

      return "Not recorded";

    }


    if (
      n >=
      10000
    ) {

      return (
        (
          n /
          10000
        ).toLocaleString(
          "en-IE",
          {
            maximumFractionDigits:
              2
          }
        ) +
        " ha"
      );

    }


    return (
      Math.round(
        n
      ).toLocaleString(
        "en-IE"
      ) +
      " m²"
    );

  }


  function titleCase(
    value
  ) {

    const text =
      cleanValue(
        value
      );


    if (
      text ===
      "Not recorded"
    ) {

      return text;

    }


    return (
      text
        .toLowerCase()
        .replace(
          /\b\w/g,
          function (
            letter
          ) {

            return (
              letter.toUpperCase()
            );

          }
        )
    );

  }


  function escapeSql(
    value
  ) {

    return (
      String(
        value
      ).replace(
        /'/g,
        "''"
      )
    );

  }


  function escapeHtml(
    value
  ) {

    return (
      String(
        value
      )
        .replace(
          /&/g,
          "&amp;"
        )
        .replace(
          /</g,
          "&lt;"
        )
        .replace(
          />/g,
          "&gt;"
        )
        .replace(
          /"/g,
          "&quot;"
        )
        .replace(
          /'/g,
          "&#039;"
        )
    );

  }


  function setText(
    id,
    value
  ) {

    const element =
      document.getElementById(
        id
      );


    if (element) {

      element.textContent =
        value;

    }

  }


  function createSvg(
    type
  ) {

    return (
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        type
      )
    );

  }

});
