//global variables
const GREEN_SPACES_GRADIENT  = Gradient.generate("#40FF33","#FF3333",101)
const NEIGHBORHOODS_GRADIENT = Gradient.generate("#6BCFF6","#FCB814",101)
const MAX_LOOP_ALLOWED = 10
let keep_collecting_flights = true

//draw parameters
let draw_boundaries_green_spaces = false
let draw_sampled_points_green_spaces = false
let draw_center_most_point_green_spaces = false

//html elements
const loading_overlay = document.getElementById('loading-div')
const alerte_credit   = document.getElementById('alerte-credit')
const legend          = document.getElementById('legend')
const filtres          = document.getElementById('filtre')

const toggle_loading = (bool)   => {if(bool){loading_overlay.style.display="flex" }else{loading_overlay.style.display = "none"}} 
const toggle_alerte  = (bool)   => {if(bool){alerte_credit.style.display="block"}else{alerte_credit.style.display = "none"}}
const toggle_legend  = (height) => {if(height === "35px"){legend.style.height="300px"; legend.style.width="300px"}else{legend.style.height="35px"; legend.style.width="120px"}}
const toggle_filtre  = (height) => {if(height === "35px"){filtres.style.height="fit-content"; filtres.style.width="300px"} }//else{filtres.style.height="35px"; filtres.style.width="120px"}}


//Sliders
var sliderNeighboor = document.getElementById('slider');
var sliderGreenSpacesAltitude = document.getElementById('slider1');
var sliderPlanes = document.getElementById('slider2');
var sliderAngle = document.getElementById('slider3');

//nb results
const input_nb_result = document.getElementById('input-filtre')

//ranking method selector
const method_selector = document.getElementById("ranking-method-selector")

//bouton valider
const btn_validate    = document.getElementById('buttonvalidate')

btn_validate.addEventListener('click', () => compute_results())


var range_sliderNeighboor = {
    'min': [     1 ],
    'max': [ 30000 ]
};


noUiSlider.create(sliderNeighboor, {
    start: [1, 30000],
    connect : true,
    range: range_sliderNeighboor,
    pips: {
        mode: 'range',
        density: 3
    }
});

var range_sliderGreenSpacesAltitude = {
    'min': [120],
    'max': [250]
};

noUiSlider.create(sliderGreenSpacesAltitude, {
    start: [120, 250],
    connect : true,
    range: range_sliderGreenSpacesAltitude,
    pips: {
        mode: 'range',
        density: 3
    }
});

var range_sliderPlanes = {
    'min': [     0 ],
    'max': [ 11000 ]
};


noUiSlider.create(sliderPlanes, {
    start: [10, 2000],
    connect : true,
    range: range_sliderPlanes,
    pips: {
        mode: 'range',
        density: 3
    }
});

var range_sliderAngle = {
    'min': [  0 ],
    'max': [ 90 ]
};


noUiSlider.create(sliderAngle, {
    start: [20, 60],
    connect : true,
    range: range_sliderAngle,
    pips: {
        mode: 'range',
        density: 3
    }
});


function compute_results() {
    toggle_loading(true)

    let rangeNeighboor = sliderNeighboor.noUiSlider.get();
    let rangeGreenSpacesAltitude = sliderGreenSpacesAltitude.noUiSlider.get();
    let rangePlanes = sliderPlanes.noUiSlider.get();
    let rangeAngle = sliderAngle.noUiSlider.get();
    let ranking_method = method_selector.options[method_selector.selectedIndex].text
    let nb_results = input_nb_result.value

    console.log(ranking_method)

    rank_green_space_based_on_flight_path(
        3, 8000,
        rangeGreenSpacesAltitude[0], rangeGreenSpacesAltitude[1],
        rangePlanes[0], rangePlanes[1],
        rangeAngle[0], rangeAngle[1],
        nb_results
    )


    // rank_green_space_based_on_flight_path(
    //     30, 8000,
    //     50, 999999,
    //     1000, 1500,
    //     15, 50,
    //     10
    // )
    rank_green_spaces_based_on_population_density()
    final_score_evaluation(ranking_method)
    show_best_green_spaces(15)

    toggle_loading(false)
}



legend.addEventListener("click", () => toggle_legend(getComputedStyle(legend).height));
filtres.addEventListener("click", () => toggle_filtre(getComputedStyle(filtres).height));

