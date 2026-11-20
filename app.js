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

  const CATCHMENT_RADII =
    [1, 2, 4, 8];

  const COVERAGE_MIN_ZOOM =
    9;

  const COVERAGE_LIMIT =
    700;

  // Keep the lens usable at extreme zoom levels.
  const MIN_LENS_DIAMETER =
    120;

  const MAX_LENS_DIAMETER =
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


  const typeColours = [
    [0, 132, 150],
    [235, 132, 30],
    [85, 115, 185],
    [170, 85, 165],
    [55, 155, 125]
  ];


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
                pool
                  ? 3
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

      },

      highlightOptions: {

        color: [
          0,
          190,
          175,
          1
        ],

        haloOpacity:
          0.9,

        fillOpacity:
          0.1

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


  let highlightHandle =
    null;


  let selectedGraphics =
    [];


  let selectedIndex =
    0;


  let selectedGraphic =
    null;


  let analysisMode =
    "normal";


  let lensRadiusKm =
    2;


  let lensRequestId =
    0;


  let catchmentRequestId =
    0;


  let coverageSport =
    "";


  let coverageRadiusKm =
    0;


  let coverageRequestId =
    0;


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


  const selectAllFilters =
    document.getElementById(
      "selectAllFilters"
    );


  const deselectAllFilters =
    document.getElementById(
      "deselectAllFilters"
    );


  const legendItems =
    document.getElementById(
      "legendItems"
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


  const lensControls =
    document.getElementById(
      "lensControls"
    );


  const lensRadiusSelect =
    document.getElementById(
      "lensRadiusSelect"
    );


  let fixedLens =
    document.getElementById(
      "fixedLens"
    );


  let lensSvg =
    document.getElementById(
      "lensSvg"
    );


  let lensTotal =
    document.getElementById(
      "lensTotal"
    );


  let lensRadiusLabel =
    document.getElementById(
      "lensRadiusLabel"
    );


  let lensLoading =
    document.getElementById(
      "lensLoading"
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


  const analysisModeStatus =
    document.getElementById(
      "analysisModeStatus"
    );


  const mapAnalysisBadge =
    document.getElementById(
      "mapAnalysisBadge"
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


  const sportSummaryBlock =
    document.getElementById(
      "sportSummaryBlock"
    );


  const typeSummaryBlock =
    document.getElementById(
      "typeSummaryBlock"
    );


  const analysisSportSummary =
    document.getElementById(
      "analysisSportSummary"
    );


  const analysisTypeSummary =
    document.getElementById(
      "analysisTypeSummary"
    );


  const analysisTableContainer =
    document.getElementById(
      "analysisTableContainer"
    );


  const clearAnalysisButton =
    document.getElementById(
      "clearAnalysisButton"
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


  const closeDetails =
    document.getElementById(
      "closeDetails"
    );


  const zoomToFacility =
    document.getElementById(
      "zoomToFacility"
    );


  const homeButton =
    document.getElementById(
      "homeButton"
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


      setupAnalysisControls();


      await updateResultCount();

    }
  );


  // =========================================================
  // SPORT FILTERS
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

          return sport.value;

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
  // DOMAIN FILTERS
  // =========================================================

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
          className;


        const text =
          document.createElement(
            "span"
          );


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
          document.createElement(
            "div"
          );


        row.className =
          "legend-item";


        const square =
          document.createElement(
            "span"
          );


        square.className =
          "legend-colour";


        const colour =
          sportColours[
            sport.value
          ];


        square.style.background =
          `rgb(${colour.join(",")})`;


        const label =
          document.createElement(
            "span"
          );


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
      "lens"
    ) {

      runLensAnalysis();

    }


    refreshCoverage();

  }


  function buildCurrentFilterWhere() {

    const clauses =
      [];


    const groups = [
      ["Sport", ".sport-filter"],
      ["Owner", ".owner-filter"],
      ["Surface", ".surface-filter"],
      ["Floodlights", ".floodlight-filter"]
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
  // SELECT / DESELECT ALL
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


      if (
        analysisMode ===
        "lens"
      ) {

        runLensAnalysis();

      }

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


      if (
        analysisMode ===
        "lens"
      ) {

        runLensAnalysis();

      }

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
  // ANALYSIS CONTROLS
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


    lensModeButton.addEventListener(
      "click",
      function () {

        setMode(
          "lens"
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


        if (
          lensRadiusLabel
        ) {

          lensRadiusLabel.textContent =
            lensRadiusKm +
            " km";

        }


        updateLensSize();


        runLensAnalysis();

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
      function () {

        analysisLayer.removeAll();


        if (
          analysisMode ===
          "lens"
        ) {

          if (
            lensSvg
          ) {

            lensSvg.innerHTML =
              "";

          }


          if (
            lensTotal
          ) {

            lensTotal.textContent =
              "—";

          }

        }

      }
    );

  }


  // =========================================================
  // MODE SWITCHING
  // =========================================================

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


    lensModeButton.classList.toggle(
      "active",
      mode ===
      "lens"
    );


    lensControls.classList.toggle(
      "hidden",
      mode !==
      "lens"
    );


    analysisLayer.removeAll();


    coverageLayer.removeAll();


    coverageRadiusSelect.value =
      "0";


    coverageRadiusKm =
      0;


    if (
      mode ===
      "normal"
    ) {

      hideFixedLens();


      mapAnalysisBadge.classList.add(
        "hidden"
      );


      analysisModeStatus.textContent =
        "Normal facility selection enabled.";


      showNormalPanel();


      return;

    }


    if (
      mode ===
      "catchment"
    ) {

      hideFixedLens();


      mapAnalysisBadge.textContent =
        "Catchment — click a location";


      mapAnalysisBadge.classList.remove(
        "hidden"
      );


      analysisModeStatus.textContent =
        "Click a location for 1, 2, 4 and 8 km facility counts.";


      showAnalysisMessage(
        "Catchment",
        "Click a point on the map."
      );


      return;

    }


    if (
      mode ===
      "lens"
    ) {

      showFixedLens();


      updateLensSize();


      mapAnalysisBadge.textContent =
        "Lens Explorer";


      mapAnalysisBadge.classList.remove(
        "hidden"
      );


      analysisModeStatus.textContent =
        "Pan or zoom the map underneath the fixed lens.";


      if (
        lensRadiusLabel
      ) {

        lensRadiusLabel.textContent =
          lensRadiusKm +
          " km";

      }


      showAnalysisMessage(
        "Lens Explorer",
        "Pan or zoom the map underneath the fixed lens."
      );


      runLensAnalysis();


      return;

    }

  }


  // =========================================================
  // LENS SHOW / HIDE
  // =========================================================

  function showFixedLens() {

    const lens =
      document.getElementById(
        "fixedLens"
      );


    if (!lens) {

      return;

    }


    lens.classList.remove(
      "hidden"
    );


    lens.style.display =
      "block";


    fixedLens =
      lens;


    lensSvg =
      document.getElementById(
        "lensSvg"
      );


    lensTotal =
      document.getElementById(
        "lensTotal"
      );


    lensRadiusLabel =
      document.getElementById(
        "lensRadiusLabel"
      );


    lensLoading =
      document.getElementById(
        "lensLoading"
      );

  }


  function hideFixedLens() {

    const lens =
      document.getElementById(
        "fixedLens"
      );


    if (lens) {

      lens.classList.add(
        "hidden"
      );


      lens.style.display =
        "none";

    }

  }


  // =========================================================
  // TRUE MAP-SCALE LENS SIZE
  // =========================================================

  function updateLensSize() {

    if (
      analysisMode !==
        "lens" ||
      !fixedLens ||
      !view.resolution ||
      !view.spatialReference
    ) {

      return;

    }


    const metersPerUnit =
      view.spatialReference.metersPerUnit ||
      1;


    // metres represented by one screen pixel
    const metresPerPixel =
      view.resolution *
      metersPerUnit;


    const radiusMetres =
      lensRadiusKm *
      1000;


    const radiusPixels =
      radiusMetres /
      metresPerPixel;


    let diameterPixels =
      radiusPixels *
      2;


    diameterPixels =
      Math.max(
        MIN_LENS_DIAMETER,
        Math.min(
          MAX_LENS_DIAMETER,
          diameterPixels
        )
      );


    fixedLens.style.width =
      diameterPixels +
      "px";


    fixedLens.style.height =
      diameterPixels +
      "px";


    // Scale the radial-chart SVG with the lens.
    if (
      lensSvg
    ) {

      const svgSize =
        diameterPixels +
        100;


      lensSvg.style.width =
        svgSize +
        "px";


      lensSvg.style.height =
        svgSize +
        "px";

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
        analysisMode ===
        "lens"
      ) {

        return;

      }


      selectFacilityFromClick(
        event
      );

    }
  );


  // =========================================================
  // NORMAL CLICK:
  // NEARBY + OVERLAPPING POLYGONS
  // =========================================================

  async function selectFacilityFromClick(
    event
  ) {

    const clickedPoint =
      event.mapPoint;


    if (!clickedPoint) {

      clearSelection();

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


    if (
      !topLeft ||
      !bottomRight
    ) {

      clearSelection();

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
      buildCurrentFilterWhere();


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
      null;


    let nearestDistance =
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
            Number.isFinite(
              distance
            ) &&
            distance <
              nearestDistance
          ) {

            nearestDistance =
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
      [
        nearest ||
        nearby[0]
      ]
    );

  }


  // =========================================================
  // CATCHMENT
  // =========================================================

  async function runCatchment(
    point
  ) {

    if (!point) {
      return;
    }


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
                    0.85
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

        color: [
          0,
          105,
          78,
          1
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


    try {

      const query =
        facilitiesLayer.createQuery();


      query.geometry =
        buffers[3];


      query.spatialRelationship =
        "intersects";


      query.where =
        buildCurrentFilterWhere();


      query.returnGeometry =
        true;


      query.outFields = [
        "OBJECTID",
        "Sport",
        "Infrastructure_Type"
      ];


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


      const uniqueFeatures =
        deduplicateFeatures(
          response.features
        );


      const results =
        buffers.map(
          function (
            buffer
          ) {

            return (
              uniqueFeatures.filter(
                function (
                  feature
                ) {

                  const centre =
                    getFacilityCentreForCatchment(
                      feature.geometry
                    );


                  if (!centre) {

                    return false;

                  }


                  try {

                    return (
                      geometryEngine.contains(
                        buffer,
                        centre
                      ) ||
                      geometryEngine.intersects(
                        buffer,
                        centre
                      )
                    );

                  }
                  catch {

                    return false;

                  }

                }
              )
            );

          }
        );


      renderCorrectCatchmentResults(
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


      analysisSubtitle.textContent =
        "Unable to calculate catchment.";

    }

  }


  function getFacilityCentreForCatchment(
    geometry
  ) {

    if (!geometry) {

      return null;

    }


    if (
      geometry.centroid
    ) {

      return (
        geometry.centroid
      );

    }


    if (
      geometry.extent &&
      geometry.extent.center
    ) {

      return (
        geometry.extent.center
      );

    }


    return null;

  }


  function showCatchmentLoading() {

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


    sportSummaryBlock.classList.add(
      "hidden"
    );


    typeSummaryBlock.classList.add(
      "hidden"
    );


    analysisTitle.textContent =
      "Facility catchment";


    analysisSubtitle.textContent =
      "Counting facilities…";


    analysisTotals.innerHTML =
      CATCHMENT_RADII.map(
        function (
          radius
        ) {

          return `
            <div class="analysis-total-card">

                <span>
                    Within ${radius} km
                </span>

                <strong>
                    …
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


  function renderCorrectCatchmentResults(
    results
  ) {

    rightPanelHeading.textContent =
      "Catchment summary";


    analysisTitle.textContent =
      "Facility catchment";


    analysisSubtitle.textContent =
      "Facilities whose mapped centre falls inside each straight-line catchment.";


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
              cleanCategory(
                feature.attributes.Sport
              )
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
                          cleanCategory(
                            feature.attributes.Sport
                          ) ===
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
                    <th>1 km</th>
                    <th>2 km</th>
                    <th>4 km</th>
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
                    ${escapeHtml(
                      displaySportName(
                        row.sport
                      )
                    )}
                </td>

                <td>${row.counts[0]}</td>

                <td>${row.counts[1]}</td>

                <td>${row.counts[2]}</td>

                <td>${row.counts[3]}</td>

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
  // MAP MOTION
  // =========================================================

  view.watch(
    "stationary",
    function (
      stationary
    ) {

      if (
        analysisMode ===
        "lens"
      ) {

        // Lens size changes immediately with zoom.
        updateLensSize();


        if (
          stationary
        ) {

          runLensAnalysis();

        }
        else if (
          lensLoading
        ) {

          lensLoading.classList.remove(
            "hidden"
          );

        }

      }


      if (
        stationary &&
        coverageSport &&
        coverageRadiusKm >
        0
      ) {

        refreshCoverage();

      }

    }
  );


  // Also resize while zooming rather than only after it stops.
  view.watch(
    "resolution",
    function () {

      if (
        analysisMode ===
        "lens"
      ) {

        updateLensSize();

      }

    }
  );


  // =========================================================
  // LENS ANALYSIS
  // =========================================================

  async function runLensAnalysis() {

    if (
      analysisMode !==
      "lens"
    ) {

      return;

    }


    showFixedLens();


    updateLensSize();


    const requestId =
      ++lensRequestId;


    if (
      lensLoading
    ) {

      lensLoading.classList.remove(
        "hidden"
      );

    }


    const point =
      view.center;


    const buffer =
      geometryEngine.geodesicBuffer(
        point,
        lensRadiusKm,
        "kilometers"
      );


    try {

      const query =
        facilitiesLayer.createQuery();


      query.geometry =
        buffer;


      query.spatialRelationship =
        "intersects";


      query.where =
        buildCurrentFilterWhere();


      query.returnGeometry =
        true;


      query.outFields = [
        "OBJECTID",
        "Sport",
        "Infrastructure_Type"
      ];


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


      const features =
        deduplicateFeatures(
          response.features
        ).filter(
          function (
            feature
          ) {

            const centre =
              getFacilityCentreForCatchment(
                feature.geometry
              );


            if (!centre) {

              return false;

            }


            try {

              return (
                geometryEngine.contains(
                  buffer,
                  centre
                ) ||
                geometryEngine.intersects(
                  buffer,
                  centre
                )
              );

            }
            catch {

              return false;

            }

          }
        );


      const sportCounts =
        countByField(
          features,
          "Sport"
        );


      const typeCounts =
        countByField(
          features,
          "Infrastructure_Type"
        );


      if (
        lensLoading
      ) {

        lensLoading.classList.add(
          "hidden"
        );

      }


      renderLens(
        features.length,
        sportCounts
      );


      renderLensPanel(
        features.length,
        sportCounts,
        typeCounts
      );

    }
    catch (
      error
    ) {

      console.error(
        "LENS ERROR:",
        error
      );


      if (
        lensLoading
      ) {

        lensLoading.classList.add(
          "hidden"
        );

      }

    }

  }


  // =========================================================
  // LENS CHART
  // =========================================================

  function renderLens(
    total,
    sportCounts
  ) {

    if (
      !lensSvg ||
      !lensTotal
    ) {

      return;

    }


    lensTotal.textContent =
      total;


    lensSvg.innerHTML =
      "";


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


    const centre =
      210;


    const baseRadius =
      166;


    const maxExtra =
      38;


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
            10,
            value /
            maximum *
            maxExtra
          );


        const startX =
          centre +
          Math.cos(
            angle
          ) *
          baseRadius;


        const startY =
          centre +
          Math.sin(
            angle
          ) *
          baseRadius;


        const endX =
          centre +
          Math.cos(
            angle
          ) *
          (
            baseRadius +
            extra
          );


        const endY =
          centre +
          Math.sin(
            angle
          ) *
          (
            baseRadius +
            extra
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


        const line =
          createSvg(
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
          "15"
        );


        line.setAttribute(
          "stroke-linecap",
          "round"
        );


        lensSvg.appendChild(
          line
        );


        const number =
          createSvg(
            "text"
          );


        number.setAttribute(
          "x",
          centre +
          Math.cos(
            angle
          ) *
          (
            baseRadius +
            extra +
            16
          )
        );


        number.setAttribute(
          "y",
          centre +
          Math.sin(
            angle
          ) *
          (
            baseRadius +
            extra +
            16
          )
        );


        number.setAttribute(
          "text-anchor",
          "middle"
        );


        number.setAttribute(
          "dominant-baseline",
          "middle"
        );


        number.setAttribute(
          "class",
          "radial-number"
        );


        number.textContent =
          value;


        lensSvg.appendChild(
          number
        );

      }
    );

  }


  // =========================================================
  // LENS PANEL
  // =========================================================

  function renderLensPanel(
    total,
    sportCounts,
    typeCounts
  ) {

    rightPanelHeading.textContent =
      "Lens Explorer";


    emptyState.classList.add(
      "hidden"
    );


    facilityDetails.classList.add(
      "hidden"
    );


    analysisDetails.classList.remove(
      "hidden"
    );


    sportSummaryBlock.classList.remove(
      "hidden"
    );


    typeSummaryBlock.classList.remove(
      "hidden"
    );


    analysisTitle.textContent =
      `${lensRadiusKm} km area`;


    analysisSubtitle.textContent =
      "The visible lens now represents the selected real-world radius.";


    analysisTotals.innerHTML =
      `
        <div class="analysis-total-card">

            <span>
                Facilities
            </span>

            <strong>
                ${total}
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


    analysisSportSummary.innerHTML =
      renderSummaryRows(
        topEntries(
          sportCounts,
          5
        ),
        true
      );


    analysisTypeSummary.innerHTML =
      renderSummaryRows(
        topEntries(
          typeCounts,
          5
        ),
        false
      );


    analysisTableContainer.innerHTML =
      "";

  }


  function renderSummaryRows(
    entries,
    sports
  ) {

    return (
      entries.map(
        function (
          entry,
          index
        ) {

          const colour =
            sports
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
              : typeColours[
                  index %
                  typeColours.length
                ];


          return `
            <div class="analysis-summary-row">

                <span
                    class="analysis-swatch"
                    style="background:rgb(${colour.join(",")})"
                ></span>

                <span>
                    ${escapeHtml(
                      sports
                        ? displaySportName(
                            entry[0]
                          )
                        : entry[0]
                    )}
                </span>

                <strong>
                    ${entry[1]}
                </strong>

            </div>
          `;

        }
      ).join(
        ""
      )
    );

  }


  // =========================================================
  // COVERAGE
  // =========================================================

  async function refreshCoverage() {

    const requestId =
      ++coverageRequestId;


    coverageLayer.removeAll();


    if (
      !coverageSport ||
      coverageRadiusKm <=
      0
    ) {

      coverageStatus.textContent =
        "Select one sport and radius.";


      return;

    }


    if (
      view.zoom <
      COVERAGE_MIN_ZOOM
    ) {

      coverageStatus.textContent =
        "Zoom in further to display coverage.";


      return;

    }


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
        125,
        125,
        125
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
                0.1
              ],

              outline: {

                color: [
                  colour[0],
                  colour[1],
                  colour[2],
                  0.5
                ],

                width:
                  1

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
      `${graphics.length} facilities shown at ${coverageRadiusKm} km.`;

  }


  function buildCoverageWhere() {

    const clauses = [

      "Sport = '" +
      String(
        coverageSport
      ).replace(
        /'/g,
        "''"
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
  // FACILITY SELECTION
  // =========================================================

  function selectFacilities(
    graphics
  ) {

    clearSelection();


    selectedGraphics =
      graphics ||
      [];


    if (
      selectedGraphics.length ===
      0
    ) {

      return;

    }


    selectedIndex =
      0;


    const ids =
      selectedGraphics
        .map(
          function (
            graphic
          ) {

            return (
              graphic.getObjectId()
            );

          }
        )
        .filter(
          function (
            id
          ) {

            return (
              id !== null &&
              id !== undefined
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


    // Explicitly draw all selected polygons.
    drawAllSelectedPolygons();


    showCurrentFacility();

  }


  function drawAllSelectedPolygons() {

    selectionGraphicsLayer.removeAll();


    selectedGraphics.forEach(
      function (
        graphic,
        index
      ) {

        if (
          !graphic.geometry
        ) {

          return;

        }


        selectionGraphicsLayer.add(

          new Graphic({

            geometry:
              graphic.geometry,

            symbol: {

              type:
                "simple-fill",

              color: [
                0,
                170,
                150,
                index ===
                  selectedIndex
                  ? 0.12
                  : 0.035
              ],

              outline: {

                color:
                  index ===
                  selectedIndex
                    ? [
                        0,
                        75,
                        65,
                        1
                      ]
                    : [
                        0,
                        185,
                        165,
                        0.95
                      ],

                width:
                  index ===
                  selectedIndex
                    ? 4
                    : 2.5

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


    drawAllSelectedPolygons();


    showFacilityDetails(
      selectedGraphic.attributes
    );


    updateSelectionNavigator();

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

      if (
        selectedGraphics.length <=
        1
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
        selectedGraphics.length <=
        1
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
  // DETAILS
  // =========================================================

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
        `${cleanValue(attributes.Sport)} - ${cleanValue(attributes.Infrastructure_Type)}`;

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
      formatFloodlights(
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
      formatQuality(
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
      titleCase(
        attributes.Local_Authority
      )
    );


    setText(
      "detailLEA",
      titleCase(
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


  // =========================================================
  // PANELS
  // =========================================================

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


    sportSummaryBlock.classList.add(
      "hidden"
    );


    typeSummaryBlock.classList.add(
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

        analysisLayer.removeAll();

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
        !selectedGraphic ||
        !selectedGraphic.geometry
      ) {

        return;

      }


      const target =
        selectedGraphic.geometry.extent
          ? selectedGraphic.geometry.extent.expand(
              2.2
            )
          : selectedGraphic.geometry;


      view.goTo(
        target
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

  function deduplicateFeatures(
    features
  ) {

    const seen =
      new Set();


    return (
      features.filter(
        function (
          feature
        ) {

          const id =
            feature.attributes.OBJECTID;


          if (
            seen.has(
              id
            )
          ) {

            return false;

          }


          seen.add(
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
          cleanCategory(
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


  function cleanCategory(
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


  function getGeometryCentre(
    geometry
  ) {

    if (
      geometry &&
      geometry.centroid
    ) {

      return (
        geometry.centroid
      );

    }


    if (
      geometry &&
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

      const area =
        Math.abs(
          geometryEngine.geodesicArea(
            geometry,
            "square-meters"
          )
        );


      if (
        Number.isFinite(
          area
        )
      ) {

        return area;

      }

    }
    catch {
      // ignore
    }


    return Infinity;

  }


  function setSportTagColour(
    sport
  ) {

    const tag =
      document.getElementById(
        "detailSportTag"
      );


    const colour =
      sportColours[
        sport
      ] ||
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
      value === "" ||
      value === "NULL"
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
      number.toLocaleString(
        "en-IE",
        {
          maximumFractionDigits:
            1
        }
      ) +
      " m"
    );

  }


  function formatQuality(
    value
  ) {

    const values = {

      1:
        "Poor",

      2:
        "Good / Satisfactory",

      3:
        "Excellent"

    };


    return (
      values[value] ||
      cleanValue(
        value
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

      return (
        "Yes"
      );

    }


    if (
      value ===
      "No Floodlights"
    ) {

      return (
        "No"
      );

    }


    return (
      cleanValue(
        value
      )
    );

  }


  function titleCase(
    value
  ) {

    const cleaned =
      cleanValue(
        value
      );


    if (
      cleaned ===
      "Not recorded"
    ) {

      return cleaned;

    }


    return (
      cleaned
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
