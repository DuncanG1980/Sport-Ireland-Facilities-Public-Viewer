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
  geometryEngine
) {

  // =========================================================
  // SETTINGS
  // =========================================================

  const FACILITIES_URL =
    "https://services-eu1.arcgis.com/z1y55jruXrgzzpdi/arcgis/rest/services/Sport_Ireland_Facilities_Mapping/FeatureServer/0";

  const CLICK_TOLERANCE_PIXELS =
    14;

  const OSM_OPACITY =
    0.45;

  const IRELAND_CENTER =
    [-8, 53.4];

  const IRELAND_ZOOM =
    7;

  const AREA_DEBOUNCE_MS =
    450;

  const COVERAGE_MIN_ZOOM =
    9;

  const COVERAGE_LIMIT =
    700;


  // =========================================================
  // SPORTS
  // =========================================================

  const mainSports = [
    { value: "Gaelic Games", label: "Gaelic Games" },
    { value: "Soccer", label: "Soccer" },
    { value: "Golf", label: "Golf" },
    { value: "Tennis", label: "Tennis" },
    { value: "Basketball", label: "Basketball" },
    { value: "Athletics", label: "Athletics" },
    { value: "Hockey", label: "Hockey" },
    { value: "Cricket", label: "Cricket" },
    { value: "Sports Hall", label: "Sports Halls" },
    { value: "Swimming Indoor", label: "Swimming Indoor" }
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


  // =========================================================
  // RENDERER
  // =========================================================

  const rendererInfos =
    Object.entries(
      sportColours
    ).map(
      function (
        [sport, colour]
      ) {

        const isPool =
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
              isPool
                ? 0.62
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
                isPool
                  ? 3
                  : 2

            }

          }

        };

      }
    );


  // =========================================================
  // LAYERS
  // =========================================================

  const coverageLayer =
    new GraphicsLayer();


  const analysisLayer =
    new GraphicsLayer();


  const facilitiesLayer =
    new FeatureLayer({

      url:
        FACILITIES_URL,

      definitionExpression:
        "Owner <> 'Private Residence' OR Owner IS NULL",

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
        analysisLayer
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
        view

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

  let highlightHandle =
    null;

  let selectedGraphics =
    [];

  let selectedIndex =
    0;

  let selectedGraphic =
    null;

  let currentOverlayGraphic =
    null;


  let analysisMode =
    "normal";

  let areaRadiusKm =
    2;

  let areaTimer =
    null;

  let areaRequestId =
    0;

  let currentAreaPoint =
    null;


  let coverageRadiusKm =
    0;

  let coverageSport =
    "";

  let coverageRequestId =
    0;


  // =========================================================
  // DOM
  // =========================================================

  const resultCount =
    document.getElementById("resultCount");

  const mainSportFilters =
    document.getElementById("mainSportFilters");

  const moreSportFilters =
    document.getElementById("moreSportFilters");

  const ownerFilters =
    document.getElementById("ownerFilters");

  const surfaceFilters =
    document.getElementById("surfaceFilters");

  const floodlightFilters =
    document.getElementById("floodlightFilters");

  const selectAllFilters =
    document.getElementById("selectAllFilters");

  const deselectAllFilters =
    document.getElementById("deselectAllFilters");

  const legendItems =
    document.getElementById("legendItems");


  const normalModeButton =
    document.getElementById("normalModeButton");

  const catchmentModeButton =
    document.getElementById("catchmentModeButton");

  const areaModeButton =
    document.getElementById("areaModeButton");

  const areaRadiusControls =
    document.getElementById("areaRadiusControls");

  const areaRadiusSelect =
    document.getElementById("areaRadiusSelect");

  const coverageSportSelect =
    document.getElementById("coverageSportSelect");

  const coverageRadiusSelect =
    document.getElementById("coverageRadiusSelect");

  const coverageStatus =
    document.getElementById("coverageStatus");

  const analysisModeStatus =
    document.getElementById("analysisModeStatus");


  const areaLens =
    document.getElementById("areaLens");

  const areaLensSvg =
    document.getElementById("areaLensSvg");

  const lensTotal =
    document.getElementById("lensTotal");

  const lensLoading =
    document.getElementById("lensLoading");

  const mapAnalysisBadge =
    document.getElementById("mapAnalysisBadge");


  const rightPanelHeading =
    document.getElementById("rightPanelHeading");

  const emptyState =
    document.getElementById("emptyState");

  const facilityDetails =
    document.getElementById("facilityDetails");

  const analysisDetails =
    document.getElementById("analysisDetails");

  const analysisTitle =
    document.getElementById("analysisTitle");

  const analysisSubtitle =
    document.getElementById("analysisSubtitle");

  const analysisTotals =
    document.getElementById("analysisTotals");

  const analysisSportSummary =
    document.getElementById("analysisSportSummary");

  const analysisTableContainer =
    document.getElementById("analysisTableContainer");

  const analysisLoading =
    document.getElementById("analysisLoading");

  const analysisEmptyMessage =
    document.getElementById("analysisEmptyMessage");

  const clearAnalysisButton =
    document.getElementById("clearAnalysisButton");


  const selectionNavigator =
    document.getElementById("selectionNavigator");

  const selectionPosition =
    document.getElementById("selectionPosition");

  const previousFacility =
    document.getElementById("previousFacility");

  const nextFacility =
    document.getElementById("nextFacility");

  const closeDetails =
    document.getElementById("closeDetails");

  const zoomToFacility =
    document.getElementById("zoomToFacility");

  const homeButton =
    document.getElementById("homeButton");

  const poolLengthRow =
    document.getElementById("poolLengthRow");

  const poolBreadthRow =
    document.getElementById("poolBreadthRow");


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

      setupAnalysisControls();


      await updateResultCount();

    }
  );


  // =========================================================
  // FILTER UI
  // =========================================================

  function buildSportFilters() {

    const field =
      facilitiesLayer.fields.find(
        function (
          item
        ) {

          return (
            item.name ===
            "Sport"
          );

        }
      );


    if (
      !field ||
      !field.domain
    ) {

      return;

    }


    const values =
      field.domain.codedValues;


    const mainValues =
      mainSports.map(
        function (
          sport
        ) {

          return (
            sport.value
          );

        }
      );


    mainSports.forEach(
      function (
        sport
      ) {

        const match =
          values.find(
            function (
              value
            ) {

              return (
                value.code ===
                  sport.value ||
                value.name ===
                  sport.value
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


    values
      .filter(
        function (
          value
        ) {

          return (
            !mainValues.includes(
              value.code
            ) &&
            !mainValues.includes(
              value.name
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
          value
        ) {

          addSportCheckbox(
            value,
            moreSportFilters,
            value.name
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
      document.createElement("label");


    label.className =
      "checkbox-item";


    const checkbox =
      document.createElement("input");


    checkbox.type =
      "checkbox";


    checkbox.value =
      value.code;


    checkbox.checked =
      true;


    checkbox.className =
      "sport-filter";


    const square =
      document.createElement("span");


    square.className =
      "colour-square";


    const colour =
      sportColours[value.code] ||
      sportColours[value.name] ||
      [145, 145, 145];


    square.style.background =
      `rgb(${colour.join(",")})`;


    const text =
      document.createElement("span");


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


  function buildDomainFilter(
    fieldName,
    container,
    className
  ) {

    const field =
      facilitiesLayer.fields.find(
        function (
          item
        ) {

          return (
            item.name ===
            fieldName
          );

        }
      );


    if (
      !field ||
      !field.domain
    ) {

      return;

    }


    field.domain.codedValues.forEach(
      function (
        value
      ) {

        if (
          fieldName ===
            "Owner" &&
          (
            value.code ===
              "Private Residence" ||
            value.name ===
              "Private Residence"
          )
        ) {

          return;

        }


        const label =
          document.createElement("label");


        label.className =
          "checkbox-item";


        const checkbox =
          document.createElement("input");


        checkbox.type =
          "checkbox";


        checkbox.value =
          value.code;


        checkbox.checked =
          true;


        checkbox.className =
          className;


        const text =
          document.createElement("span");


        text.textContent =
          value.name;


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

            const hidden =
              list.classList.contains(
                "hidden"
              );


            list.classList.toggle(
              "hidden",
              !hidden
            );


            arrow.textContent =
              hidden
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

    mainSports.forEach(
      function (
        sport
      ) {

        const row =
          document.createElement("div");


        row.className =
          "legend-item";


        const square =
          document.createElement("span");


        square.className =
          "legend-colour";


        const colour =
          sportColours[sport.value];


        square.style.background =
          `rgb(${colour.join(",")})`;


        const label =
          document.createElement("span");


        label.textContent =
          sport.label;


        row.appendChild(
          square
        );


        row.appendChild(
          label
        );


        legendItems.appendChild(
          row
        );

      }
    );

  }


  // =========================================================
  // COVERAGE SPORT LIST
  // =========================================================

  function buildCoverageSportList() {

    const field =
      facilitiesLayer.fields.find(
        function (
          item
        ) {

          return (
            item.name ===
            "Sport"
          );

        }
      );


    if (
      !field ||
      !field.domain
    ) {

      return;

    }


    field.domain.codedValues
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
  // FILTERING
  // =========================================================

  async function applyFilters() {

    const where =
      buildCurrentFilterWhere();


    facilitiesLayerView.filter = {

      where:
        where

    };


    clearSelection();


    await updateResultCount();


    if (
      analysisMode ===
        "area" &&
      currentAreaPoint
    ) {

      scheduleAreaQuery(
        currentAreaPoint
      );

    }

  }


  function buildCurrentFilterWhere() {

    const clauses =
      [];


    addCheckboxClause(
      clauses,
      "Sport",
      ".sport-filter"
    );


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


    const allSelectors = [
      ".sport-filter",
      ".owner-filter",
      ".surface-filter",
      ".floodlight-filter"
    ];


    const checkedTotal =
      allSelectors.reduce(
        function (
          total,
          selector
        ) {

          return (
            total +
            document.querySelectorAll(
              selector +
              ":checked"
            ).length
          );

        },
        0
      );


    if (
      checkedTotal ===
      0
    ) {

      return (
        "1=0"
      );

    }


    return (
      clauses.length
        ? clauses.join(
            " AND "
          )
        : "1=1"
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
      checked.length ===
        0 ||
      checked.length ===
        all.length
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
            String(
              item.value
            ).replace(
              /'/g,
              "''"
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
  // SELECT ALL
  // =========================================================

  selectAllFilters.addEventListener(
    "click",
    async function () {

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


      facilitiesLayerView.filter =
        null;


      await updateResultCount();

    }
  );


  deselectAllFilters.addEventListener(
    "click",
    async function () {

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


      facilitiesLayerView.filter = {

        where:
          "1=0"

      };


      await updateResultCount();

    }
  );


  async function updateResultCount() {

    const query =
      facilitiesLayer.createQuery();


    query.where =
      facilitiesLayerView &&
      facilitiesLayerView.filter
        ? facilitiesLayerView.filter.where
        : "1=1";


    const count =
      await facilitiesLayer.queryFeatureCount(
        query
      );


    resultCount.textContent =
      count.toLocaleString(
        "en-IE"
      ) +
      " facilities";

  }


  // =========================================================
  // ANALYSIS MODES
  // =========================================================

  function setupAnalysisControls() {

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


    areaModeButton.addEventListener(
      "click",
      function () {

        setMode(
          "area"
        );

      }
    );


    areaRadiusSelect.addEventListener(
      "change",
      function () {

        areaRadiusKm =
          Number(
            areaRadiusSelect.value
          );


        mapAnalysisBadge.textContent =
          `Area Explorer — ${areaRadiusKm} km`;

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


    clearAnalysisButton.addEventListener(
      "click",
      clearAnalysis
    );

  }


  function setMode(
    mode
  ) {

    analysisMode =
      mode;


    normalModeButton.classList.toggle(
      "active",
      mode ===
        "normal"
    );


    catchmentModeButton.classList.toggle(
      "active",
      mode ===
        "catchment"
    );


    areaModeButton.classList.toggle(
      "active",
      mode ===
        "area"
    );


    areaRadiusControls.classList.toggle(
      "hidden",
      mode !==
        "area"
    );


    areaLens.classList.add(
      "hidden"
    );


    analysisLayer.removeAll();


    if (
      mode ===
      "normal"
    ) {

      mapAnalysisBadge.classList.add(
        "hidden"
      );


      analysisModeStatus.textContent =
        "Normal facility selection enabled.";


      showNormalPanel();

    }


    if (
      mode ===
      "catchment"
    ) {

      mapAnalysisBadge.textContent =
        "Catchment — click a location";


      mapAnalysisBadge.classList.remove(
        "hidden"
      );


      analysisModeStatus.textContent =
        "Click the map for 1 km, 2 km, 4 km and 8 km counts.";


      showAnalysisMessage(
        "Catchment",
        "Click a location on the map."
      );

    }


    if (
      mode ===
      "area"
    ) {

      mapAnalysisBadge.textContent =
        `Area Explorer — ${areaRadiusKm} km`;


      mapAnalysisBadge.classList.remove(
        "hidden"
      );


      analysisModeStatus.textContent =
        "Move the lens around the map. Results update after you pause.";


      showAnalysisMessage(
        "Area Explorer",
        "Move the lens over the map."
      );

    }

  }


  // =========================================================
  // SMOOTH AREA LENS
  // =========================================================

  view.on(
    "pointer-move",
    function (
      event
    ) {

      if (
        analysisMode !==
        "area"
      ) {

        return;

      }


      const point =
        view.toMap({

          x:
            event.x,

          y:
            event.y

        });


      if (!point) {
        return;
      }


      currentAreaPoint =
        point;


      // Move instantly.
      moveLens(
        event.x,
        event.y
      );


      // Query only after mouse pauses.
      scheduleAreaQuery(
        point
      );

    }
  );


  function moveLens(
    x,
    y
  ) {

    areaLens.classList.remove(
      "hidden"
    );


    areaLens.style.left =
      x + "px";


    areaLens.style.top =
      y + "px";


    // Approximate geographic radius using view resolution.
    const resolution =
      view.resolution ||
      10;


    let radiusPixels =
      (
        areaRadiusKm *
        1000
      ) /
      resolution;


    radiusPixels =
      Math.max(
        85,
        Math.min(
          230,
          radiusPixels
        )
      );


    areaLens.style.width =
      radiusPixels *
      2 +
      "px";


    areaLens.style.height =
      radiusPixels *
      2 +
      "px";

  }


  function scheduleAreaQuery(
    point
  ) {

    if (
      areaTimer
    ) {

      clearTimeout(
        areaTimer
      );

    }


    lensLoading.classList.remove(
      "hidden"
    );


    areaTimer =
      setTimeout(
        function () {

          runAreaQuery(
            point
          );

        },
        AREA_DEBOUNCE_MS
      );

  }


  async function runAreaQuery(
    point
  ) {

    const requestId =
      ++areaRequestId;


    const query =
      facilitiesLayer.createQuery();


    query.geometry =
      point;


    query.distance =
      areaRadiusKm;


    query.units =
      "kilometers";


    query.where =
      buildCurrentFilterWhere();


    query.returnGeometry =
      false;


    query.outFields = [
      "Sport"
    ];


    try {

      const response =
        await facilitiesLayer.queryFeatures(
          query
        );


      if (
        requestId !==
        areaRequestId
      ) {

        return;

      }


      lensLoading.classList.add(
        "hidden"
      );


      const features =
        response.features;


      renderLensChart(
        features
      );


      renderAreaPanel(
        features
      );

    }
    catch (
      error
    ) {

      console.error(
        error
      );

    }

  }


  // =========================================================
  // RADIAL CHART
  // =========================================================

  function renderLensChart(
    features
  ) {

    const counts =
      countSports(
        features
      );


    const sorted =
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


    const top =
      sorted.slice(
        0,
        8
      );


    const otherCount =
      sorted
        .slice(
          8
        )
        .reduce(
          function (
            total,
            item
          ) {

            return (
              total +
              item[1]
            );

          },
          0
        );


    if (
      otherCount >
      0
    ) {

      top.push(
        [
          "Other",
          otherCount
        ]
      );

    }


    lensTotal.textContent =
      features.length;


    areaLensSvg.innerHTML =
      "";


    if (
      top.length ===
      0
    ) {

      return;

    }


    const maxCount =
      Math.max(
        ...top.map(
          function (
            item
          ) {

            return (
              item[1]
            );

          }
        )
      );


    const centre =
      180;


    const innerRadius =
      92;


    const maxExtra =
      70;


    const angleStep =
      (
        Math.PI *
        2
      ) /
      top.length;


    top.forEach(
      function (
        item,
        index
      ) {

        const sport =
          item[0];


        const count =
          item[1];


        const angle =
          (
            angleStep *
            index
          ) -
          Math.PI /
          2;


        const extra =
          (
            count /
            maxCount
          ) *
          maxExtra;


        const startX =
          centre +
          Math.cos(
            angle
          ) *
          innerRadius;


        const startY =
          centre +
          Math.sin(
            angle
          ) *
          innerRadius;


        const endX =
          centre +
          Math.cos(
            angle
          ) *
          (
            innerRadius +
            extra
          );


        const endY =
          centre +
          Math.sin(
            angle
          ) *
          (
            innerRadius +
            extra
          );


        const colour =
          sportColours[sport] ||
          [
            125,
            125,
            125
          ];


        const line =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );


        line.setAttribute(
          "x1",
          startX
        );


        line.setAttribute(
          "y1",
          startY
        );


        line.setAttribute(
          "x2",
          endX
        );


        line.setAttribute(
          "y2",
          endY
        );


        line.setAttribute(
          "stroke",
          `rgb(${colour.join(",")})`
        );


        line.setAttribute(
          "stroke-width",
          "14"
        );


        line.setAttribute(
          "class",
          "radial-bar"
        );


        areaLensSvg.appendChild(
          line
        );


        const textX =
          centre +
          Math.cos(
            angle
          ) *
          (
            innerRadius +
            extra +
            17
          );


        const textY =
          centre +
          Math.sin(
            angle
          ) *
          (
            innerRadius +
            extra +
            17
          );


        const text =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );


        text.setAttribute(
          "x",
          textX
        );


        text.setAttribute(
          "y",
          textY
        );


        text.setAttribute(
          "text-anchor",
          "middle"
        );


        text.setAttribute(
          "dominant-baseline",
          "middle"
        );


        text.setAttribute(
          "class",
          "radial-count"
        );


        text.textContent =
          count;


        areaLensSvg.appendChild(
          text
        );

      }
    );

  }


  // =========================================================
  // AREA RIGHT PANEL
  // =========================================================

  function renderAreaPanel(
    features
  ) {

    rightPanelHeading.textContent =
      "Area Explorer";


    emptyState.classList.add(
      "hidden"
    );


    facilityDetails.classList.add(
      "hidden"
    );


    analysisDetails.classList.remove(
      "hidden"
    );


    analysisTitle.textContent =
      `${areaRadiusKm} km area`;


    analysisSubtitle.textContent =
      "Radial chart shows the most common sports around the lens.";


    const counts =
      countSports(
        features
      );


    analysisTotals.innerHTML =
      `
        <div class="analysis-total-card">
            <span>Total facilities</span>
            <strong>${features.length}</strong>
        </div>

        <div class="analysis-total-card">
            <span>Sports represented</span>
            <strong>${Object.keys(counts).length}</strong>
        </div>
      `;


    const top =
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
          8
        );


    analysisSportSummary.innerHTML =
      top.map(
        function (
          item
        ) {

          const colour =
            sportColours[item[0]] ||
            [
              130,
              130,
              130
            ];


          return `
            <div class="analysis-sport-row">

                <span
                    class="analysis-swatch"
                    style="background:rgb(${colour.join(",")})"
                ></span>

                <span>
                    ${escapeHtml(displaySportName(item[0]))}
                </span>

                <strong>
                    ${item[1]}
                </strong>

            </div>
          `;

        }
      ).join(
        ""
      );


    analysisTableContainer.innerHTML =
      "";

  }


  // =========================================================
  // CATCHMENT
  // =========================================================

  view.on(
    "click",
    async function (
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
        analysisMode ===
        "area"
      ) {

        return;

      }


      selectFacilityFromClick(
        event
      );

    }
  );


  async function runCatchment(
    point
  ) {

    analysisLayer.removeAll();


    const radii =
      [
        1,
        2,
        4,
        8
      ];


    radii
      .slice()
      .reverse()
      .forEach(
        function (
          radius
        ) {

          const buffer =
            geometryEngine.geodesicBuffer(
              point,
              radius,
              "kilometers"
            );


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
                  0.04
                ],

                outline: {

                  color: [
                    0,
                    115,
                    85,
                    0.75
                  ],

                  width:
                    1.5

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

          color:
            "#006f54",

          outline: {

            color:
              "white",

            width:
              2

          }

        }

      })

    );


    const results =
      [];


    for (
      const radius of radii
    ) {

      const query =
        facilitiesLayer.createQuery();


      query.geometry =
        point;


      query.distance =
        radius;


      query.units =
        "kilometers";


      query.where =
        buildCurrentFilterWhere();


      query.returnGeometry =
        false;


      query.outFields =
        ["Sport"];


      const response =
        await facilitiesLayer.queryFeatures(
          query
        );


      results.push(
        response.features
      );

    }


    renderCatchmentPanel(
      results
    );

  }


  function renderCatchmentPanel(
    results
  ) {

    rightPanelHeading.textContent =
      "Catchment summary";


    emptyState.classList.add(
      "hidden"
    );


    facilityDetails.classList.add(
      "hidden"
    );


    analysisDetails.classList.remove(
      "hidden"
    );


    analysisTitle.textContent =
      "Facility catchment";


    analysisSubtitle.textContent =
      "Cumulative straight-line facility counts.";


    analysisTotals.innerHTML =
      `
        <div class="analysis-total-card">
            <span>Within 1 km</span>
            <strong>${results[0].length}</strong>
        </div>

        <div class="analysis-total-card">
            <span>Within 2 km</span>
            <strong>${results[1].length}</strong>
        </div>

        <div class="analysis-total-card">
            <span>Within 4 km</span>
            <strong>${results[2].length}</strong>
        </div>

        <div class="analysis-total-card">
            <span>Within 8 km</span>
            <strong>${results[3].length}</strong>
        </div>
      `;


    const sports =
      new Set();


    results.forEach(
      function (
        list
      ) {

        list.forEach(
          function (
            feature
          ) {

            sports.add(
              feature.attributes.Sport
            );

          }
        );

      }
    );


    const rows =
      Array.from(
        sports
      ).map(
        function (
          sport
        ) {

          return {

            sport:
              sport,

            counts:
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
                          sport
                        );

                      }
                    ).length
                  );

                }
              )

          };

        }
      );


    rows.sort(
      function (
        a,
        b
      ) {

        return (
          b.counts[3] -
          a.counts[3]
        );

      }
    );


    let html =
      `
        <table class="analysis-table">

            <thead>

                <tr>
                    <th>Sport</th>
                    <th>1</th>
                    <th>2</th>
                    <th>4</th>
                    <th>8 km</th>
                </tr>

            </thead>

            <tbody>
      `;


    rows.forEach(
      function (
        row
      ) {

        html +=
          `
            <tr>

                <td>
                    ${escapeHtml(displaySportName(row.sport))}
                </td>

                <td>
                    ${row.counts[0]}
                </td>

                <td>
                    ${row.counts[1]}
                </td>

                <td>
                    ${row.counts[2]}
                </td>

                <td>
                    ${row.counts[3]}
                </td>

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


    analysisSportSummary.innerHTML =
      "";

  }


  // =========================================================
  // CLEAN COVERAGE OVERLAY
  // =========================================================

  async function refreshCoverage() {

    ++coverageRequestId;


    const requestId =
      coverageRequestId;


    coverageLayer.removeAll();


    if (
      !coverageSport ||
      coverageRadiusKm <=
        0
    ) {

      coverageStatus.textContent =
        "Select one sport and a radius to display coverage.";


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


    const query =
      facilitiesLayer.createQuery();


    query.geometry =
      view.extent;


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
        `${count} ${coverageSport} facilities visible. Zoom in further.`;


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
      sportColours[coverageSport] ||
      [
        120,
        120,
        120
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
                  0.55
                ],

                width:
                  1.2

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
      `${graphics.length} ${displaySportName(coverageSport)} facilities shown with ${coverageRadiusKm} km coverage.`;

  }


  function buildCoverageWhere() {

    const clauses =
      [];


    clauses.push(
      "Sport = '" +
      String(
        coverageSport
      ).replace(
        /'/g,
        "''"
      ) +
      "'"
    );


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


  view.watch(
    "stationary",
    function (
      stationary
    ) {

      if (
        stationary &&
        coverageRadiusKm >
          0 &&
        coverageSport
      ) {

        refreshCoverage();

      }

    }
  );


  // =========================================================
  // NORMAL FACILITY CLICK
  // =========================================================

  async function selectFacilityFromClick(
    event
  ) {

    const point =
      event.mapPoint;


    if (!point) {
      return;
    }


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


    query.where =
      buildCurrentFilterWhere();


    query.returnGeometry =
      true;


    query.outFields = [
      "*"
    ];


    const response =
      await facilitiesLayer.queryFeatures(
        query
      );


    let features =
      response.features;


    features =
      features.filter(
        function (
          feature
        ) {

          try {

            return (
              geometryEngine.intersects(
                feature.geometry,
                point
              )
            );

          }
          catch {

            return false;

          }

        }
      );


    if (
      features.length ===
      0
    ) {

      clearSelection();

      return;

    }


    features.sort(
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
      features
    );

  }


  // =========================================================
  // FACILITY DETAILS
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
      graphics.map(
        function (
          graphic
        ) {

          return (
            graphic.getObjectId()
          );

        }
      );


    highlightHandle =
      facilitiesLayerView.highlight(
        ids
      );


    showCurrentFacility();

  }


  function showCurrentFacility() {

    selectedGraphic =
      selectedGraphics[
        selectedIndex
      ];


    showFacilityDetails(
      selectedGraphic.attributes
    );


    updateSelectionNavigator();

  }


  function showFacilityDetails(
    attributes
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
        attributes.Owner_Name
      );


    if (
      title ===
      "Not recorded"
    ) {

      title =
        cleanValue(
          attributes.Sport
        );

    }


    setText(
      "detailTitle",
      title
    );


    setText(
      "detailSportTag",
      displaySportName(
        attributes.Sport
      )
    );


    setSportTagColour(
      attributes.Sport
    );


    setText(
      "detailTypeTag",
      cleanValue(
        attributes.Infrastructure_Type
      )
    );


    setText(
      "detailSport",
      displaySportName(
        attributes.Sport
      )
    );


    setText(
      "detailInfrastructure",
      cleanValue(
        attributes.Infrastructure_Type
      )
    );


    const pool =
      attributes.Sport ===
        "Swimming Indoor" ||
      attributes.Sport ===
        "Swimming Outdoor";


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
          attributes.Pool_Length
        )
      );


      setText(
        "detailPoolBreadth",
        formatDimension(
          attributes.Pool_Breadth
        )
      );

    }


    setText(
      "detailSurface",
      cleanValue(
        attributes.Surface
      )
    );


    setText(
      "detailFloodlights",
      cleanValue(
        attributes.Floodlights
      )
    );


    setText(
      "detailOwner",
      cleanValue(
        attributes.Owner
      )
    );


    setText(
      "detailOwnerName",
      cleanValue(
        attributes.Owner_Name
      )
    );


    setText(
      "detailSize",
      cleanValue(
        attributes.Facility_Size
      )
    );


    setText(
      "detailQuality",
      cleanValue(
        attributes.Quality
      )
    );


    setText(
      "detailMultiUse",
      cleanValue(
        attributes.Multi_Use
      )
    );


    setText(
      "detailLA",
      cleanValue(
        attributes.Local_Authority
      )
    );


    setText(
      "detailLEA",
      cleanValue(
        attributes.LEA
      )
    );


    setText(
      "detailArea",
      formatArea(
        attributes.Area_msq
      )
    );

  }


  function updateSelectionNavigator() {

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
  // CLEAR / PANEL
  // =========================================================

  function clearSelection() {

    if (
      highlightHandle
    ) {

      highlightHandle.remove();


      highlightHandle =
        null;

    }


    selectedGraphics =
      [];


    selectedGraphic =
      null;


    facilityDetails.classList.add(
      "hidden"
    );


    if (
      analysisMode ===
      "normal"
    ) {

      showNormalPanel();

    }

  }


  function clearAnalysis() {

    analysisLayer.removeAll();


    areaLens.classList.add(
      "hidden"
    );


    areaLensSvg.innerHTML =
      "";


    lensTotal.textContent =
      "—";


    if (
      analysisMode ===
      "normal"
    ) {

      showNormalPanel();

    }
    else {

      showAnalysisMessage(
        analysisMode ===
          "area"
          ? "Area Explorer"
          : "Catchment",
        analysisMode ===
          "area"
          ? "Move the lens over the map."
          : "Click a location on the map."
      );

    }

  }


  function showNormalPanel() {

    rightPanelHeading.textContent =
      "Facility details";


    analysisDetails.classList.add(
      "hidden"
    );


    facilityDetails.classList.add(
      "hidden"
    );


    emptyState.classList.remove(
      "hidden"
    );

  }


  function showAnalysisMessage(
    title,
    subtitle
  ) {

    rightPanelHeading.textContent =
      "Analysis";


    emptyState.classList.add(
      "hidden"
    );


    facilityDetails.classList.add(
      "hidden"
    );


    analysisDetails.classList.remove(
      "hidden"
    );


    analysisTitle.textContent =
      title;


    analysisSubtitle.textContent =
      subtitle;


    analysisTotals.innerHTML =
      "";


    analysisSportSummary.innerHTML =
      "";


    analysisTableContainer.innerHTML =
      "";

  }


  closeDetails.addEventListener(
    "click",
    function () {

      if (
        analysisMode ===
        "normal"
      ) {

        clearSelection();

      }
      else {

        clearAnalysis();

      }

    }
  );


  // =========================================================
  // ZOOM / HOME
  // =========================================================

  zoomToFacility.addEventListener(
    "click",
    function () {

      if (
        !selectedGraphic
      ) {

        return;

      }


      view.goTo(
        selectedGraphic.geometry.extent.expand(
          2.2
        )
      );

    }
  );


  homeButton.addEventListener(
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


  // =========================================================
  // HELPERS
  // =========================================================

  function countSports(
    features
  ) {

    const counts =
      {};


    features.forEach(
      function (
        feature
      ) {

        const sport =
          feature.attributes.Sport ||
          "Other";


        counts[sport] =
          (
            counts[sport] ||
            0
          ) +
          1;

      }
    );


    return counts;

  }


  function getGeometryCentre(
    geometry
  ) {

    if (
      geometry.centroid
    ) {

      return (
        geometry.centroid
      );

    }


    if (
      geometry.extent
    ) {

      return (
        geometry.extent.center
      );

    }


    return null;

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


  function setSportTagColour(
    sport
  ) {

    const tag =
      document.getElementById(
        "detailSportTag"
      );


    const colour =
      sportColours[sport] ||
      [
        130,
        130,
        130
      ];


    tag.style.background =
      `rgb(${colour.join(",")})`;

  }


  function displaySportName(
    value
  ) {

    if (
      value ===
      "Sports Hall"
    ) {

      return (
        "Sports Halls"
      );

    }


    return (
      cleanValue(
        value
      )
    );

  }


  function cleanValue(
    value
  ) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {

      return (
        "Not recorded"
      );

    }


    return (
      String(
        value
      )
    );

  }


  function formatDimension(
    value
  ) {

    const number =
      Number(
        value
      );


    if (
      !Number.isFinite(
        number
      )
    ) {

      return (
        "Not recorded"
      );

    }


    return (
      number +
      " m"
    );

  }


  function formatArea(
    value
  ) {

    const number =
      Number(
        value
      );


    if (
      !Number.isFinite(
        number
      )
    ) {

      return (
        "Not recorded"
      );

    }


    if (
      number >=
      10000
    ) {

      return (
        (
          number /
          10000
        ).toFixed(
          2
        ) +
        " ha"
      );

    }


    return (
      Math.round(
        number
      ).toLocaleString(
        "en-IE"
      ) +
      " m²"
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

});