//data storage
const FILE_NAME_GREEN_SPACES  = "green_spaces.json"
const FILE_NAME_NEIGHBORHOODS = "neighborhoods.json"
const FILE_NAME_FLIGHTS       = "flights.json"


//map layers setup

//base map layer
const base_map = L.tileLayer('https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=Xcj0EoRZaKvfdhgrIsAb', {maxZoom: 19})
//neighborhood population layer
const nbgh_pop = L.layerGroup()
//green spaces average altitude layer
const grsp_ava = L.layerGroup()
//markers for altitude layer
const mrkr_lbl = L.layerGroup()
//flights positions layer
const flgt_pos = L.layerGroup()
//flights curved path layer
const flgt_pth = L.layerGroup()
//flight path probes 
const flgt_prb = L.layerGroup()
//ranking result layers 
const rank_lyr = L.layerGroup()

const overlayMaps = {
    "labels et markers": mrkr_lbl,
    "flights points": flgt_pos,
    "fligths trajectories": flgt_pth,
    "Green spaces avg altitude": grsp_ava,
    "Neighborhood population": nbgh_pop,
    "flights trajectories probes" : flgt_prb,
    "ranking results": rank_lyr
}

const map = L.map('map', {
    center: [43.60058737045903, 1.4407218792739667],
    zoom: 14,
    layers: [base_map, flgt_pth, grsp_ava, nbgh_pop, rank_lyr]
});

const layerControl = L.control.layers({}, overlayMaps).addTo(map)

map.on('zoomend', function() {
    if (map.getZoom() > 16){
        map.removeLayer(mrkr_lbl);
    } else {
        map.addLayer(mrkr_lbl);
    }
});

map.on('click', function(e) {
    console.log("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng)
});

//collecte des données
let GREEN_SPACES       = []
let ALTITUDES_RANGE    = []
let NEIGHBORHOODS      = []
let POPULATION_RANGE   = [1000, 18000]
let FLIGHTS            = {}
let DRAWED_FLIGHTS     = {}
let GREEN_SPACES_RANKS = {}
let BEST_GREEN_SPACES_MARKERS = []

async function collect_data_from_apis() {
    
    const green_spaces_and_altitudes_data  = await collect_green_spaces()
    const neighborhood_and_population_data = await collect_neighborhoods()

    ALTITUDES_RANGE  = green_spaces_and_altitudes_data[0]
    GREEN_SPACES     = green_spaces_and_altitudes_data[1]
    NEIGHBORHOODS    = neighborhood_and_population_data
}

async function collect_data_from_stored_files() {
    await fetch('./data/'+FILE_NAME_GREEN_SPACES)
        .then(data => data.json())
        .then( data => {
            GREEN_SPACES    = data.green_spaces
            ALTITUDES_RANGE = data.altitudes_range
        })
    await fetch('./data/'+FILE_NAME_NEIGHBORHOODS)
        .then(data => data.json())
        .then( data => {
            NEIGHBORHOODS = data
        })
    await fetch('./data/'+FILE_NAME_FLIGHTS)
        .then(data => data.json())
        .then( data => {
            FLIGHTS = data
        })
}


function store_data_to_files() {
    download(JSON.stringify({green_spaces:GREEN_SPACES, altitudes_range: ALTITUDES_RANGE}), FILE_NAME_GREEN_SPACES , "text/plain");
    download(JSON.stringify(NEIGHBORHOODS), FILE_NAME_NEIGHBORHOODS, "text/plain");
}

function pre_populate_rankings() {
    for (const green_space of GREEN_SPACES) {
        GREEN_SPACES_RANKS[green_space.green_space.recordid] = {flight_path_count_score: 0, population_density_score: 0, final_score: 0}
    }
}

//dessin des informations sur la carte
async function draw_layers() {
    draw_neighborhood()
    draw_green_spaces()
    draw_flights()
}

//logique de chargement et affichage des données

async function init() {
    toggle_loading(true)
    //await collect_data_from_apis()
    await collect_data_from_stored_files()
    pre_populate_rankings()
    toggle_loading(false)
    //store_data_to_files()
    draw_layers()
    //mark_green_spaces(GREEN_SPACES, NEIGHBORHOODS)
}

init()