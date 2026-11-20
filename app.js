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

  const CLICK_TOLERANCE_PIXELS = 14;

  const OSM_OPACITY = 0.45;

  const IRELAND_CENTER = [
    -8,
    53.4
  ];

  const IRELAND_ZOOM = 7;

  const CATCHMENT_RADII = [
    1,
    2,
    4,
    8
  ];

  const COVERAGE_MIN_ZOOM = 9;

  const COVERAGE_FEATURE_LIMIT = 1200;

  const AREA_QUERY_INTERVAL = 250;


  // =========================================================
  // MAIN SPORTS
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


  // =========================================================
  // SPORT COLOURS
  // =========================================================

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

    // Bright pink pools
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
                ? 0.60
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
  // GRAPHICS LAYERS
  // =========================================================

  const coverageGraphicsLayer =
    new GraphicsLayer({
      title:
        "Coverage overlay"
    });


  const analysisGraphicsLayer =
    new GraphicsLayer({
      title:
        "Analysis graphics"
    });


  // =========================================================
  // FACILITIES LAYER
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

      minScale:
        0,

      popupEnabled:
        false,

      renderer: {

        type:
          "unique-value",

        field:
          "Sport",

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

        },

        uniqueValueInfos:
          rendererInfos

      }

    });


  // =========================================================
  // BASEMAP
  // =========================================================

  const osmLayer =
    new OpenStreetMapLayer({

      opacity:
        OSM_OPACITY

    });


  const customBasemap =
    new Basemap({

      baseLayers: [
        osmLayer
      ],

      title:
        "Muted OpenStreetMap"

    });


  // =========================================================
  // MAP
  // =========================================================

  const map =
    new Map({

      basemap:
        customBasemap,

      layers: [
        coverageGraphicsLayer,
        facilitiesLayer,
        analysisGraphicsLayer
      ]

    });


  // =========================================================
  // VIEW
  // =========================================================

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

      background: {

        color: [
          245,
          246,
          245,
          1
        ]

      },

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
          0.10

      }

    });


  // =========================================================
  // SEARCH
  // =========================================================

  const search =
    new Search({

      view:
        view,

      includeDefaultSources:
        true,

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

  let currentOverlayGraphic =
    null;

  let selectedGraphics =
    [];

  let selectedIndex =
    0;

  let selectedGraphic =
    null;


  // ANALYSIS STATE

  let analysisMode =
    "normal";

  let currentAnalysisPoint =
    null;

  let areaRadiusKm =
    2;

  let coverageRadiusKm =
    0;

  let areaRequestId =
    0;

  let catchmentRequestId =
    0;

  let coverageRequestId =
    0;

  let lastAreaQueryTime =
    0;

  let pendingAreaPoint =
    null;

  let areaTimer =
    null;

  let coverageRefreshTimer =
    null;


  // =========================================================
  // DOM
  // =========================================================

  const resultCount =
    document.getElementById(
      "resultCount"
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

  const rightPanelHeading =
    document.getElementById(
      "rightPanelHeading"
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

  const analysisTableContainer =
    document.getElementById(
      "analysisTableContainer"
    );

  const analysisLoading =
    document.getElementById(
      "analysisLoading"
    );

  const analysisEmptyMessage =
    document.getElementById(
      "analysisEmptyMessage"
    );

  const clearAnalysisButton =
    document.getElementById(
      "clearAnalysisButton"
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

  const selectAllFilters =
    document.getElementById(
      "selectAllFilters"
    );

  const deselectAllFilters =
    document.getElementById(
      "deselectAllFilters"
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

  const legendItems =
    document.getElementById(
      "legendItems"
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


  // ANALYSIS DOM

  const normalModeButton =
    document.getElementById(
      "normalModeButton"
    );

  const catchmentModeButton =
    document.getElementById(
      "catchmentModeButton"
    );

  const areaModeButton =
    document.getElementById(
      "areaModeButton"
    );

  const areaRadiusControls =
    document.getElementById(
      "areaRadiusControls"
    );

  const areaRadiusSelect =
    document.getElementById(
      "areaRadiusSelect"
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


      buildFilters();

      buildLegend();

      setupDropdowns();

      setupAnalysisControls();


      await updateResultCount();

    }
  );


  // =========================================================
  // FILTER BUILDING
  // =========================================================

  function buildFilters() {

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

  }


  // =========================================================
  // SPORT FILTERS
  // =========================================================

  function buildSportFilters() {

    const sportField =
      facilitiesLayer.fields.find(
        function (field) {

          return (
            field.name ===
            "Sport"
          );

        }
      );


    if (
      !sportField ||
      !sportField.domain ||
      !sportField.domain.codedValues
    ) {

      return;

    }


    mainSportFilters.innerHTML =
      "";

    moreSportFilters.innerHTML =
      "";


    const domainValues =
      sportField.domain.codedValues.slice();


    mainSports.forEach(
      function (
        mainSport
      ) {

        const match =
          domainValues.find(
            function (
              codedValue
            ) {

              return (
                codedValue.code ===
                  mainSport.value ||
                codedValue.name ===
                  mainSport.value
              );

            }
          );


        if (match) {

          addSportCheckbox(
            match,
            mainSportFilters,
            mainSport.label
          );

        }

      }
    );


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


    domainValues
      .filter(
        function (
          codedValue
        ) {

          return (
            !mainValues.includes(
              codedValue.code
            ) &&
            !mainValues.includes(
              codedValue.name
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
          codedValue
        ) {

          addSportCheckbox(
            codedValue,
            moreSportFilters,
            codedValue.name
          );

        }
      );

  }


  function addSportCheckbox(
    codedValue,
    container,
    displayLabel
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
      codedValue.code;

    checkbox.classList.add(
      "sport-filter"
    );

    checkbox.checked =
      true;


    label.appendChild(
      checkbox
    );


    const square =
      document.createElement(
        "span"
      );


    square.className =
      "colour-square";


    const colour =
      sportColours[
        codedValue.code
      ] ||
      sportColours[
        codedValue.name
      ] ||
      [
        145,
        145,
        145
      ];


    square.style.backgroundColor =
      `rgb(${colour[0]},${colour[1]},${colour[2]})`;


    label.appendChild(
      square
    );


    const text =
      document.createElement(
        "span"
      );


    text.textContent =
      displayLabel;


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
  // DOMAIN FILTER
  // =========================================================

  function buildDomainFilter(
    fieldName,
    container,
    className
  ) {

    if (!container) {
      return;
    }


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
      !field.domain ||
      !field.domain.codedValues
    ) {

      return;

    }


    container.innerHTML =
      "";


    field.domain.codedValues.forEach(
      function (
        codedValue
      ) {

        // Hide Private Residence
        // from public viewer controls.

        if (
          fieldName === "Owner" &&
          (
            codedValue.code ===
              "Private Residence" ||
            codedValue.name ===
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
          codedValue.code;

        checkbox.classList.add(
          className
        );

        checkbox.checked =
          true;


        label.appendChild(
          checkbox
        );


        const text =
          document.createElement(
            "span"
          );


        text.textContent =
          codedValue.name;


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

    setupDropdown(
      "moreSportsButton",
      "moreSportFilters",
      "moreSportsArrow"
    );


    setupDropdown(
      "ownerFilterButton",
      "ownerFilters",
      "ownerFilterArrow"
    );


    setupDropdown(
      "surfaceFilterButton",
      "surfaceFilters",
      "surfaceFilterArrow"
    );


    setupDropdown(
      "floodlightFilterButton",
      "floodlightFilters",
      "floodlightFilterArrow"
    );

  }


  function setupDropdown(
    buttonId,
    listId,
    arrowId
  ) {

    const button =
      document.getElementById(
        buttonId
      );

    const list =
      document.getElementById(
        listId
      );

    const arrow =
      document.getElementById(
        arrowId
      );


    if (
      !button ||
      !list ||
      !arrow
    ) {

      return;

    }


    button.addEventListener(
      "click",
      function () {

        const isHidden =
          list.classList.contains(
            "hidden"
          );


        list.classList.toggle(
          "hidden",
          !isHidden
        );


        arrow.textContent =
          isHidden
            ? "▴"
            : "▾";

      }
    );

  }


  // =========================================================
  // LEGEND
  // =========================================================

  function buildLegend() {

    legendItems.innerHTML =
      "";


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
          ] ||
          [
            145,
            145,
            145
          ];


        square.style.backgroundColor =
          `rgb(${colour[0]},${colour[1]},${colour[2]})`;


        const text =
          document.createElement(
            "span"
          );


        text.textContent =
          sport.label;


        row.appendChild(
          square
        );

        row.appendChild(
          text
        );


        legendItems.appendChild(
          row
        );

      }
    );

  }


  // =========================================================
  // FILTERING
  // =========================================================

  async function applyFilters() {

    if (!facilitiesLayerView) {
      return;
    }


    const selectedSports =
      getCheckedValues(
        ".sport-filter"
      );


    const selectedOwners =
      getCheckedValues(
        ".owner-filter"
      );


    const selectedSurfaces =
      getCheckedValues(
        ".surface-filter"
      );


    const selectedFloodlights =
      getCheckedValues(
        ".floodlight-filter"
      );


    const totalSports =
      document.querySelectorAll(
        ".sport-filter"
      ).length;


    const totalOwners =
      document.querySelectorAll(
        ".owner-filter"
      ).length;


    const totalSurfaces =
      document.querySelectorAll(
        ".surface-filter"
      ).length;


    const totalFloodlights =
      document.querySelectorAll(
        ".floodlight-filter"
      ).length;


    const nothingSelected =
      selectedSports.length === 0 &&
      selectedOwners.length === 0 &&
      selectedSurfaces.length === 0 &&
      selectedFloodlights.length === 0;


    if (nothingSelected) {

      facilitiesLayerView.filter = {
        where:
          "1=0"
      };


      clearSelection();


      await updateResultCount();


      scheduleCoverageRefresh();


      return;

    }


    const clauses =
      [];


    addFilterClause(
      clauses,
      "Sport",
      selectedSports,
      totalSports
    );


    addFilterClause(
      clauses,
      "Owner",
      selectedOwners,
      totalOwners
    );


    addFilterClause(
      clauses,
      "Surface",
      selectedSurfaces,
      totalSurfaces
    );


    addFilterClause(
      clauses,
      "Floodlights",
      selectedFloodlights,
      totalFloodlights
    );


    facilitiesLayerView.filter = {

      where:
        clauses.length > 0
          ? clauses.join(
              " AND "
            )
          : "1=1"

    };


    clearSelection();


    await updateResultCount();


    scheduleCoverageRefresh();


    if (
      analysisMode ===
        "catchment" &&
      currentAnalysisPoint
    ) {

      runCatchmentAnalysis(
        currentAnalysisPoint
      );

    }


    if (
      analysisMode ===
        "area" &&
      currentAnalysisPoint
    ) {

      runAreaAnalysis(
        currentAnalysisPoint
      );

    }

  }


  function addFilterClause(
    clauses,
    field,
    values,
    total
  ) {

    if (
      values.length > 0 &&
      values.length < total
    ) {

      clauses.push(
        buildInClause(
          field,
          values
        )
      );

    }

  }


  function getCheckedValues(
    selector
  ) {

    return Array.from(
      document.querySelectorAll(
        selector + ":checked"
      )
    ).map(
      function (
        checkbox
      ) {

        return (
          checkbox.value
        );

      }
    );

  }


  function buildInClause(
    fieldName,
    values
  ) {

    const escapedValues =
      values.map(
        function (
          value
        ) {

          return (
            "'" +
            String(
              value
            ).replace(
              /'/g,
              "''"
            ) +
            "'"
          );

        }
      );


    return (
      fieldName +
      " IN (" +
      escapedValues.join(
        ","
      ) +
      ")"
    );

  }


  function getCurrentWhereClause() {

    if (
      facilitiesLayerView &&
      facilitiesLayerView.filter &&
      facilitiesLayerView.filter.where
    ) {

      return (
        facilitiesLayerView.filter.where
      );

    }


    return (
      "1=1"
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
            checkbox
          ) {

            checkbox.checked =
              true;

          }
        );


      facilitiesLayerView.filter =
        null;


      clearSelection();


      await updateResultCount();


      scheduleCoverageRefresh();

    }
  );


  // =========================================================
  // DESELECT ALL
  // =========================================================

  deselectAllFilters.addEventListener(
    "click",
    async function () {

      document
        .querySelectorAll(
          ".sport-filter, .owner-filter, .surface-filter, .floodlight-filter"
        )
        .forEach(
          function (
            checkbox
          ) {

            checkbox.checked =
              false;

          }
        );


      facilitiesLayerView.filter = {

        where:
          "1=0"

      };


      clearSelection();


      await updateResultCount();


      scheduleCoverageRefresh();

    }
  );


  // =========================================================
  // RESULT COUNT
  // =========================================================

  async function updateResultCount() {

    const query =
      facilitiesLayer.createQuery();


    query.where =
      getCurrentWhereClause();


    const count =
      await facilitiesLayer.queryFeatureCount(
        query
      );


    resultCount.textContent =
      count.toLocaleString(
        "en-IE"
      ) +
      (
        count === 1
          ? " facility"
          : " facilities"
      );

  }


  // =========================================================
  // ANALYSIS CONTROLS
  // =========================================================

  function setupAnalysisControls() {

    normalModeButton.addEventListener(
      "click",
      function () {

        setAnalysisMode(
          "normal"
        );

      }
    );


    catchmentModeButton.addEventListener(
      "click",
      function () {

        setAnalysisMode(
          "catchment"
        );

      }
    );


    areaModeButton.addEventListener(
      "click",
      function () {

        setAnalysisMode(
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


        if (
          analysisMode ===
            "area" &&
          currentAnalysisPoint
        ) {

          runAreaAnalysis(
            currentAnalysisPoint
          );

        }

      }
    );


    coverageRadiusSelect.addEventListener(
      "change",
      function () {

        coverageRadiusKm =
          Number(
            coverageRadiusSelect.value
          );


        refreshCoverageOverlay();

      }
    );


    clearAnalysisButton.addEventListener(
      "click",
      function () {

        clearAnalysis();

      }
    );

  }


  function setAnalysisMode(
    mode
  ) {

    analysisMode =
      mode;


    normalModeButton.classList.toggle(
      "active",
      mode === "normal"
    );


    catchmentModeButton.classList.toggle(
      "active",
      mode === "catchment"
    );


    areaModeButton.classList.toggle(
      "active",
      mode === "area"
    );


    areaRadiusControls.classList.toggle(
      "hidden",
      mode !== "area"
    );


    clearSelection();

    clearAnalysis();


    if (
      mode ===
      "normal"
    ) {

      analysisModeStatus.textContent =
        "Normal facility selection enabled.";


      mapAnalysisBadge.classList.add(
        "hidden"
      );


      showNormalEmptyState();


      view.container.style.cursor =
        "default";

    }


    if (
      mode ===
      "catchment"
    ) {

      analysisModeStatus.textContent =
        "Click anywhere on the map to analyse facilities within 1, 2, 4 and 8 km.";


      mapAnalysisBadge.textContent =
        "Catchment mode — click a location";


      mapAnalysisBadge.classList.remove(
        "hidden"
      );


      showAnalysisPlaceholder(
        "Catchment summary",
        "Click a point on the map to create 1 km, 2 km, 4 km and 8 km catchments."
      );


      view.container.style.cursor =
        "crosshair";

    }


    if (
      mode ===
      "area"
    ) {

      analysisModeStatus.textContent =
        "Move over the map for a live facility summary.";


      mapAnalysisBadge.textContent =
        `Area Explorer — ${areaRadiusKm} km`;


      mapAnalysisBadge.classList.remove(
        "hidden"
      );


      showAnalysisPlaceholder(
        "Area Explorer",
        `Move the mouse over the map to analyse facilities within ${areaRadiusKm} km.`
      );


      view.container.style.cursor =
        "crosshair";

    }

  }


  // =========================================================
  // MAP CLICK
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

        if (
          event.mapPoint
        ) {

          runCatchmentAnalysis(
            event.mapPoint
          );

        }


        return;

      }


      if (
        analysisMode ===
        "area"
      ) {

        if (
          event.mapPoint
        ) {

          runAreaAnalysis(
            event.mapPoint
          );

        }


        return;

      }


      await selectFacilityFromClick(
        event
      );

    }
  );


  // =========================================================
  // NORMAL FACILITY CLICK
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


    const searchExtent =
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
      searchExtent;


    query.spatialRelationship =
      "intersects";


    query.where =
      getCurrentWhereClause();


    query.returnGeometry =
      true;


    query.outFields = [
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
    ];


    const response =
      await facilitiesLayer.queryFeatures(
        query
      );


    const nearby =
      response.features ||
      [];


    if (
      nearby.length === 0
    ) {

      clearSelection();

      return;

    }


    const overlapping =
      nearby.filter(
        function (
          facility
        ) {

          if (
            !facility.geometry
          ) {

            return false;

          }


          try {

            return (
              geometryEngine.intersects(
                facility.geometry,
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
      overlapping.length > 0
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


    selectFacilities(
      [
        nearby[0]
      ]
    );

  }


  // =========================================================
  // CATCHMENT ANALYSIS
  // =========================================================

  async function runCatchmentAnalysis(
    point
  ) {

    if (!point) {
      return;
    }


    currentAnalysisPoint =
      point;


    const requestId =
      ++catchmentRequestId;


    drawCatchmentGraphics(
      point
    );


    showAnalysisLoading(
      "Catchment summary",
      "Counting facilities within 1 km, 2 km, 4 km and 8 km…"
    );


    try {

      const queries =
        CATCHMENT_RADII.map(
          function (
            radius
          ) {

            return (
              queryFacilitiesAroundPoint(
                point,
                radius
              )
            );

          }
        );


      const responses =
        await Promise.all(
          queries
        );


      if (
        requestId !==
        catchmentRequestId
      ) {

        return;

      }


      renderCatchmentSummary(
        responses
      );


      analysisLoading.classList.add(
        "hidden"
      );

    }
    catch (
      error
    ) {

      console.error(
        "CATCHMENT ANALYSIS ERROR:",
        error
      );


      showAnalysisError(
        "Unable to analyse this location."
      );

    }

  }


  async function queryFacilitiesAroundPoint(
    point,
    radiusKm
  ) {

    const query =
      facilitiesLayer.createQuery();


    query.geometry =
      point;


    query.distance =
      radiusKm;


    query.units =
      "kilometers";


    query.spatialRelationship =
      "intersects";


    query.where =
      getCurrentWhereClause();


    query.returnGeometry =
      false;


    query.outFields = [
      "OBJECTID",
      "Sport"
    ];


    return (
      facilitiesLayer.queryFeatures(
        query
      )
    );

  }


  function drawCatchmentGraphics(
    point
  ) {

    analysisGraphicsLayer.removeAll();


    const styles = {

      8: {
        colour:
          [0, 112, 84],
        width:
          2,
        opacity:
          0.08
      },

      4: {
        colour:
          [0, 140, 105],
        width:
          2,
        opacity:
          0.07
      },

      2: {
        colour:
          [0, 170, 125],
        width:
          2,
        opacity:
          0.06
      },

      1: {
        colour:
          [0, 200, 150],
        width:
          2,
        opacity:
          0.06
      }

    };


    [
      8,
      4,
      2,
      1
    ].forEach(
      function (
        radius
      ) {

        const buffer =
          geometryEngine.geodesicBuffer(
            point,
            radius,
            "kilometers"
          );


        if (!buffer) {
          return;
        }


        const style =
          styles[radius];


        const graphic =
          new Graphic({

            geometry:
              buffer,

            symbol: {

              type:
                "simple-fill",

              color: [
                style.colour[0],
                style.colour[1],
                style.colour[2],
                style.opacity
              ],

              outline: {

                color: [
                  style.colour[0],
                  style.colour[1],
                  style.colour[2],
                  0.9
                ],

                width:
                  style.width

              }

            }

          });


        analysisGraphicsLayer.add(
          graphic
        );

      }
    );


    analysisGraphicsLayer.add(

      new Graphic({

        geometry:
          point,

        symbol: {

          type:
            "simple-marker",

          style:
            "circle",

          size:
            12,

          color: [
            0,
            105,
            78,
            1
          ],

          outline: {

            color: [
              255,
              255,
              255,
              1
            ],

            width:
              2

          }

        }

      })

    );

  }


  function renderCatchmentSummary(
    responses
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


    analysisLoading.classList.add(
      "hidden"
    );


    analysisEmptyMessage.classList.add(
      "hidden"
    );


    analysisTitle.textContent =
      "Facility catchment";


    analysisSubtitle.textContent =
      "Cumulative number of facilities within each straight-line distance from the selected point.";


    const totals =
      responses.map(
        function (
          response
        ) {

          return (
            response.features.length
          );

        }
      );


    analysisTotals.innerHTML =
      CATCHMENT_RADII.map(
        function (
          radius,
          index
        ) {

          return `
            <div class="analysis-total-card">
                <span>Within ${radius} km</span>
                <strong>${totals[index].toLocaleString("en-IE")}</strong>
            </div>
          `;

        }
      ).join(
        ""
      );


    const sports =
      new Set();


    responses.forEach(
      function (
        response
      ) {

        response.features.forEach(
          function (
            feature
          ) {

            sports.add(
              cleanSport(
                feature.attributes.Sport
              )
            );

          }
        );

      }
    );


    if (
      sports.size === 0
    ) {

      analysisTableContainer.innerHTML =
        "";


      analysisEmptyMessage.classList.remove(
        "hidden"
      );


      return;

    }


    const rows =
      Array.from(
        sports
      ).map(
        function (
          sport
        ) {

          const counts =
            responses.map(
              function (
                response
              ) {

                return (
                  response.features.filter(
                    function (
                      feature
                    ) {

                      return (
                        cleanSport(
                          feature.attributes.Sport
                        ) === sport
                      );

                    }
                  ).length
                );

              }
            );


          return {
            sport:
              sport,
            counts:
              counts
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
                    ${sportLabelHtml(row.sport)}
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
  // AREA EXPLORER
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


      pendingAreaPoint =
        point;


      const now =
        Date.now();


      const elapsed =
        now -
        lastAreaQueryTime;


      if (
        elapsed >=
        AREA_QUERY_INTERVAL
      ) {

        lastAreaQueryTime =
          now;


        runAreaAnalysis(
          pendingAreaPoint
        );


        pendingAreaPoint =
          null;


        return;

      }


      if (
        areaTimer
      ) {

        return;

      }


      areaTimer =
        setTimeout(
          function () {

            areaTimer =
              null;


            if (
              pendingAreaPoint &&
              analysisMode ===
                "area"
            ) {

              lastAreaQueryTime =
                Date.now();


              runAreaAnalysis(
                pendingAreaPoint
              );


              pendingAreaPoint =
                null;

            }

          },
          AREA_QUERY_INTERVAL -
          elapsed
        );

    }
  );


  async function runAreaAnalysis(
    point
  ) {

    if (
      analysisMode !==
        "area" ||
      !point
    ) {

      return;

    }


    currentAnalysisPoint =
      point;


    mapAnalysisBadge.textContent =
      `Area Explorer — ${areaRadiusKm} km`;


    drawAreaLens(
      point,
      areaRadiusKm
    );


    const requestId =
      ++areaRequestId;


    try {

      const response =
        await queryFacilitiesAroundPoint(
          point,
          areaRadiusKm
        );


      if (
        requestId !==
        areaRequestId
      ) {

        return;

      }


      renderAreaSummary(
        response.features ||
        []
      );

    }
    catch (
      error
    ) {

      console.error(
        "AREA EXPLORER ERROR:",
        error
      );

    }

  }


  function drawAreaLens(
    point,
    radiusKm
  ) {

    analysisGraphicsLayer.removeAll();


    const buffer =
      geometryEngine.geodesicBuffer(
        point,
        radiusKm,
        "kilometers"
      );


    if (buffer) {

      analysisGraphicsLayer.add(

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
              0.10
            ],

            outline: {

              color: [
                0,
                115,
                85,
                0.95
              ],

              width:
                2.5

            }

          }

        })

      );

    }


    analysisGraphicsLayer.add(

      new Graphic({

        geometry:
          point,

        symbol: {

          type:
            "simple-marker",

          size:
            8,

          color: [
            0,
            105,
            78,
            1
          ],

          outline: {

            color: [
              255,
              255,
              255,
              1
            ],

            width:
              1.5

          }

        }

      })

    );

  }


  function renderAreaSummary(
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


    analysisLoading.classList.add(
      "hidden"
    );


    analysisTitle.textContent =
      `${areaRadiusKm} km area`;


    analysisSubtitle.textContent =
      "Live summary of facilities around the current map position.";


    analysisTotals.innerHTML =
      `
        <div class="analysis-total-card">
            <span>Total facilities</span>
            <strong>${features.length.toLocaleString("en-IE")}</strong>
        </div>

        <div class="analysis-total-card">
            <span>Sports represented</span>
            <strong>${countUniqueSports(features)}</strong>
        </div>
      `;


    if (
      features.length === 0
    ) {

      analysisTableContainer.innerHTML =
        "";


      analysisEmptyMessage.classList.remove(
        "hidden"
      );


      return;

    }


    analysisEmptyMessage.classList.add(
      "hidden"
    );


    const counts =
      countSports(
        features
      );


    const rows =
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


    let html =
      `
        <table class="analysis-table">
            <thead>
                <tr>
                    <th>Sport</th>
                    <th>Facilities</th>
                </tr>
            </thead>
            <tbody>
      `;


    rows.forEach(
      function (
        [sport, count]
      ) {

        html +=
          `
            <tr>
                <td>${sportLabelHtml(sport)}</td>
                <td>${count}</td>
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
  // COVERAGE OVERLAY
  // =========================================================

  function scheduleCoverageRefresh() {

    if (
      coverageRefreshTimer
    ) {

      clearTimeout(
        coverageRefreshTimer
      );

    }


    coverageRefreshTimer =
      setTimeout(
        function () {

          coverageRefreshTimer =
            null;


          refreshCoverageOverlay();

        },
        250
      );

  }


  async function refreshCoverageOverlay() {

    const requestId =
      ++coverageRequestId;


    coverageGraphicsLayer.removeAll();


    if (
      coverageRadiusKm <= 0
    ) {

      coverageStatus.textContent =
        "Uses the currently selected facility filters.";


      return;

    }


    if (
      view.zoom <
      COVERAGE_MIN_ZOOM
    ) {

      coverageStatus.textContent =
        `Zoom in to level ${COVERAGE_MIN_ZOOM} or closer to display coverage.`;


      return;

    }


    try {

      const countQuery =
        facilitiesLayer.createQuery();


      countQuery.geometry =
        view.extent;


      countQuery.spatialRelationship =
        "intersects";


      countQuery.where =
        getCurrentWhereClause();


      const visibleCount =
        await facilitiesLayer.queryFeatureCount(
          countQuery
        );


      if (
        requestId !==
        coverageRequestId
      ) {

        return;

      }


      if (
        visibleCount >
        COVERAGE_FEATURE_LIMIT
      ) {

        coverageStatus.textContent =
          `${visibleCount.toLocaleString("en-IE")} facilities are visible. Zoom in further to draw coverage.`;


        return;

      }


      const query =
        facilitiesLayer.createQuery();


      query.geometry =
        view.extent;


      query.spatialRelationship =
        "intersects";


      query.where =
        getCurrentWhereClause();


      query.returnGeometry =
        true;


      query.outFields = [
        "OBJECTID",
        "Sport"
      ];


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


      const graphics =
        [];


      response.features.forEach(
        function (
          feature
        ) {

          const centre =
            getFacilityCentre(
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


          if (!buffer) {
            return;
          }


          const sport =
            cleanSport(
              feature.attributes.Sport
            );


          const colour =
            sportColours[sport] ||
            [
              145,
              145,
              145
            ];


          graphics.push(

            new Graphic({

              geometry:
                buffer,

              attributes: {

                OBJECTID:
                  feature.attributes.OBJECTID,

                Sport:
                  sport

              },

              symbol: {

                type:
                  "simple-fill",

                color: [
                  colour[0],
                  colour[1],
                  colour[2],
                  0.10
                ],

                outline: {

                  color: [
                    colour[0],
                    colour[1],
                    colour[2],
                    0.28
                  ],

                  width:
                    0.7

                }

              }

            })

          );

        }
      );


      coverageGraphicsLayer.addMany(
        graphics
      );


      coverageStatus.textContent =
        `${graphics.length.toLocaleString("en-IE")} coverage circles shown at ${coverageRadiusKm} km.`;


    }
    catch (
      error
    ) {

      console.error(
        "COVERAGE ERROR:",
        error
      );


      coverageStatus.textContent =
        "Unable to create coverage overlay.";

    }

  }


  function getFacilityCentre(
    geometry
  ) {

    if (!geometry) {
      return null;
    }


    if (
      geometry.type ===
        "point"
    ) {

      return geometry;

    }


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


  // Refresh coverage after panning/zooming.

  view.watch(
    "stationary",
    function (
      stationary
    ) {

      if (
        stationary &&
        coverageRadiusKm > 0
      ) {

        scheduleCoverageRefresh();

      }

    }
  );


  // =========================================================
  // FACILITY SELECTION
  // =========================================================

  function selectFacilities(
    graphics
  ) {

    clearMapHighlightsOnly();


    selectedGraphics =
      graphics ||
      [];


    if (
      selectedGraphics.length ===
      0
    ) {

      clearSelection();

      return;

    }


    selectedIndex =
      0;


    const objectIds =
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
      objectIds.length > 0
    ) {

      highlightHandle =
        facilitiesLayerView.highlight(
          objectIds
        );

    }


    showCurrentFacility();

  }


  function showCurrentFacility() {

    if (
      selectedGraphics.length ===
      0
    ) {

      return;

    }


    selectedGraphic =
      selectedGraphics[
        selectedIndex
      ];


    updateCurrentOverlay();


    showFacilityDetails(
      selectedGraphic.attributes
    );


    updateSelectionNavigator();

  }


  function updateCurrentOverlay() {

    if (
      currentOverlayGraphic
    ) {

      view.graphics.remove(
        currentOverlayGraphic
      );


      currentOverlayGraphic =
        null;

    }


    if (
      !selectedGraphic ||
      !selectedGraphic.geometry
    ) {

      return;

    }


    currentOverlayGraphic =
      selectedGraphic.clone();


    currentOverlayGraphic.symbol = {

      type:
        "simple-fill",

      color: [
        0,
        170,
        150,
        0.06
      ],

      outline: {

        color: [
          0,
          90,
          75,
          1
        ],

        width:
          4

      }

    };


    view.graphics.add(
      currentOverlayGraphic
    );

  }


  // =========================================================
  // OVERLAPPING FACILITIES
  // =========================================================

  function updateSelectionNavigator() {

    if (
      selectedGraphics.length >
      1
    ) {

      selectionNavigator.classList.remove(
        "hidden"
      );


      selectionPosition.textContent =
        `${selectedIndex + 1} of ${selectedGraphics.length}`;

    }
    else {

      selectionNavigator.classList.add(
        "hidden"
      );

    }

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
        )
        %
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
        )
        %
        selectedGraphics.length;


      showCurrentFacility();

    }
  );


  // =========================================================
  // POLYGON AREA
  // =========================================================

  function getPolygonArea(
    geometry
  ) {

    if (!geometry) {

      return Infinity;

    }


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
        ) &&
        area > 0
      ) {

        return area;

      }

    }
    catch {
      // fallback
    }


    if (
      geometry.extent
    ) {

      return (
        geometry.extent.width *
        geometry.extent.height
      );

    }


    return Infinity;

  }


  // =========================================================
  // FACILITY DETAILS
  // =========================================================

  function showFacilityDetails(
    attributes
  ) {

    rightPanelHeading.textContent =
      "Facility details";


    analysisDetails.classList.add(
      "hidden"
    );


    emptyState.classList.add(
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


    // POOL DIMENSIONS

    const isPool =
      attributes.Sport ===
        "Swimming Indoor" ||
      attributes.Sport ===
        "Swimming Outdoor";


    if (isPool) {

      poolLengthRow.classList.remove(
        "hidden"
      );


      poolBreadthRow.classList.remove(
        "hidden"
      );


      setText(
        "detailPoolLength",
        formatPoolDimension(
          attributes.Pool_Length
        )
      );


      setText(
        "detailPoolBreadth",
        formatPoolDimension(
          attributes.Pool_Breadth
        )
      );

    }
    else {

      poolLengthRow.classList.add(
        "hidden"
      );


      poolBreadthRow.classList.add(
        "hidden"
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
  // ANALYSIS PANEL HELPERS
  // =========================================================

  function showAnalysisPlaceholder(
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


    analysisTableContainer.innerHTML =
      "";


    analysisLoading.classList.add(
      "hidden"
    );


    analysisEmptyMessage.classList.add(
      "hidden"
    );

  }


  function showAnalysisLoading(
    title,
    subtitle
  ) {

    showAnalysisPlaceholder(
      title,
      subtitle
    );


    analysisLoading.classList.remove(
      "hidden"
    );

  }


  function showAnalysisError(
    message
  ) {

    analysisLoading.classList.add(
      "hidden"
    );


    analysisTotals.innerHTML =
      "";


    analysisTableContainer.innerHTML =
      "";


    analysisEmptyMessage.textContent =
      message;


    analysisEmptyMessage.classList.remove(
      "hidden"
    );

  }


  function clearAnalysis() {

    ++areaRequestId;
    ++catchmentRequestId;


    currentAnalysisPoint =
      null;


    analysisGraphicsLayer.removeAll();


    analysisTotals.innerHTML =
      "";


    analysisTableContainer.innerHTML =
      "";


    analysisLoading.classList.add(
      "hidden"
    );


    analysisEmptyMessage.classList.add(
      "hidden"
    );


    if (
      analysisMode ===
      "normal"
    ) {

      showNormalEmptyState();

    }


    if (
      analysisMode ===
      "catchment"
    ) {

      showAnalysisPlaceholder(
        "Catchment summary",
        "Click a point on the map to create 1 km, 2 km, 4 km and 8 km catchments."
      );

    }


    if (
      analysisMode ===
      "area"
    ) {

      showAnalysisPlaceholder(
        "Area Explorer",
        `Move the mouse over the map to analyse facilities within ${areaRadiusKm} km.`
      );

    }

  }


  function showNormalEmptyState() {

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


  // =========================================================
  // CLEAR FACILITY SELECTION
  // =========================================================

  function clearMapHighlightsOnly() {

    if (
      highlightHandle
    ) {

      highlightHandle.remove();


      highlightHandle =
        null;

    }


    if (
      currentOverlayGraphic
    ) {

      view.graphics.remove(
        currentOverlayGraphic
      );


      currentOverlayGraphic =
        null;

    }

  }


  function clearSelection() {

    clearMapHighlightsOnly();


    selectedGraphics =
      [];

    selectedIndex =
      0;

    selectedGraphic =
      null;


    selectionNavigator.classList.add(
      "hidden"
    );


    facilityDetails.classList.add(
      "hidden"
    );


    poolLengthRow.classList.add(
      "hidden"
    );


    poolBreadthRow.classList.add(
      "hidden"
    );


    if (
      analysisMode ===
      "normal"
    ) {

      showNormalEmptyState();

    }

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
  // ZOOM TO FACILITY
  // =========================================================

  zoomToFacility.addEventListener(
    "click",
    async function () {

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


      view.padding = {

        top:
          20,

        right:
          140,

        bottom:
          20,

        left:
          20

      };


      await view.goTo(
        target
      );

    }
  );


  // =========================================================
  // FULL IRELAND
  // =========================================================

  homeButton.addEventListener(
    "click",
    async function () {

      view.padding = {

        top:
          0,

        right:
          0,

        bottom:
          0,

        left:
          0

      };


      await view.goTo({

        center:
          IRELAND_CENTER,

        zoom:
          IRELAND_ZOOM

      });

    }
  );


  // =========================================================
  // SPORT SUMMARY HELPERS
  // =========================================================

  function cleanSport(
    sport
  ) {

    if (
      sport === null ||
      sport === undefined ||
      sport === ""
    ) {

      return (
        "Not recorded"
      );

    }


    return (
      String(
        sport
      )
    );

  }


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
          cleanSport(
            feature.attributes.Sport
          );


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


  function countUniqueSports(
    features
  ) {

    return (
      Object.keys(
        countSports(
          features
        )
      ).length
    );

  }


  function sportLabelHtml(
    sport
  ) {

    const colour =
      sportColours[sport] ||
      [
        145,
        145,
        145
      ];


    const label =
      sport === "Sports Hall"
        ? "Sports Halls"
        : sport;


    return `
      <span class="analysis-sport">
          <span
              class="analysis-swatch"
              style="background:rgb(${colour[0]},${colour[1]},${colour[2]})"
          ></span>
          ${escapeHtml(label)}
      </span>
    `;

  }


  // =========================================================
  // FORMATTERS
  // =========================================================

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


    tag.style.backgroundColor =
      `rgb(${colour[0]},${colour[1]},${colour[2]})`;

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


  function formatPoolDimension(
    value
  ) {

    if (
      value === null ||
      value === undefined ||
      value === "" ||
      isNaN(
        Number(
          value
        )
      )
    ) {

      return (
        "Not recorded"
      );

    }


    return (
      Number(
        value
      ).toLocaleString(
        "en-IE",
        {
          maximumFractionDigits:
            1
        }
      ) +
      " m"
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


  function cleanValue(
    value
  ) {

    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === " " ||
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


  function formatArea(
    value
  ) {

    const area =
      Number(
        value
      );


    if (
      !Number.isFinite(
        area
      )
    ) {

      return (
        "Not recorded"
      );

    }


    if (
      area >=
      10000
    ) {

      return (
        (
          area /
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
      area.toLocaleString(
        "en-IE",
        {
          maximumFractionDigits:
            0
        }
      ) +
      " m²"
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

});
