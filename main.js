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
const toggle_loading = (bool)   => {if(bool){loading_overlay.style.display="flex" }else{loading_overlay.style.display = "none"}} 
const toggle_alerte  = (bool)   => {if(bool){alerte_credit.style.display="block"}else{alerte_credit.style.display = "none"}}
const toggle_legend  = (height) => {if(height === "35px"){legend.style.height="300px"; legend.style.width="300px"}else{legend.style.height="35px"; legend.style.width="120px"}}
legend.addEventListener("click", () => toggle_legend(getComputedStyle(legend).height));
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

const overlayMaps = {
    "labels et markers": mrkr_lbl,
    "flights points": flgt_pos,
    "fligths trajectories": flgt_pth,
    "Green spaces avg altitude": grsp_ava,
    "Neighborhood population": nbgh_pop,
    "flights trajectories probes" : flgt_prb
}

const map = L.map('map', {
    center: [43.60058737045903, 1.4407218792739667],
    zoom: 14,
    layers: [base_map, mrkr_lbl, flgt_prb, flgt_pos, flgt_pth, grsp_ava, nbgh_pop]
});

const layerControl = L.control.layers({}, overlayMaps).addTo(map)

map.on('zoomend', function() {
    if (map.getZoom() > 16){
        map.removeLayer(mrkr_lbl);
    } else {
        map.addLayer(mrkr_lbl);
    }
});

//collecte des données
let GREEN_SPACES     = []
let ALTITUDES_RANGE  = []
let NEIGHBORHOODS    = []
let POPULATION_RANGE = [1000, 18000]
let FLIGHTS          = {}
let DRAWED_FLIGHTS   = {}

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

//dessin des informations sur la carte
async function draw_layers() {
    draw_neighborhood()
    draw_green_spaces()
    draw_flights()
    //trucs rouges
    draw_probes_of(20)
}

//logique de chargement et affichage des données

async function init() {
    toggle_loading(true)
    //await collect_data_from_apis()
    await collect_data_from_stored_files()
    toggle_loading(false)
    //store_data_to_files()
    draw_layers()
    
}

init()