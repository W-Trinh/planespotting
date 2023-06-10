//global variables
const GRADIENT = Gradient.generate("#40FF33","#FF3333",101)
const MAX_LOOP_ALLOWED = 10
const MAX_ALTITUDE = 300
const MIN_ALTITUDE = 100

//draw parameters
let draw_boundaries_green_spaces = false
let draw_sampled_points_green_spaces = false
let draw_center_most_point_green_spaces = false

//html elements
const loading_overlay = document.getElementById('loading-div')

//data storage

var map = L.map('map', {
    center: [43.60058737045903, 1.4407218792739667],
    zoom: 14
});
L.tileLayer('https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=Xcj0EoRZaKvfdhgrIsAb', {maxZoom: 19}).addTo(map);


//collecte des données
let green_spaces = []
let altitudes_range = []

async function collect_data() {
    loading_overlay.style.display = "flex"
    const green_spaces_and_altitudes_data = await collect_espaces_verts()
    loading_overlay.style.display = "none"

    altitudes_range = green_spaces_and_altitudes_data[0]
    green_spaces    = green_spaces_and_altitudes_data[1]
}


//dessin des informations sur la carte
async function draw_layers() {
    await collect_data()

    for (const green_space of green_spaces) {
        const shape = green_space.green_space.fields.geo_shape;
        const fields = green_space.green_space.fields;
        const popupContent = `<strong>${fields.nom}</strong><br>Type: ${fields.type} <br>Altitude moyenne: ${green_space.avg_altitude} m   ` //<br>Surface: ${fields.surface_m2} m²`;
        const color = GRADIENT[percent_on_range(green_space.avg_altitude, altitudes_range[0], altitudes_range[1])]
        L.geoJson(shape, 
            {
                style: {
                    fillColor: color, 
                    fillOpacity: 0.5,    
                    color: color,     
                    weight: 1            
                }
            }
        ).bindPopup(popupContent).addTo(map);
    } 
}

draw_layers()
